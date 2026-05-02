import * as vscode from 'vscode';

export interface IFacadeResolver {
    /**
     * Attempts to resolve a given Facade accessor string to its fully qualified class name.
     * @param accessor The accessor string (e.g., 'hash')
     * @returns The fully qualified class name, or null if not found.
     */
    resolve(accessor: string): Promise<string | null>;
}
