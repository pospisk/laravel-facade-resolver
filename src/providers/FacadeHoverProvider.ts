import * as vscode from 'vscode';
import { DefinitionFinder } from '../utils/DefinitionFinder.js';
import { IFacadeResolver, FacadeResolution } from '../interfaces/IFacadeResolver.js';
import { GlobalHelperResolver } from '../resolvers/GlobalHelperResolver.js';
import { SolidEducationProvider } from './SolidEducationProvider.js';
import { ConfigParser } from '../utils/ConfigParser.js';

export class FacadeHoverProvider implements vscode.HoverProvider {
    private definitionFinder: DefinitionFinder;
    private facadeResolver: IFacadeResolver;
    private globalHelperResolver: GlobalHelperResolver;
    private educationProvider: SolidEducationProvider;

    constructor(definitionFinder: DefinitionFinder, facadeResolver: IFacadeResolver) {
        this.definitionFinder = definitionFinder;
        this.facadeResolver = facadeResolver;
        this.globalHelperResolver = new GlobalHelperResolver();
        this.educationProvider = new SolidEducationProvider();
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
        const lineText = document.lineAt(position.line).text;
        const linePrefix = lineText.substring(0, wordRange.start.character);
        const lineSuffix = lineText.substring(wordRange.end.character);

        // Check for config(), route(), view() helpers
        const helperMatch = linePrefix.match(/(config|route|view)\s*\(\s*['"]$/);
        if (helperMatch) {
            const helperType = helperMatch[1];
            return this.provideValidationHover(helperType, word);
        }

        const isFacadeCall = lineSuffix.startsWith('::');
        const isFunctionCall = /^\s*\(/.test(lineSuffix);
        const isObjectMethodCall = /(->|\?->|::)\s*$/.test(linePrefix);
        const isGlobalHelperCall = isFunctionCall && !isObjectMethodCall;

        if (!isFacadeCall && !isGlobalHelperCall) {
            // Check if we are on a method call of a facade, e.g., Inertia::render()
            // We need to look back to see if there's a :: before the word
            if (linePrefix.endsWith('::')) {
                const facadeRange = document.getWordRangeAtPosition(new vscode.Position(position.line, wordRange.start.character - 3));
                if (facadeRange) {
                    const facadeName = document.getText(facadeRange);
                    return this.provideMethodHover(facadeName, word, document, position);
                }
            }
            return null;
        }

        if (isGlobalHelperCall) {
            const resolvedResult = await this.globalHelperResolver.resolve(word);
            if (resolvedResult) {
                return this.createHover(word, resolvedResult.className, 'Global Helper:', document, resolvedResult);
            }
            return null;
        }

        // 1. Try to see if it's a known core facade by its class name
        const directResolveClass = this.resolveByFacadeName(word);
        if (directResolveClass) {
            return this.createHover(word, directResolveClass, 'Facade Resolver:', document, { className: directResolveClass, lifecycle: 'singleton' });
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

        const startLine = Math.max(0, targetRange.start.line - 5);
        const endLine = Math.min(lines.length, targetRange.start.line + 25);
        const chunk = lines.slice(startLine, endLine).join('\n');

        const seeMatch = chunk.match(/@see\s+\\?([A-Za-z0-9_]+(?:\\[A-Za-z0-9_]+)+)/);
        if (seeMatch) {
            return this.createHover(word, seeMatch[1], 'Facade Resolver:', document, { className: seeMatch[1], lifecycle: 'unknown' });
        }

        const accessorMatch = chunk.match(/protected\s+static\s+function\s+getFacadeAccessor\(\)\s*\{\s*return\s+['"]([^'"]+)['"]/);
        
        if (!accessorMatch) {
            const classMatch = chunk.match(/protected\s+static\s+function\s+getFacadeAccessor\(\)\s*\{\s*return\s+([A-Za-z0-9_\\\\]+)::class/);
            if (classMatch) {
                return this.createHover(word, classMatch[1], 'Facade Resolver:', document, { className: classMatch[1], lifecycle: 'unknown' });
            }
            return null;
        }

        const accessorKey = accessorMatch[1];
        const resolvedResult = await this.facadeResolver.resolve(accessorKey);
        
        if (resolvedResult) {
            return this.createHover(word, resolvedResult.className, 'Facade Resolver:', document, resolvedResult);
        }

        return null;
    }

    private async provideMethodHover(facadeName: string, methodName: string, document: vscode.TextDocument, position: vscode.Position): Promise<vscode.Hover | null> {
        const returnTypeMap: Record<string, Record<string, string>> = {
            'Inertia': { 'render': '\\Inertia\\Response' },
            'Response': { 'json': '\\Illuminate\\Http\\JsonResponse' },
            'View': { 'make': '\\Illuminate\\View\\View' },
            'Route': { 'get': '\\Illuminate\\Routing\\Route' }
        };

        const returnType = returnTypeMap[facadeName]?.[methodName];
        if (returnType) {
            const md = new vscode.MarkdownString();
            md.isTrusted = true;
            md.appendMarkdown(`✨ **Method Return Type Hint**\n\n`);
            md.appendMarkdown(`Suggests adding this above your method:\n`);
            md.appendCodeblock(`/** @return ${returnType} */`, 'php');
            return new vscode.Hover(md);
        }
        return null;
    }

    private async provideValidationHover(type: string, key: string): Promise<vscode.Hover | null> {
        const md = new vscode.MarkdownString();
        md.isTrusted = true;
        
        md.appendMarkdown(`🔍 **${type.charAt(0).toUpperCase() + type.slice(1)} Validation**\n\n`);
        md.appendMarkdown(`Key: \`${key}\`\n\n`);

        let exists = false;
        let detail = '';

        if (type === 'config') {
            const parts = key.split('.');
            const fileName = parts[0];
            const configFile = `config/${fileName}.php`;
            const keys = await ConfigParser.getKeys(configFile);
            
            if (keys.length > 0) {
                exists = keys.some(k => k === key || k.startsWith(key + '.'));
                if (!exists) {
                    detail = `File \`${configFile}\` found, but key \`${key}\` not detected.`;
                }
            } else {
                detail = `Could not find config file \`${configFile}\`.`;
            }
        } else if (type === 'view') {
            const viewPath = key.replace(/\./g, '/') + '.blade.php';
            const files = await vscode.workspace.findFiles(`resources/views/${viewPath}`);
            exists = files.length > 0;
            if (!exists) {
                detail = `View file \`resources/views/${viewPath}\` not found.`;
            }
        } else if (type === 'route') {
            // Placeholder for route validation
            exists = true; 
        }

        if (exists) {
            md.appendMarkdown(`✅ Key/File exists in project.`);
        } else {
            md.appendMarkdown(`❌ **Warning:** ${detail || `Could not find \`${key}\` in the expected location.`}`);
        }
        
        return new vscode.Hover(md);
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
            'Vite': 'Illuminate\\Foundation\\Vite',
            'Inertia': 'Inertia\\Inertia'
        };

        return coreFacadesByName[name] || null;
    }

    private extractClassDocblock(content: string, className: string): string | null {
        const shortName = className.split('\\').pop() || className;
        // Look for docblock right before class definition
        const regex = new RegExp(`(/\\*\\*[\\s\\S]*?\\*/)\\s*(?:abstract\\s+|final\\s+)?(?:class|interface)\\s+${shortName}`, 'm');
        const match = content.match(regex);
        if (match) {
            const rawDoc = match[1];
            // Clean up: remove stars and leading/trailing whitespace
            const lines = rawDoc.split('\n')
                .map(line => line.trim().replace(/^\/\*\*|^\*\/|^\*/, '').trim())
                .filter(line => line.length > 0 && !line.startsWith('@')); // Filter out @tags
            return lines.join(' ');
        }
        return null;
    }

    private async createHover(facadeName: string, resolvedClass: string, prefix: string, document: vscode.TextDocument, resolution: FacadeResolution): Promise<vscode.Hover> {
        if (resolvedClass.startsWith('\\')) {
            resolvedClass = resolvedClass.substring(1);
        }
        const md = new vscode.MarkdownString();
        md.isTrusted = true;
        
        const config = vscode.workspace.getConfiguration('laravelFacadeResolver');
        const showSolid = config.get<boolean>('education.showSolidTips', true);
        const density = config.get<string>('education.density', 'full');

        md.appendMarkdown(`### $(package) Contract: \`${resolvedClass}\`\n\n`);

        // Docstring Proxying
        const classUri = await this.definitionFinder.findClassUri(resolvedClass);
        if (classUri) {
            try {
                const classContentBytes = await vscode.workspace.fs.readFile(classUri);
                const classContent = Buffer.from(classContentBytes).toString('utf-8');
                const docblock = this.extractClassDocblock(classContent, resolvedClass);
                if (docblock) {
                    md.appendMarkdown(`> ${docblock}\n\n`);
                }
            } catch (e) {}
        }
        
        if (resolution.lifecycle && resolution.lifecycle !== 'unknown') {
            const lifecycleIcon = resolution.lifecycle === 'singleton' ? '$(lock)' : '$(refresh)';
            md.appendMarkdown(`**Lifecycle:** ${lifecycleIcon} *${resolution.lifecycle || 'unknown'}*\n\n`);
        }

        md.appendMarkdown(`---\n\n`);

        const commandUri = vscode.Uri.parse(`command:laravelFacadeResolver.importClass?${encodeURIComponent(JSON.stringify(resolvedClass))}`);
        md.appendMarkdown(`🎯 **${prefix}** [Import](${commandUri}) \`use ${resolvedClass};\``);

        if (showSolid) {
            md.appendMarkdown(`\n\n---\n\n`);
            md.appendMarkdown(`### 🏗️ SOLID Education\n\n`);

            const srpAdvice = await this.educationProvider.getSrpAdvice(document);
            if (srpAdvice) {
                md.appendMarkdown(`#### ${srpAdvice.title}\n${srpAdvice.content}\n\n`);
            }

            const dipAdvice = this.educationProvider.getDipAdvice(facadeName, resolvedClass);
            md.appendMarkdown(`#### ${dipAdvice.title}\n${dipAdvice.content}\n\n`);

            if (density === 'full') {
                const ispAdvice = this.educationProvider.getIspAdvice(resolvedClass);
                if (ispAdvice) {
                    md.appendMarkdown(`#### ${ispAdvice.title}\n${ispAdvice.content}\n\n`);
                }

                const lspAdvice = this.educationProvider.getLspOcpAdvice(facadeName);
                md.appendMarkdown(`#### ${lspAdvice.title}\n${lspAdvice.content}\n\n`);
                
                // Testing snippet
                md.appendMarkdown(`#### 🧪 Testing & Mocking\n`);
                md.appendMarkdown(`Since you are using DI, you can easily mock this in your tests:\n`);
                md.appendCodeblock(`$this->instance(${resolvedClass}::class, Mockery::mock(${resolvedClass}::class));`, 'php');
            }

            md.appendMarkdown(`[Go to Binding](command:laravelFacadeResolver.goToBinding?${encodeURIComponent(JSON.stringify(facadeName))})`);
        }
        
        return new vscode.Hover(md);
    }
}
