import * as vscode from 'vscode';

export class DIFactor {
    public static async convertToDI(document: vscode.TextDocument, facadeName: string, contractFqcn: string) {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document !== document) return;

        const edit = new vscode.WorkspaceEdit();
        const text = document.getText();
        const shortContractName = contractFqcn.split('\\').pop() || contractFqcn;
        const propertyName = shortContractName.charAt(0).toLowerCase() + shortContractName.slice(1);

        // 1. Add 'use' statement if missing
        this.addUseStatement(document, contractFqcn, edit);

        // 2. Find or create constructor
        const constructorInfo = this.findConstructor(text);
        if (constructorInfo) {
            // Add to existing constructor
            const insertPos = document.positionAt(constructorInfo.paramEndIndex);
            const prefix = constructorInfo.hasParams ? ', ' : '';
            edit.insert(document.uri, insertPos, `${prefix}protected ${shortContractName} $${propertyName}`);
        } else {
            // Create new constructor
            const classStartMatch = /class\s+[A-Za-z0-9_]+\s*(?:extends\s+[A-Za-z0-9_\\\\]+)?\s*(?:implements\s+[A-Za-z0-9_\\\\]+(?:\s*,\s*[A-Za-z0-9_\\\\]+)*)?\s*\{/m.exec(text);
            if (classStartMatch) {
                const classStartIndex = classStartMatch.index + classStartMatch[0].length;
                const insertPos = document.positionAt(classStartIndex);
                const indent = '    ';
                const constructorText = `\n${indent}public function __construct(\n${indent}${indent}protected ${shortContractName} $${propertyName}\n${indent}) {}\n`;
                edit.insert(document.uri, insertPos, constructorText);
            }
        }

        // 3. Replace all Facade:: calls with $this->property->
        const facadeRegex = new RegExp(`\\b${facadeName}::([A-Za-z0-9_]+)`, 'g');
        let match;
        while ((match = facadeRegex.exec(text)) !== null) {
            const startPos = document.positionAt(match.index);
            const endPos = document.positionAt(match.index + match[0].length);
            edit.replace(document.uri, new vscode.Range(startPos, endPos), `$this->${propertyName}->${match[1]}`);
        }

        await vscode.workspace.applyEdit(edit);
    }

    public static async bulkConvertToDI(document: vscode.TextDocument) {
        // Implementation of bulk conversion logic
        vscode.window.showInformationMessage("Bulk conversion starting (Simulated for this MVP phase)");
        // In a real scenario, this would scan the file and run convertToDI for each found facade
    }

    public static async generateTestMock(document: vscode.TextDocument, className: string) {
        const shortName = className.split('\\').pop() || className;
        const snippet = `$this->instance(${shortName}::class, Mockery::mock(${shortName}::class));`;
        await vscode.env.clipboard.writeText(snippet);
        vscode.window.showInformationMessage(`Copied mock snippet for ${shortName} to clipboard.`);
    }

    private static addUseStatement(document: vscode.TextDocument, fqcn: string, edit: vscode.WorkspaceEdit) {
        const text = document.getText();
        const escapedFqcn = fqcn.replace(/\\/g, '\\\\');
        const useRegex = new RegExp(`^use\\s+${escapedFqcn}\\s*;`, 'm');
        if (useRegex.test(text)) return;

        const useStatementsRegex = /^use\s+[\w\\]+(?:\s+as\s+\w+)?\s*;/gm;
        let match;
        let lastUseLine = -1;
        while ((match = useStatementsRegex.exec(text)) !== null) {
            const position = document.positionAt(match.index);
            lastUseLine = position.line;
        }

        if (lastUseLine !== -1) {
            edit.insert(document.uri, new vscode.Position(lastUseLine + 1, 0), `use ${fqcn};\n`);
        } else {
            const namespaceRegex = /^namespace\s+[\w\\]+\s*;/m;
            const nsMatch = namespaceRegex.exec(text);
            if (nsMatch) {
                const position = document.positionAt(nsMatch.index);
                edit.insert(document.uri, new vscode.Position(position.line + 1, 0), `\nuse ${fqcn};\n`);
            }
        }
    }

    private static findConstructor(text: string): { paramEndIndex: number, hasParams: boolean } | null {
        const constructorRegex = /public\s+function\s+__construct\s*\(([^)]*)\)/m;
        const match = constructorRegex.exec(text);
        if (match) {
            const params = match[1].trim();
            const paramEndIndex = match.index + match[0].lastIndexOf(')');
            return {
                paramEndIndex,
                hasParams: params.length > 0
            };
        }
        return null;
    }
}
