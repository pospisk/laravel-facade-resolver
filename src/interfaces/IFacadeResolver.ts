import * as vscode from 'vscode';

export interface FacadeResolution {
    className: string;
    lifecycle?: 'singleton' | 'transient' | 'scoped' | 'unknown';
    sourceUri?: vscode.Uri;
    advice?: string;
}

export interface IFacadeResolver {
    /**
     * Attempts to resolve a given Facade accessor string to its fully qualified class name and metadata.
     * @param accessor The accessor string (e.g., 'hash')
     * @returns The FacadeResolution object, or null if not found.
     */
    resolve(accessor: string, method?: string): Promise<FacadeResolution | null>;
}
