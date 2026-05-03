import { IFacadeResolver } from '../interfaces/IFacadeResolver.js';

export class GlobalHelperResolver implements IFacadeResolver {
    
    public async resolve(helperName: string): Promise<string | null> {
        const globalHelpers: Record<string, string> = {
            'abort': 'Illuminate\\Contracts\\Foundation\\Application',
            'abort_if': 'Illuminate\\Contracts\\Foundation\\Application',
            'abort_unless': 'Illuminate\\Contracts\\Foundation\\Application',
            'app': 'Illuminate\\Contracts\\Foundation\\Application',
            'auth': 'Illuminate\\Contracts\\Auth\\Guard',
            'back': 'Illuminate\\Routing\\Redirector',
            'bcrypt': 'Illuminate\\Contracts\\Hashing\\Hasher',
            'broadcast': 'Illuminate\\Contracts\\Broadcasting\\Factory',
            'cache': 'Illuminate\\Contracts\\Cache\\Repository',
            'config': 'Illuminate\\Contracts\\Config\\Repository',
            'cookie': 'Illuminate\\Contracts\\Cookie\\Factory',
            'decrypt': 'Illuminate\\Contracts\\Encryption\\Encrypter',
            'dispatch': 'Illuminate\\Contracts\\Bus\\Dispatcher',
            'dispatch_sync': 'Illuminate\\Contracts\\Bus\\Dispatcher',
            'encrypt': 'Illuminate\\Contracts\\Encryption\\Encrypter',
            'event': 'Illuminate\\Contracts\\Events\\Dispatcher',
            'info': 'Psr\\Log\\LoggerInterface',
            'logger': 'Psr\\Log\\LoggerInterface',
            'now': 'Illuminate\\Support\\Carbon',
            'redirect': 'Illuminate\\Routing\\Redirector',
            'request': 'Illuminate\\Http\\Request',
            'response': 'Illuminate\\Contracts\\Routing\\ResponseFactory',
            'route': 'Illuminate\\Contracts\\Routing\\UrlGenerator',
            'session': 'Illuminate\\Contracts\\Session\\Session',
            'today': 'Illuminate\\Support\\Carbon',
            'trans': 'Illuminate\\Contracts\\Translation\\Translator',
            'trans_choice': 'Illuminate\\Contracts\\Translation\\Translator',
            '__': 'Illuminate\\Contracts\\Translation\\Translator',
            'url': 'Illuminate\\Contracts\\Routing\\UrlGenerator',
            'validator': 'Illuminate\\Contracts\\Validation\\Factory',
            'view': 'Illuminate\\Contracts\\View\\Factory'
        };

        return globalHelpers[helperName] || null;
    }
}
