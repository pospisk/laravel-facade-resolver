import * as vscode from 'vscode';
import { IFacadeResolver } from '../interfaces/IFacadeResolver.js';

export class CustomFacadeResolver implements IFacadeResolver {
    public async resolve(accessor: string): Promise<string | null> {
        // Find provider files in the workspace
        const uris = await vscode.workspace.findFiles('app/Providers/**/*.php', '**/node_modules/**');
        
        for (const uri of uris) {
            const contentBytes = await vscode.workspace.fs.readFile(uri);
            const content = Buffer.from(contentBytes).toString('utf-8');

            // Look for ->singleton('accessor', ClassName::class) or ->bind('accessor', ClassName::class)
            // or $app->singleton('accessor', ClassName::class)
            const regexes = [
                new RegExp(`(?:singleton|bind)\\s*\\(\\s*['"]${accessor}['"]\\s*,\\s*([A-Za-z0-9_\\\\]+)::class`),
                new RegExp(`(?:singleton|bind)\\s*\\(\\s*['"]${accessor}['"]\\s*,\\s*['"]([^'"]+)['"]`)
            ];

            for (const regex of regexes) {
                const match = content.match(regex);
                if (match && match[1]) {
                    // Extract the fully qualified class name.
                    // If it uses ::class, it might be imported via 'use'. We should ideally parse imports,
                    // but as a simple fallback, we return what is written.
                    // To do it perfectly, we could parse 'use' statements in the same file.
                    let className = match[1];
                    className = this.resolveImport(content, className);
                    return className;
                }
            }
        }

        return null;
    }

    private resolveImport(fileContent: string, className: string): string {
        // If it's already fully qualified (starts with \)
        if (className.startsWith('\\')) {
            return className.substring(1);
        }

        // Search for "use Path\To\ClassName;"
        // or "use Path\To\ClassName as Alias;"
        const useRegex = new RegExp(`use\\s+([A-Za-z0-9_\\\\]+)(?:\\s+as\\s+([A-Za-z0-9_]+))?;`, 'g');
        let match;
        while ((match = useRegex.exec(fileContent)) !== null) {
            const fullPath = match[1];
            const alias = match[2];
            
            const parts = fullPath.split('\\');
            const baseName = alias || parts[parts.length - 1];

            if (baseName === className) {
                return fullPath;
            }
        }

        // If not found in 'use', it might be in the same namespace, but we return it as is for now.
        return className;
    }
}
