import * as vscode from 'vscode';
import { IFacadeResolver } from '../interfaces/IFacadeResolver.js';

export class ArchitecturalCodeActionProvider implements vscode.CodeActionProvider {
    private facadeResolver: IFacadeResolver;

    constructor(facadeResolver: IFacadeResolver) {
        this.facadeResolver = facadeResolver;
    }

    public async provideCodeActions(
        document: vscode.TextDocument,
        range: vscode.Range | vscode.Selection,
        context: vscode.CodeActionContext,
        token: vscode.CancellationToken
    ): Promise<vscode.CodeAction[]> {
        const wordRange = document.getWordRangeAtPosition(range.start);
        if (!wordRange) {
            return [];
        }

        const word = document.getText(wordRange);
        const lineText = document.lineAt(range.start.line).text;
        const isFacadeCall = lineText.includes(word + '::');

        if (!isFacadeCall) {
            return [];
        }

        const resolved = await this.facadeResolver.resolve(word);
        if (!resolved) {
            return [];
        }

        const action = new vscode.CodeAction(`🏗️ Convert ${word} to Constructor Injection`, vscode.CodeActionKind.RefactorRewrite);
        action.command = {
            command: 'laravelFacadeResolver.convertToDI',
            title: 'Convert to DI',
            arguments: [document, wordRange, resolved.className]
        };

        const mockAction = new vscode.CodeAction(`🧪 Copy Mock Snippet for ${word}`, vscode.CodeActionKind.QuickFix);
        mockAction.command = {
            command: 'laravelFacadeResolver.copyMock',
            title: 'Copy Mock',
            arguments: [document, resolved.className]
        };

        return [action, mockAction];
    }
}
