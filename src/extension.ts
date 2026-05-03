import * as vscode from 'vscode';
import { FacadeHoverProvider } from './providers/FacadeHoverProvider.js';
import { DefinitionFinder } from './utils/DefinitionFinder.js';
import { CoreFacadeResolver } from './resolvers/CoreFacadeResolver.js';
import { CustomFacadeResolver } from './resolvers/CustomFacadeResolver.js';
import { FacadeResolver } from './resolvers/FacadeResolver.js';
import { FacadeCodeLensProvider } from './providers/FacadeCodeLensProvider.js';
import { ArchitecturalCodeActionProvider } from './providers/ArchitecturalCodeActionProvider.js';
import { DIFactor } from './utils/DIFactor.js';
import { HealthReportProvider } from './providers/HealthReportProvider.js';

export function activate(context: vscode.ExtensionContext) {
    const config = vscode.workspace.getConfiguration('laravelFacadeResolver');
    if (!config.get<boolean>('enable', true)) {
        return;
    }

    // Composition Root: Construct dependencies
    const definitionFinder = new DefinitionFinder();
    
    // Setup resolvers (Chain of Responsibility pattern)
    const coreResolver = new CoreFacadeResolver();
    const customResolver = new CustomFacadeResolver();
    
    // Orchestrator
    const facadeResolver = new FacadeResolver([
        coreResolver,
        customResolver
    ]);

    const hoverProvider = new FacadeHoverProvider(definitionFinder, facadeResolver);
    const codeLensProvider = new FacadeCodeLensProvider();
    const codeActionProvider = new ArchitecturalCodeActionProvider(facadeResolver);

    // Languages to support
    const documentSelectors = [
        { scheme: 'file', language: 'php', pattern: '**/*.php' },
        { scheme: 'file', language: 'blade', pattern: '**/*.blade.php' },
        { scheme: 'untitled', language: 'php' }
    ];

    // Register providers
    const hoverDisposable = vscode.languages.registerHoverProvider(documentSelectors, hoverProvider);
    const codeLensDisposable = vscode.languages.registerCodeLensProvider(documentSelectors, codeLensProvider);
    const codeActionDisposable = vscode.languages.registerCodeActionsProvider(documentSelectors, codeActionProvider);

    // Register commands
    const importCommand = vscode.commands.registerCommand('laravelFacadeResolver.importClass', async (fqcn: string) => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) { return; }

        const document = editor.document;
        const text = document.getText();

        // Check if already imported
        const escapedFqcn = fqcn.replace(/\\/g, '\\\\');
        const useRegex = new RegExp(`^use\\s+${escapedFqcn}\\s*;`, 'm');
        if (useRegex.test(text)) {
            vscode.window.showInformationMessage(`${fqcn} is already imported.`);
            return;
        }

        // Find insertion point
        let insertPosition: vscode.Position;
        let insertText = `use ${fqcn};\n`;

        const useStatementsRegex = /^use\s+[\w\\]+(?:\s+as\s+\w+)?\s*;/gm;
        let match;
        let lastUseLine = -1;
        while ((match = useStatementsRegex.exec(text)) !== null) {
            const position = document.positionAt(match.index);
            lastUseLine = position.line;
        }

        if (lastUseLine !== -1) {
            insertPosition = new vscode.Position(lastUseLine + 1, 0);
        } else {
            const namespaceRegex = /^namespace\s+[\w\\]+\s*;/m;
            const nsMatch = namespaceRegex.exec(text);
            if (nsMatch) {
                const position = document.positionAt(nsMatch.index);
                insertPosition = new vscode.Position(position.line + 1, 0);
                insertText = `\nuse ${fqcn};\n`;
            } else {
                const phpTagRegex = /^<\?php\s*/m;
                const phpMatch = phpTagRegex.exec(text);
                if (phpMatch) {
                    const position = document.positionAt(phpMatch.index);
                    insertPosition = new vscode.Position(position.line + 1, 0);
                    insertText = `\nuse ${fqcn};\n`;
                } else {
                    insertPosition = new vscode.Position(0, 0);
                }
            }
        }

        await editor.edit(editBuilder => {
            editBuilder.insert(insertPosition, insertText);
        });
    });

    const convertToDICommand = vscode.commands.registerCommand('laravelFacadeResolver.convertToDI', async (document: vscode.TextDocument, range: vscode.Range, contractFqcn: string) => {
        const facadeName = document.getText(range);
        await DIFactor.convertToDI(document, facadeName, contractFqcn);
    });

    const goToBindingCommand = vscode.commands.registerCommand('laravelFacadeResolver.goToBinding', async (facadeName: string) => {
        // Heuristic: Search for binding in ServiceProviders
        const files = await vscode.workspace.findFiles('app/Providers/*.php');
        for (const file of files) {
            const content = await vscode.workspace.fs.readFile(file);
            const text = Buffer.from(content).toString('utf-8');
            if (text.includes(facadeName.toLowerCase()) || text.includes(`'${facadeName}'`) || text.includes(`"${facadeName}"`)) {
                const document = await vscode.workspace.openTextDocument(file);
                await vscode.window.showTextDocument(document);
                return;
            }
        }
        vscode.window.showInformationMessage(`Could not find explicit binding for ${facadeName} in app/Providers.`);
    });

    const analyzeHealthCommand = vscode.commands.registerCommand('laravelFacadeResolver.analyzeHealth', async () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            await HealthReportProvider.analyze(editor.document);
        }
    });

    const bulkConvertToDICommand = vscode.commands.registerCommand('laravelFacadeResolver.bulkConvertToDI', async () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            await DIFactor.bulkConvertToDI(editor.document);
        }
    });

    const copyMockCommand = vscode.commands.registerCommand('laravelFacadeResolver.copyMock', async (document: vscode.TextDocument, className: string) => {
        await DIFactor.generateTestMock(document, className);
    });

    context.subscriptions.push(hoverDisposable, codeLensDisposable, codeActionDisposable, importCommand, convertToDICommand, goToBindingCommand, analyzeHealthCommand, bulkConvertToDICommand, copyMockCommand);
}

export function deactivate() {}
