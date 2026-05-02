import * as vscode from 'vscode';
import { FacadeHoverProvider } from './providers/FacadeHoverProvider.js';
import { DefinitionFinder } from './utils/DefinitionFinder.js';
import { CoreFacadeResolver } from './resolvers/CoreFacadeResolver.js';
import { CustomFacadeResolver } from './resolvers/CustomFacadeResolver.js';
import { FacadeResolver } from './resolvers/FacadeResolver.js';

export function activate(context: vscode.ExtensionContext) {
    const config = vscode.workspace.getConfiguration('laravelFacadeResolver');
    if (!config.get<boolean>('enable', true)) {
        return;
    }

    // Composition Root: Construct dependencies
    const definitionFinder = new DefinitionFinder();
    
    // Setup resolvers (Chain of Responsibility pattern)
    const coreResolver = new CoreFacadeResolver();
    const customResolver = new CustomFacadeResolver();
    
    // Orchestrator
    const facadeResolver = new FacadeResolver([
        coreResolver,
        customResolver
    ]);

    const hoverProvider = new FacadeHoverProvider(definitionFinder, facadeResolver);

    // Register provider
    const disposable = vscode.languages.registerHoverProvider(
        { scheme: 'file', language: 'php' },
        hoverProvider
    );

    context.subscriptions.push(disposable);
}

export function deactivate() {}
