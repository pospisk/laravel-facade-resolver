import * as vscode from 'vscode';

export class ConfigParser {
    public static async getKeys(configFile: string): Promise<string[]> {
        const uris = await vscode.workspace.findFiles(configFile);
        if (uris.length === 0) {
            return [];
        }

        const contentBytes = await vscode.workspace.fs.readFile(uris[0]);
        const content = Buffer.from(contentBytes).toString('utf-8');

        // Simple regex-based key extraction for nested arrays
        // This is a heuristic and won't work for complex dynamic configs
        const keys: string[] = [];
        this.extractKeys(content, '', keys);
        return keys;
    }

    private static extractKeys(content: string, prefix: string, keys: string[]) {
        // Find keys like 'name' => or "name" =>
        const keyRegex = /['"]([^'"]+)['"]\s*=>\s*/g;
        let match;
        while ((match = keyRegex.exec(content)) !== null) {
            const key = match[1];
            const fullKey = prefix ? `${prefix}.${key}` : key;
            keys.push(fullKey);
            
            // We could try to recurse if the value is an array, 
            // but parsing PHP arrays with regex is dangerous.
            // For now, we just collect all strings that look like keys.
        }
    }
}
