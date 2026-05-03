import * as vscode from 'vscode';

export class FacadeCodeLensProvider implements vscode.CodeLensProvider {
    public provideCodeLenses(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.CodeLens[] {
        const lenses: vscode.CodeLens[] = [];
        const text = document.getText();
        
        // Match Facade usage in controller-like methods
        // Heuristic: Method definitions in classes that might use facades
        const methodRegex = /public\s+function\s+\w+\s*\([^)]*\)\s*(?::\s*[\w\\]+\s*)?\{/g;
        let match;

        while ((match = methodRegex.exec(text)) !== null) {
            const methodStartPos = document.positionAt(match.index);
            const methodEndIndex = this.findEndOfMethod(text, match.index + match[0].length);
            const methodBody = text.substring(match.index, methodEndIndex);

            // Check if facades are used inside the method body
            // Simple check for ClassName::methodName()
            const facadeUsageRegex = /\b([A-Z][a-zA-Z0-9]+)::[a-z]\w*\(/g;
            if (facadeUsageRegex.test(methodBody)) {
                const range = new vscode.Range(methodStartPos, methodStartPos);
                const codeLens = new vscode.CodeLens(range, {
                    title: "🏗️ Facade used – Consider DI for Larastan L10 compatibility",
                    command: "",
                    tooltip: "Using facades makes your code harder to test. Consider injecting the contract into the constructor or method."
                });
                lenses.push(codeLens);
            }
        }

        return lenses;
    }

    private findEndOfMethod(text: string, startIndex: number): number {
        let braceCount = 1;
        let i = startIndex;
        while (i < text.length && braceCount > 0) {
            if (text[i] === '{') {
                braceCount++;
            } else if (text[i] === '}') {
                braceCount--;
            }
            i++;
        }
        return i;
    }
}
