import * as vscode from 'vscode';
import { DefinitionFinder } from '../utils/DefinitionFinder.js';
import { IFacadeResolver } from '../interfaces/IFacadeResolver.js';
import { GlobalHelperResolver } from '../resolvers/GlobalHelperResolver.js';

export class FacadeHoverProvider implements vscode.HoverProvider {
    private definitionFinder: DefinitionFinder;
    private facadeResolver: IFacadeResolver;
    private globalHelperResolver: GlobalHelperResolver;

    constructor(definitionFinder: DefinitionFinder, facadeResolver: IFacadeResolver) {
        this.definitionFinder = definitionFinder;
        this.facadeResolver = facadeResolver;
        this.globalHelperResolver = new GlobalHelperResolver();
    }

    public async provideHover(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): Promise<vscode.Hover | null> {
        const wordRange = document.getWordRangeAtPosition(position);
        if (!wordRange) {
            return null;
        }

        const word = document.getText(wordRange);

        const linePrefix = document.lineAt(position.line).text.substring(0, wordRange.start.character);
        const lineSuffix = document.lineAt(position.line).text.substring(wordRange.end.character);

        const isFacadeCall = lineSuffix.startsWith('::');
        const isFunctionCall = /^\s*\(/.test(lineSuffix);
        const isObjectMethodCall = /(->|\?->|::)\s*$/.test(linePrefix);
        const isGlobalHelperCall = isFunctionCall && !isObjectMethodCall;

        if (!isFacadeCall && !isGlobalHelperCall) {
            return null;
        }

        if (isGlobalHelperCall) {
            const resolvedHelper = await this.globalHelperResolver.resolve(word);
            if (resolvedHelper) {
                return this.createHover(word, resolvedHelper, 'Global Helper:');
            }
            return null; // Don't process further if it's a function call
        }

        // 1. Try to see if it's a known core facade by its class name
        const directResolve = this.resolveByFacadeName(word);
        if (directResolve) {
            return this.createHover(word, directResolve, 'Facade Resolver:');
        }

        // 2. Find the definition of the facade class
        const definitionResult = await this.definitionFinder.findDefinitionEx(document, position);
        if (!definitionResult) {
            return null;
        }

        const { uri: targetUri, range: targetRange } = definitionResult;

        // Read the facade class content
        const facadeContentBytes = await vscode.workspace.fs.readFile(targetUri);
        const facadeContent = Buffer.from(facadeContentBytes).toString('utf-8');
        const lines = facadeContent.split(/\r?\n/);

        // Extract a chunk of lines around the definition to search for accessors or @see tags
        const startLine = Math.max(0, targetRange.start.line - 5);
        const endLine = Math.min(lines.length, targetRange.start.line + 25);
        const chunk = lines.slice(startLine, endLine).join('\n');

        // Check if it's an ide_helper file with @see annotations
        const seeMatch = chunk.match(/@see\s+\\?([A-Za-z0-9_]+(?:\\[A-Za-z0-9_]+)+)/);
        if (seeMatch) {
            return this.createHover(word, seeMatch[1], 'Facade Resolver:');
        }

        // Extract getFacadeAccessor
        const accessorMatch = chunk.match(/protected\s+static\s+function\s+getFacadeAccessor\(\)\s*\{\s*return\s+['"]([^'"]+)['"]/);
        
        if (!accessorMatch) {
            // Check if it returns a class name directly, e.g., return Something::class
            const classMatch = chunk.match(/protected\s+static\s+function\s+getFacadeAccessor\(\)\s*\{\s*return\s+([A-Za-z0-9_\\\\]+)::class/);
            if (classMatch) {
                return this.createHover(word, classMatch[1], 'Facade Resolver:');
            }
            return null;
        }

        const accessorKey = accessorMatch[1];

        // Resolve the class
        const resolvedClass = await this.facadeResolver.resolve(accessorKey);
        
        if (resolvedClass) {
            return this.createHover(word, resolvedClass, 'Facade Resolver:');
        }

        return null;
    }

    private resolveByFacadeName(name: string): string | null {
        const coreFacadesByName: Record<string, string> = {
            'App': 'Illuminate\\Foundation\\Application',
            'Artisan': 'Illuminate\\Contracts\\Console\\Kernel',
            'Auth': 'Illuminate\\Auth\\AuthManager',
            'Blade': 'Illuminate\\View\\Compilers\\BladeCompiler',
            'Broadcast': 'Illuminate\\Contracts\\Broadcasting\\Factory',
            'Bus': 'Illuminate\\Contracts\\Bus\\Dispatcher',
            'Cache': 'Illuminate\\Cache\\CacheManager',
            'Config': 'Illuminate\\Config\\Repository',
            'Context': 'Illuminate\\Log\\Context\\Repository',
            'Cookie': 'Illuminate\\Cookie\\CookieJar',
            'Crypt': 'Illuminate\\Encryption\\Encrypter',
            'Date': 'Illuminate\\Support\\DateFactory',
            'DB': 'Illuminate\\Database\\DatabaseManager',
            'Event': 'Illuminate\\Events\\Dispatcher',
            'Exceptions': 'Illuminate\\Foundation\\Exceptions\\Handler',
            'File': 'Illuminate\\Filesystem\\Filesystem',
            'Gate': 'Illuminate\\Contracts\\Auth\\Access\\Gate',
            'Hash': 'Illuminate\\Contracts\\Hashing\\Hasher',
            'Http': 'Illuminate\\Http\\Client\\Factory',
            'Lang': 'Illuminate\\Translation\\Translator',
            'Log': 'Illuminate\\Log\\LogManager',
            'Mail': 'Illuminate\\Mail\\Mailer',
            'Notification': 'Illuminate\\Notifications\\ChannelManager',
            'Password': 'Illuminate\\Contracts\\Auth\\PasswordBroker',
            'Pipeline': 'Illuminate\\Pipeline\\Pipeline',
            'Process': 'Illuminate\\Process\\Factory',
            'Queue': 'Illuminate\\Queue\\QueueManager',
            'RateLimiter': 'Illuminate\\Cache\\RateLimiter',
            'Redirect': 'Illuminate\\Routing\\Redirector',
            'Redis': 'Illuminate\\Redis\\RedisManager',
            'Request': 'Illuminate\\Http\\Request',
            'Response': 'Illuminate\\Contracts\\Routing\\ResponseFactory',
            'Route': 'Illuminate\\Routing\\Router',
            'Schedule': 'Illuminate\\Console\\Scheduling\\Schedule',
            'Schema': 'Illuminate\\Database\\Schema\\Builder',
            'Session': 'Illuminate\\Session\\SessionManager',
            'Storage': 'Illuminate\\Filesystem\\FilesystemManager',
            'URL': 'Illuminate\\Routing\\UrlGenerator',
            'Validator': 'Illuminate\\Validation\\Factory',
            'View': 'Illuminate\\View\\Factory',
            'Vite': 'Illuminate\\Foundation\\Vite'
        };

        return coreFacadesByName[name] || null;
    }

    private createHover(facadeName: string, resolvedClass: string, prefix: string): vscode.Hover {
        if (resolvedClass.startsWith('\\')) {
            resolvedClass = resolvedClass.substring(1);
        }
        const md = new vscode.MarkdownString();
        md.isTrusted = true;
        
        const commandUri = vscode.Uri.parse(`command:laravelFacadeResolver.importClass?${encodeURIComponent(JSON.stringify(resolvedClass))}`);
        md.appendMarkdown(`🎯 **${prefix}** [Import](${commandUri}) \`use ${resolvedClass};\``);
        
        return new vscode.Hover(md);
    }
}
