import * as vscode from 'vscode';

export class HealthReportProvider {
    public static async analyze(document: vscode.TextDocument) {
        const text = document.getText();
        
        // Metrics
        const facadeCalls = (text.match(/[A-Z][A-Za-z0-9_]*::/g) || []).length;
        const helperCalls = (text.match(/(?:config|view|route|auth|app)\(/g) || []).length;
        
        // Constructor dependencies
        const constructorMatch = /public\s+function\s+__construct\s*\(([^)]*)\)/m.exec(text);
        const dependencyCount = constructorMatch ? (constructorMatch[1].split(',').filter(p => p.trim()).length) : 0;
        
        // Score calculation (Heuristic)
        let score = 100;
        score -= facadeCalls * 5;
        score -= helperCalls * 2;
        if (dependencyCount > 5) score -= (dependencyCount - 5) * 10;
        score = Math.max(0, score);

        const md = new vscode.MarkdownString();
        md.appendMarkdown(`# 🏗️ Architecture Health Report\n\n`);
        md.appendMarkdown(`**File:** \`${document.fileName.split('/').pop()}\`\n\n`);
        md.appendMarkdown(`## 📊 SOLID Score: **${score}/100**\n\n`);
        
        md.appendMarkdown(`### 🔍 Findings:\n`);
        if (facadeCalls > 0) {
            md.appendMarkdown(`- ❌ **Static Coupling:** Found ${facadeCalls} Facade calls. Consider using Constructor Injection (DIP).\n`);
        }
        if (helperCalls > 0) {
            md.appendMarkdown(`- ⚠️ **Global Helpers:** Found ${helperCalls} helper calls. These are hard to mock in isolation.\n`);
        }
        if (dependencyCount > 5) {
            md.appendMarkdown(`- 🔴 **SRP Violation:** This class has ${dependencyCount} dependencies. It might be doing too much.\n`);
        } else if (dependencyCount > 0) {
            md.appendMarkdown(`- ✅ **DI Usage:** Good use of constructor injection.\n`);
        }

        if (score > 80) {
            md.appendMarkdown(`\n🌟 **Larastan Level 10 Readiness:** High`);
        } else {
            md.appendMarkdown(`\n💡 **Tip:** Use the "Convert to DI" quick action to improve your score.`);
        }

        vscode.window.showInformationMessage(`Architecture Score: ${score}/100`, { detail: md.value, modal: true });
    }
}
