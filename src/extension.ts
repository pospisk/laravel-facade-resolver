import * as vscode from 'vscode';
import { FacadeHoverProvider } from './providers/FacadeHoverProvider.js';
import { DefinitionFinder } from './utils/DefinitionFinder.js';
import { CoreFacadeResolver } from './resolvers/CoreFacadeResolver.js';
import { CustomFacadeResolver } from './resolvers/CustomFacadeResolver.js';
import { FacadeResolver } from './resolvers/FacadeResolver.js';

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

    // Register provider
    const hoverDisposable = vscode.languages.registerHoverProvider(
        [
            { scheme: 'file', language: 'php', pattern: '**/*.php' },
            { scheme: 'untitled', language: 'php' }
        ],
        hoverProvider
    );

    // Register import command
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

        // 1. Look for the last 'use' statement
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
            // 2. Look for namespace declaration
            const namespaceRegex = /^namespace\s+[\w\\]+\s*;/m;
            const nsMatch = namespaceRegex.exec(text);
            if (nsMatch) {
                const position = document.positionAt(nsMatch.index);
                insertPosition = new vscode.Position(position.line + 1, 0);
                insertText = `\nuse ${fqcn};\n`;
            } else {
                // 3. Fallback to just after <?php
                const phpTagRegex = /^<\?php\s*/m;
                const phpMatch = phpTagRegex.exec(text);
                if (phpMatch) {
                    const position = document.positionAt(phpMatch.index);
                    insertPosition = new vscode.Position(position.line + 1, 0);
                    insertText = `\nuse ${fqcn};\n`;
                } else {
                    // Top of file
                    insertPosition = new vscode.Position(0, 0);
                }
            }
        }

        await editor.edit(editBuilder => {
            editBuilder.insert(insertPosition, insertText);
        });
    });

    context.subscriptions.push(hoverDisposable, importCommand);
}

export function deactivate() {}
