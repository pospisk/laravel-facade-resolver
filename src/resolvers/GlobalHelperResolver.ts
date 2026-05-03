import { IFacadeResolver, FacadeResolution } from '../interfaces/IFacadeResolver.js';

export class GlobalHelperResolver implements IFacadeResolver {
    
    public async resolve(helperName: string): Promise<FacadeResolution | null> {
        const globalHelpers: Record<string, { className: string, advice?: string }> = {
            'abort': { 
                className: 'Illuminate\\Contracts\\Foundation\\Application',
                advice: 'Instead of aborting mid-execution, consider returning a `JsonResponse` or `RedirectResponse`. This keeps your method\'s return type predictable and makes testing easier.'
            },
            'abort_if': { className: 'Illuminate\\Contracts\\Foundation\\Application' },
            'abort_unless': { className: 'Illuminate\\Contracts\\Foundation\\Application' },
            'app': { className: 'Illuminate\\Contracts\\Foundation\\Application' },
            'auth': { 
                className: 'Illuminate\\Contracts\\Auth\\Guard',
                advice: '🔒 **Isolation Tip**: Services shouldn\'t know about the "current user." Pass the `User` model as a method argument for better reusability and testability.'
            },
            'back': { className: 'Illuminate\\Routing\\Redirector' },
            'bcrypt': { className: 'Illuminate\\Contracts\\Hashing\\Hasher' },
            'broadcast': { className: 'Illuminate\\Contracts\\Broadcasting\\Factory' },
            'cache': { className: 'Illuminate\\Contracts\\Cache\\Repository' },
            'config': { 
                className: 'Illuminate\\Contracts\\Config\\Repository',
                advice: '⚙️ **Tip**: For high-volume config access, consider a dedicated `Settings` class to keep your service signatures clean.'
            },
            'cookie': { className: 'Illuminate\\Contracts\\Cookie\\Factory' },
            'decrypt': { className: 'Illuminate\\Contracts\\Encryption\\Encrypter' },
            'dispatch': { className: 'Illuminate\\Contracts\\Bus\\Dispatcher' },
            'dispatch_sync': { className: 'Illuminate\\Contracts\\Bus\\Dispatcher' },
            'encrypt': { className: 'Illuminate\\Contracts\\Encryption\\Encrypter' },
            'event': { className: 'Illuminate\\Contracts\\Events\\Dispatcher' },
            'info': { className: 'Psr\\Log\\LoggerInterface' },
            'logger': { className: 'Psr\\Log\\LoggerInterface' },
            'now': { className: 'Illuminate\\Support\\Carbon' },
            'redirect': { className: 'Illuminate\\Routing\\Redirector' },
            'request': { 
                className: 'Illuminate\\Http\\Request',
                advice: '🛑 **Service Coupling**: Avoid injecting `Request` into Service classes. It couples your business logic to the HTTP layer. Consider passing a **DTO** or plain array instead.'
            },
            'response': { className: 'Illuminate\\Contracts\\Routing\\ResponseFactory' },
            'route': { className: 'Illuminate\\Contracts\\Routing\\UrlGenerator' },
            'session': { 
                className: 'Illuminate\\Contracts\\Session\\Session',
                advice: '⚠️ **Portability Warning**: Using `Session` in deep services makes them hard to reuse in **CLI commands** or **Queued Jobs**.'
            },
            'today': { className: 'Illuminate\\Support\\Carbon' },
            'trans': { className: 'Illuminate\\Contracts\\Translation\\Translator' },
            'trans_choice': { className: 'Illuminate\\Contracts\\Translation\\Translator' },
            '__': { className: 'Illuminate\\Contracts\\Translation\\Translator' },
            'url': { className: 'Illuminate\\Contracts\\Routing\\UrlGenerator' },
            'validator': { 
                className: 'Illuminate\\Contracts\\Validation\\Factory',
                advice: '📋 **Form Request Tip**: For complex validation, consider using a **Form Request** class. It moves validation logic out of the controller and makes it reusable.'
            },
            'view': { className: 'Illuminate\\Contracts\\View\\Factory' }
        };

        const resolution = globalHelpers[helperName];
        if (resolution) {
            return {
                className: resolution.className,
                lifecycle: 'singleton',
                advice: resolution.advice
            };
        }
        return null;
    }
}
