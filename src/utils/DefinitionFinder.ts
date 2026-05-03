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

    /**
     * Attempts to find the URI of a class by its fully qualified name.
     */
    public async findClassUri(fqcn: string): Promise<vscode.Uri | null> {
        if (fqcn.startsWith('\\')) {
            fqcn = fqcn.substring(1);
        }

        // 1. Try exact match in vendor or app via relative path
        const relativePath = fqcn.replace(/\\/g, '/') + '.php';
        
        // Check app directory (PSR-4 App\ => app/)
        if (fqcn.startsWith('App\\')) {
            const appPath = 'app/' + fqcn.substring(4).replace(/\\/g, '/') + '.php';
            const appFiles = await vscode.workspace.findFiles(appPath);
            if (appFiles.length > 0) return appFiles[0];
        }

        // Check vendor directory
        const vendorPath = 'vendor/' + relativePath;
        const vendorFiles = await vscode.workspace.findFiles(vendorPath);
        if (vendorFiles.length > 0) return vendorFiles[0];

        // 2. Generic search as fallback
        const genericFiles = await vscode.workspace.findFiles('**/' + relativePath);
        if (genericFiles.length > 0) return genericFiles[0];

        return null;
    }
}
