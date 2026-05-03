import { IFacadeResolver } from '../interfaces/IFacadeResolver.js';

export class CoreFacadeResolver implements IFacadeResolver {
    private coreFacades: Record<string, string> = {
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

    public async resolve(accessor: string): Promise<string | null> {
        return this.coreFacades[accessor] || null;
    }
}
