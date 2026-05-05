import { IFacadeResolver, FacadeResolution } from '../interfaces/IFacadeResolver.js';

export class CoreFacadeResolver implements IFacadeResolver {
    private coreFacades: Record<string, string> = {
        'app': 'Illuminate\\Foundation\\Application',
        'artisan': 'Illuminate\\Contracts\\Console\\Kernel',
        'auth': 'Illuminate\\Auth\\AuthManager',
        // ... (truncated for brevity, using existing ones)
        'Inertia': 'Inertia\\ResponseFactory',
    };

    constructor() {
        // Full list of core facades
        this.coreFacades = {
            'app': 'Illuminate\\Foundation\\Application',
            'artisan': 'Illuminate\\Contracts\\Console\\Kernel',
            'auth': 'Illuminate\\Auth\\AuthManager',
            'auth.driver': 'Illuminate\\Contracts\\Auth\\Guard',
            'auth.password': 'Illuminate\\Contracts\\Auth\\PasswordBroker',
            'blade.compiler': 'Illuminate\\View\\Compilers\\BladeCompiler',
            'cache': 'Illuminate\\Cache\\CacheManager',
            'cache.store': 'Illuminate\\Cache\\Repository',
            'config': 'Illuminate\\Config\\Repository',
            'cookie': 'Illuminate\\Cookie\\CookieJar',
            'db': 'Illuminate\\Database\\DatabaseManager',
            'db.connection': 'Illuminate\\Database\\Connection',
            'encrypter': 'Illuminate\\Encryption\\Encrypter',
            'events': 'Illuminate\\Events\\Dispatcher',
            'files': 'Illuminate\\Filesystem\\Filesystem',
            'filesystem': 'Illuminate\\Filesystem\\FilesystemManager',
            'filesystem.disk': 'Illuminate\\Contracts\\Filesystem\\Filesystem',
            'hash': 'Illuminate\\Hashing\\HashManager',
            'log': 'Illuminate\\Log\\LogManager',
            'mail.manager': 'Illuminate\\Mail\\MailManager',
            'mailer': 'Illuminate\\Mail\\Mailer',
            'pipeline': 'Illuminate\\Pipeline\\Pipeline',
            'queue': 'Illuminate\\Queue\\QueueManager',
            'queue.connection': 'Illuminate\\Contracts\\Queue\\Queue',
            'queue.failer': 'Illuminate\\Queue\\Failed\\FailedJobProviderInterface',
            'redirect': 'Illuminate\\Routing\\Redirector',
            'redis': 'Illuminate\\Redis\\RedisManager',
            'request': 'Illuminate\\Http\\Request',
            'router': 'Illuminate\\Routing\\Router',
            'session': 'Illuminate\\Session\\SessionManager',
            'session.store': 'Illuminate\\Session\\Store',
            'translation.loader': 'Illuminate\\Translation\\FileLoader',
            'translator': 'Illuminate\\Translation\\Translator',
            'url': 'Illuminate\\Routing\\UrlGenerator',
            'validation.presence': 'Illuminate\\Validation\\DatabasePresenceVerifier',
            'view': 'Illuminate\\View\\Factory',
            'view.engine.resolver': 'Illuminate\\View\\Engines\\EngineResolver',
            'view.finder': 'Illuminate\\View\\FileViewFinder',
            'storage': 'Illuminate\\Filesystem\\FilesystemManager',
            'inertia': 'Inertia\\ResponseFactory',
        };
    }

    public async resolve(accessor: string): Promise<FacadeResolution | null> {
        const lowerAccessor = accessor.toLowerCase();
        const className = this.coreFacades[lowerAccessor];
        if (className) {
            let advice: string | undefined;
            if (lowerAccessor === 'auth' || lowerAccessor === 'auth.driver') {
                advice = '🔒 **Isolation Tip**: Services shouldn\'t know about the "current user." Pass the `User` model as a method argument for better reusability.';
            } else if (lowerAccessor === 'request') {
                advice = '🛑 **Service Coupling**: Avoid injecting `Request` into Services. Pass a **DTO** or array instead.';
            } else if (lowerAccessor === 'session' || lowerAccessor === 'session.store') {
                advice = '⚠️ **Portability Warning**: Using `Session` in deep services makes them hard to reuse in **CLI commands** or **Queued Jobs**.';
            } else if (lowerAccessor === 'db' || lowerAccessor === 'db.connection') {
                advice = '🏛️ **Domain Logic**: If performing complex queries, consider a **Query Builder** or **Repository** class to keep your service focused on business rules.';
            } else if (lowerAccessor === 'cache' || lowerAccessor === 'cache.store') {
                advice = '🚀 **Performance Tip**: For heavy data, use the **Repository Decorator** pattern to handle caching transparently.';
            } else if (lowerAccessor === 'filesystem' || lowerAccessor === 'filesystem.disk' || lowerAccessor === 'storage') {
                advice = '📦 **Filesystem Inversion**: Inject `Filesystem` and pass the disk name as a config value instead of hardcoding `Storage::disk(\'s3\')`.';
            }

            return {
                className,
                lifecycle: 'singleton',
                advice
            };
        }
        return null;
    }
}
