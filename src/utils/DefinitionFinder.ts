import * as vscode from 'vscode';

export class DefinitionFinder {
    /**
     * Executes the definition provider for the given position in the document.
     */
    public async findDefinitionEx(document: vscode.TextDocument, position: vscode.Position): Promise<{ uri: vscode.Uri, range: vscode.Range } | null> {
        const definitions = await vscode.commands.executeCommand<vscode.Location[] | vscode.LocationLink[]>(
            'vscode.executeDefinitionProvider',
            document.uri,
            position
        );

        if (!definitions || definitions.length === 0) {
            return null;
        }

        const def = definitions[0];
        
        // Handle LocationLink
        if ('targetUri' in def) {
            return { uri: def.targetUri, range: def.targetRange };
        }
        
        // Handle Location
        return { uri: def.uri, range: def.range };
    }
}
