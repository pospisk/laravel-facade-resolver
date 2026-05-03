import * as vscode from 'vscode';

export interface SolidAdvice {
    title: string;
    content: string;
    severity: 'info' | 'warning';
}

export class SolidEducationProvider {
    public async getSrpAdvice(document: vscode.TextDocument): Promise<SolidAdvice | null> {
        const text = document.getText();
        
        // Count constructor dependencies (including promoted properties)
        const constructorMatch = text.match(/public\s+function\s+__construct\s*\(([^)]*)\)/s);
        if (!constructorMatch) {
            return null;
        }

        const params = constructorMatch[1].split(',').filter(p => p.trim().length > 0);
        const dependencyCount = params.length;
        
        const config = vscode.workspace.getConfiguration('laravelFacadeResolver');
        const threshold = config.get<number>('education.srpThreshold', 5);

        if (dependencyCount > threshold) {
            return {
                title: '⚠️ SRP Warning: Fat Class Detected',
                content: `This class has **${dependencyCount}** dependencies. Consider breaking it down into smaller, specialized services to adhere to the Single Responsibility Principle.`,
                severity: 'warning'
            };
        }

        return null;
    }

    public getDipAdvice(facadeName: string, contractFqcn: string): SolidAdvice {
        return {
            title: '🏗️ Dependency Inversion Tip',
            content: `Instead of using the \`${facadeName}\` facade, consider injecting \`${contractFqcn}\` into your constructor. This makes your class easier to test and decouples it from the global state.`,
            severity: 'info'
        };
    }

    public getIspAdvice(interfaceName: string): SolidAdvice | null {
        const fatInterfaces: Record<string, string> = {
            'Application': 'Suggest using more specific contracts like `Config`, `Filesystem`, or `Dispatcher`.',
            'Request': 'Consider using specialized Request classes or narrow interfaces if you only need specific data.',
            'Container': 'Inject only what you need instead of the entire container.'
        };

        const shortName = interfaceName.split('\\').pop() || '';
        if (fatInterfaces[shortName]) {
            return {
                title: '📏 ISP Warning: Fat Interface',
                content: `\`${shortName}\` is a large interface. ${fatInterfaces[shortName]} Interface Segregation recommends using smaller, more specific contracts.`,
                severity: 'warning'
            };
        }

        return null;
    }

    public getLspOcpAdvice(serviceName: string): SolidAdvice {
        return {
            title: '🧩 OCP/LSP Tip',
            content: `When extending or implementing \`${serviceName}\`, ensure that the new behavior doesn't break existing consumers and remains open for extension but closed for modification.`,
            severity: 'info'
        };
    }
}
