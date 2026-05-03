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
            'Inertia': 'Inertia\\ResponseFactory',
        };
    }

    public async resolve(accessor: string): Promise<FacadeResolution | null> {
        const className = this.coreFacades[accessor];
        if (className) {
            let advice: string | undefined;
            if (accessor === 'auth' || accessor === 'auth.driver') {
                advice = '🔒 **Isolation Tip**: Services shouldn\'t know about the "current user." Pass the `User` model as a method argument for better reusability.';
            } else if (accessor === 'request') {
                advice = '🛑 **Service Coupling**: Avoid injecting `Request` into Services. Pass a **DTO** or array instead.';
            } else if (accessor === 'session' || accessor === 'session.store') {
                advice = '⚠️ **Portability Warning**: Using `Session` in deep services makes them hard to reuse in **CLI commands** or **Queued Jobs**.';
            } else if (accessor === 'db' || accessor === 'db.connection') {
                advice = '🏛️ **Domain Logic**: If performing complex queries, consider a **Query Builder** or **Repository** class to keep your service focused on business rules.';
            } else if (accessor === 'cache' || accessor === 'cache.store') {
                advice = '🚀 **Performance Tip**: For heavy data, use the **Repository Decorator** pattern to handle caching transparently.';
            } else if (accessor === 'filesystem' || accessor === 'filesystem.disk') {
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
