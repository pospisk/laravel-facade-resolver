import * as vscode from 'vscode';
import { IFacadeResolver, FacadeResolution } from '../interfaces/IFacadeResolver.js';

export class CustomFacadeResolver implements IFacadeResolver {
    public async resolve(accessor: string): Promise<FacadeResolution | null> {
        // 1. Try to load from .facade-resolver.json in workspace root
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders) {
            const configUri = vscode.Uri.joinPath(workspaceFolders[0].uri, '.facade-resolver.json');
            try {
                const configBytes = await vscode.workspace.fs.readFile(configUri);
                const config = JSON.parse(Buffer.from(configBytes).toString('utf-8'));
                if (config[accessor]) {
                    return {
                        className: config[accessor],
                        lifecycle: 'unknown'
                    };
                }
            } catch (e) {
                // File not found or invalid JSON, ignore
            }
        }

        // 2. Find provider files in the workspace (original logic)
        const uris = await vscode.workspace.findFiles('app/Providers/**/*.php', '**/node_modules/**');
        
        for (const uri of uris) {
            const contentBytes = await vscode.workspace.fs.readFile(uri);
            const content = Buffer.from(contentBytes).toString('utf-8');

            const regexes = [
                { type: 'singleton', regex: new RegExp(`singleton\\s*\\(\\s*['"]${accessor}['"]\\s*,\\s*([A-Za-z0-9_\\\\]+)::class`) },
                { type: 'bind', regex: new RegExp(`bind\\s*\\(\\s*['"]${accessor}['"]\\s*,\\s*([A-Za-z0-9_\\\\]+)::class`) },
                { type: 'singleton', regex: new RegExp(`singleton\\s*\\(\\s*['"]${accessor}['"]\\s*,\\s*['"]([^'"]+)['"]`) },
                { type: 'bind', regex: new RegExp(`bind\\s*\\(\\s*['"]${accessor}['"]\\s*,\\s*['"]([^'"]+)['"]`) }
            ];

            for (const { type, regex } of regexes) {
                const match = content.match(regex);
                if (match && match[1]) {
                    let className = match[1];
                    className = this.resolveImport(content, className);
                    return {
                        className,
                        lifecycle: type === 'singleton' ? 'singleton' : 'transient',
                        sourceUri: uri
                    };
                }
            }
        }

        return null;
    }

    private resolveImport(fileContent: string, className: string): string {
        if (className.startsWith('\\')) {
            return className.substring(1);
        }

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

        return className;
    }
}
