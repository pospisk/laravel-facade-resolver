import * as vscode from 'vscode';
import { DefinitionFinder } from '../utils/DefinitionFinder.js';
import { FacadeResolver } from '../resolvers/FacadeResolver.js';
import { SolidEducationProvider } from './SolidEducationProvider.js';
import { FacadeResolution } from '../interfaces/IFacadeResolver.js';

export class FacadeHoverProvider implements vscode.HoverProvider {
    private educationProvider: SolidEducationProvider;

    constructor(
        private definitionFinder: DefinitionFinder,
        private facadeResolver: FacadeResolver
    ) {
        this.educationProvider = new SolidEducationProvider();
    }

    public async provideHover(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): Promise<vscode.Hover | null> {
        const range = document.getWordRangeAtPosition(position);
        if (!range) {
            return null;
        }

        const word = document.getText(range);
        const lineText = document.lineAt(position.line).text;

        const facadeMatch = lineText.match(new RegExp(`(\\w+)::(${word})`));
        if (facadeMatch) {
            const facadeName = facadeMatch[1];
            const method = facadeMatch[2];
            const resolution = await this.facadeResolver.resolve(facadeName, method);
            if (resolution) {
                return this.createHover(facadeName, resolution.className, 'Facade', document, position, resolution);
            }
        }

        const fluentMatch = lineText.match(new RegExp(`(\\w+)::(\\w+)\\(.*?\\)->(${word})`));
        if (fluentMatch) {
            const facadeName = fluentMatch[1];
            const method = fluentMatch[3];
            const resolution = await this.facadeResolver.resolve(facadeName, method);
            if (resolution) {
                return this.createHover(facadeName, resolution.className, 'Facade (Fluent)', document, position, resolution);
            }
        }

        const helperMatch = lineText.match(new RegExp(`(${word})\\s*\\(`));
        if (helperMatch) {
            const helperName = helperMatch[1];
            const resolution = await this.facadeResolver.resolve(helperName);
            if (resolution) {
                return this.createHover(helperName, resolution.className, 'Global Helper', document, position, resolution);
            }
        }

        const helperFluentMatch = lineText.match(new RegExp(`(\\w+)\\s*\\(.*?\\)->(${word})`));
        if (helperFluentMatch) {
            const helperName = helperFluentMatch[1];
            const method = helperFluentMatch[2];
            const resolution = await this.facadeResolver.resolve(helperName, method);
            if (resolution) {
                return this.createHover(helperName, resolution.className, 'Global Helper (Fluent)', document, position, resolution);
            }
        }

        const resolution = await this.facadeResolver.resolve(word);
        if (resolution) {
            return this.createHover(word, resolution.className, 'Laravel Service', document, position, resolution);
        }

        return null;
    }

    private async extractDocblockAt(uri: vscode.Uri, range: vscode.Range): Promise<string | null> {
        try {
            const contentBytes = await vscode.workspace.fs.readFile(uri);
            const content = Buffer.from(contentBytes).toString('utf-8');
            const lines = content.split('\n');
            const startLine = range.start.line;
            
            let docLines: string[] = [];
            let inDoc = false;
            
            for (let i = startLine - 1; i >= 0; i--) {
                const line = lines[i].trim();
                if (line.endsWith('*/')) inDoc = true;
                if (inDoc) {
                    docLines.unshift(line.replace(/^\/\*\*|^\*\/|^\*/, '').trim());
                }
                if (line.startsWith('/**')) break;
                if (!inDoc && line.length > 0 && !line.startsWith('[') && !line.startsWith('@')) break; 
            }
            
            return docLines.filter(l => l.length > 0 && !l.startsWith('@')).join(' ');
        } catch (e) {
            return null;
        }
    }

    private async createHover(facadeName: string, resolvedClass: string, prefix: string, document: vscode.TextDocument, position: vscode.Position, resolution: FacadeResolution): Promise<vscode.Hover> {
        if (resolvedClass.startsWith('\\')) {
            resolvedClass = resolvedClass.substring(1);
        }
        
        const md = new vscode.MarkdownString();
        md.isTrusted = true;
        md.supportThemeIcons = true;
        
        const config = vscode.workspace.getConfiguration('laravelFacadeResolver');
        const showSolid = config.get<boolean>('education.showSolidTips', true);

        const importUri = vscode.Uri.parse(`command:laravelFacadeResolver.importClass?${encodeURIComponent(JSON.stringify([resolvedClass]))}`);
        const bindingUri = vscode.Uri.parse(`command:laravelFacadeResolver.goToBinding?${encodeURIComponent(JSON.stringify([facadeName]))}`);
        
        // 1. AT THE VERY TOP: Proxied Definition (The "What")
        const definition = await this.definitionFinder.findDefinitionEx(document, position);
        if (definition) {
            const docblock = await this.extractDocblockAt(definition.uri, definition.range);
            if (docblock) {
                md.appendMarkdown(`**${facadeName}**\n\n> ${docblock}\n\n`);
                md.appendMarkdown(`---\n\n`);
            }
        }

        // 2. MIDDLE: Architectural Messages (The "Why")
        md.appendMarkdown(`🏗️ **${prefix}:** \`${resolvedClass}\`\n\n`);

        if (resolution.advice) {
            md.appendMarkdown(`💡 **Tip:** ${resolution.advice}\n\n`);
        }

        if (showSolid) {
            md.appendMarkdown(`### 🏗️ **Architectural Mentorship**\n\n`);

            const srpAdvice = await this.educationProvider.getSrpAdvice(document);
            if (srpAdvice) {
                md.appendMarkdown(`#### ${srpAdvice.title}\n${srpAdvice.content}\n\n`);
            }

            const dipAdvice = this.educationProvider.getDipAdvice(facadeName, resolvedClass, prefix);
            if (dipAdvice) {
                md.appendMarkdown(`#### ${dipAdvice.title}\n${dipAdvice.content}\n\n`);
            }

            const ispAdvice = this.educationProvider.getIspAdvice(resolvedClass, facadeName);
            if (ispAdvice) {
                md.appendMarkdown(`#### ${ispAdvice.title}\n${ispAdvice.content}\n\n`);
            }

            const lspAdvice = this.educationProvider.getLspOcpAdvice(facadeName, prefix);
            if (lspAdvice) {
                md.appendMarkdown(`#### ${lspAdvice.title}\n${lspAdvice.content}\n\n`);
            }
            
            const testingAdvice = this.educationProvider.getTestingAdvice(facadeName, resolvedClass);
            if (testingAdvice) {
                md.appendMarkdown(`#### 🧪 Testing & Mocking\n`);
                md.appendCodeblock(testingAdvice, 'php');
            }
        }

        // 3. FOOTER: Actions
        md.appendMarkdown(`---\n\n`);
        if (resolution.lifecycle && resolution.lifecycle !== 'unknown') {
            const lifecycleIcon = resolution.lifecycle === 'singleton' ? '🔒' : '🔄';
            md.appendMarkdown(`**Lifecycle:** ${lifecycleIcon} *${resolution.lifecycle}* • `);
        }
        
        md.appendMarkdown(`[📥 Import](${importUri}) • [🔍 Binding](${bindingUri})\n\n`);
        md.appendMarkdown(`[📖 Laravel Docs](https://laravel.com/docs) • [🎓 SOLID Guide](https://en.wikipedia.org/wiki/SOLID)`);
        
        return new vscode.Hover(md);
    }
}
