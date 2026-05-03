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

        const facadeMatch = lineText.match(new RegExp(`(\\w+)::${word}`));
        if (facadeMatch) {
            const facadeName = facadeMatch[1];
            const resolution = await this.facadeResolver.resolve(facadeName);
            if (resolution) {
                return this.createHover(facadeName, resolution.className, 'Facade', document, resolution);
            }
        }

        const helperMatch = lineText.match(new RegExp(`(${word})\\s*\\(`));
        if (helperMatch) {
            const helperName = helperMatch[1];
            const resolution = await this.facadeResolver.resolve(helperName);
            if (resolution) {
                return this.createHover(helperName, resolution.className, 'Global Helper', document, resolution);
            }
        }

        const resolution = await this.facadeResolver.resolve(word);
        if (resolution) {
            return this.createHover(word, resolution.className, 'Laravel Service', document, resolution);
        }

        return null;
    }

    private extractClassDocblock(content: string, className: string): string | null {
        const shortName = className.split('\\').pop() || '';
        const regex = new RegExp(`\\/\\*\\*[\\s\\S]*?\\*\\/\\s*(?:final\\s+|abstract\\s+)?class\\s+${shortName}`, 'm');
        const match = content.match(regex);
        if (match) {
            const lines = match[0].split('\n')
                .map(line => line.trim().replace(/^\/\*\*|^\*\/|^\*/, '').trim())
                .filter(line => line.length > 0 && !line.startsWith('@'));
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
        md.supportThemeIcons = true;
        
        const config = vscode.workspace.getConfiguration('laravelFacadeResolver');
        const showSolid = config.get<boolean>('education.showSolidTips', true);

        const importUri = vscode.Uri.parse(`command:laravelFacadeResolver.importClass?${encodeURIComponent(JSON.stringify([resolvedClass]))}`);
        const bindingUri = vscode.Uri.parse(`command:laravelFacadeResolver.goToBinding?${encodeURIComponent(JSON.stringify([facadeName]))}`);
        
        // 1. TOP PRIORITY: Documentation Header & Definition
        md.appendMarkdown(`🏗️ **${prefix}:** \`${resolvedClass}\`\n\n`);

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

        md.appendMarkdown(`---\n\n`);

        // 2. MIDDLE: Contextual Advice
        if (resolution.advice) {
            md.appendMarkdown(`💡 **Tip:** ${resolution.advice}\n\n`);
        }

        // 3. BOTTOM: Architectural Mentorship
        if (showSolid) {
            md.appendMarkdown(`### 🏗️ **Architectural Mentorship**\n\n`);

            const srpAdvice = await this.educationProvider.getSrpAdvice(document);
            if (srpAdvice) {
                md.appendMarkdown(`#### ${srpAdvice.title}\n${srpAdvice.content}\n\n`);
            }

            const dipAdvice = this.educationProvider.getDipAdvice(facadeName, resolvedClass);
            md.appendMarkdown(`#### ${dipAdvice.title}\n${dipAdvice.content}\n\n`);

            const ispAdvice = this.educationProvider.getIspAdvice(resolvedClass, facadeName);
            if (ispAdvice) {
                md.appendMarkdown(`#### ${ispAdvice.title}\n${ispAdvice.content}\n\n`);
            }

            const lspAdvice = this.educationProvider.getLspOcpAdvice(facadeName);
            md.appendMarkdown(`#### ${lspAdvice.title}\n${lspAdvice.content}\n\n`);
            
            md.appendMarkdown(`#### 🧪 Testing & Mocking\n`);
            md.appendCodeblock(`$this->instance(${resolvedClass}::class, Mockery::mock(${resolvedClass}::class));`, 'php');
        }

        // 4. FOOTER: Actions & Links
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
