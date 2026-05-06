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
                advice = '🏗️ **Architectural Mentorship**\n🏗️ **Dependency Inversion Tip**\nInstead of the `Auth` facade, inject `Illuminate\\Contracts\\Auth\\Guard`. Better yet, pass the `User` object directly to your service methods to avoid hidden dependencies on the global session state.\n\n🧪 **Testing & Mocking**\n```php\n$this->actingAs($user);\n```\n\n💡 **Import Recommendation**\n`use Illuminate\\Contracts\\Auth\\Guard;`';
            } else if (lowerAccessor === 'log') {
                advice = '🏗️ **Architectural Mentorship**\n🏗️ **Dependency Inversion Tip**\nInject `Psr\\Log\\LoggerInterface` instead of using the `Log` facade. This follows the PSR-3 standard, making your code compatible with any PSR-compliant logger.\n\n🧪 **Testing & Mocking**\n```php\nLog::shouldReceive(\'info\')->once();\n```\n\n💡 **Import Recommendation**\n`use Psr\\Log\\LoggerInterface;`';
            } else if (lowerAccessor === 'events') {
                advice = '🏗️ **Architectural Mentorship**\n🏗️ **Dependency Inversion Tip**\nInject `Illuminate\\Contracts\\Events\\Dispatcher` to fire events. This makes it easier to mock events in unit tests without actually triggering listeners.\n\n🧪 **Testing & Mocking**\n```php\nEvent::fake();\n```\n\n💡 **Import Recommendation**\n`use Illuminate\\Contracts\\Events\\Dispatcher;`';
            } else if (lowerAccessor === 'request') {
                advice = '🛑 **Service Coupling**: Avoid injecting `Request` into Services. Pass a **DTO** or array instead.';
            } else if (lowerAccessor === 'session' || lowerAccessor === 'session.store') {
                advice = '🏗️ **Architectural Mentorship**\n🏗️ **Dependency Inversion Tip**\nInject `Illuminate\\Contracts\\Session\\Session` if you must interact with session state. Be aware that using sessions in services makes them harder to reuse in **CLI commands** or **Queued Jobs**.\n\n🧪 **Testing & Mocking**\n```php\nSession::shouldReceive(\'put\')->with(\'key\', \'value\')->once();\n```\n\n💡 **Import Recommendation**\n`use Illuminate\\Contracts\\Session\\Session;`';
            } else if (lowerAccessor === 'db' || lowerAccessor === 'db.connection') {
                advice = '🏛️ **Domain Logic**: If performing complex queries, consider a **Query Builder** or **Repository** class to keep your service focused on business rules.';
            } else if (lowerAccessor === 'cache' || lowerAccessor === 'cache.store') {
                advice = '🏗️ **Architectural Mentorship**\n🏗️ **Dependency Inversion Tip**\nInject `Illuminate\\Contracts\\Cache\\Factory` if you need to access multiple stores, or `Illuminate\\Contracts\\Cache\\Repository` for the default store. This avoids coupling your logic to the global Cache state.\n\n🧪 **Testing & Mocking**\n```php\nCache::shouldReceive(\'get\')->with(\'key\')->andReturn(\'value\');\n```\n\n💡 **Import Recommendation**\n`use Illuminate\\Contracts\\Cache\\Repository;`';
            } else if (lowerAccessor === 'config') {
                advice = '🏗️ **Architectural Mentorship**\n🏗️ **Dependency Inversion Tip**\nInstead of using the `Config` facade, consider injecting `Illuminate\\Contracts\\Config\\Repository` into your constructor. This makes your class easier to test and decouples it from the global state.\n\n🧪 **Testing & Mocking**\n```php\n$this->instance(Repository::class, Mockery::mock(Repository::class));\n```\n\n💡 **Import Recommendation**\n`use Illuminate\\Contracts\\Config\\Repository;`';
            } else if (lowerAccessor === 'filesystem' || lowerAccessor === 'filesystem.disk' || lowerAccessor === 'storage') {
                advice = '🏗️ **Architectural Mentorship**\n🏗️ **Dependency Inversion Tip**\nInject `Illuminate\\Contracts\\Filesystem\\Factory` if you need to select disks dynamically, or `Illuminate\\Contracts\\Filesystem\\Filesystem` if you bind a specific disk via a service provider context.\n\n🧩 **ISP Tip**\nThe `Filesystem` contract ensures your service only knows about file operations (read/write/delete) without caring if the backend is local, S3, or a custom adapter.\n\n🧪 **Testing & Mocking**\n```php\n$disk = Mockery::mock(Filesystem::class);\n$disk->shouldReceive(\'delete\')->with($oldPath)->once();\n```\n\n💡 **Import Recommendation**\n`use Illuminate\\Contracts\\Filesystem\\Factory;`';
            } else if (lowerAccessor === 'validator') {
                advice = '🏗️ **Architectural Mentorship**\n🏗️ **Dependency Inversion Tip**\nInject `Illuminate\\Contracts\\Validation\\Factory` to create validators manually. However, for HTTP requests, it is cleaner to use **Form Request** classes which encapsulate validation logic.\n\n🧪 **Testing & Mocking**\n```php\nValidator::shouldReceive(\'make\')->once();\n```\n\n💡 **Import Recommendation**\n`use Illuminate\\Contracts\\Validation\\Factory;`';
            } else if (lowerAccessor === 'view') {
                advice = '🏗️ **Architectural Mentorship**\n🏗️ **Dependency Inversion Tip**\nInject `Illuminate\\Contracts\\View\\Factory` if your service needs to render templates (e.g., for email generation). This decouples your logic from the global view state.\n\n🧪 **Testing & Mocking**\n```php\nView::shouldReceive(\'make\')->with(\'emails.welcome\')->once();\n```\n\n💡 **Import Recommendation**\n`use Illuminate\\Contracts\\View\\Factory;`';
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
