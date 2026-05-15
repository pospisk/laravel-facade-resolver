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
            'app': 'Illuminate\\Contracts\\Foundation\\Application',
            'artisan': 'Illuminate\\Contracts\\Console\\Kernel',
            'auth': 'Illuminate\\Contracts\\Auth\\Guard',
            'auth.driver': 'Illuminate\\Contracts\\Auth\\Guard',
            'auth.password': 'Illuminate\\Contracts\\Auth\\PasswordBroker',
            'blade.compiler': 'Illuminate\\View\\Compilers\\BladeCompiler',
            'cache': 'Illuminate\\Contracts\\Cache\\Repository',
            'cache.store': 'Illuminate\\Contracts\\Cache\\Repository',
            'config': 'Illuminate\\Contracts\\Config\\Repository',
            'cookie': 'Illuminate\\Cookie\\CookieJar',
            'db': 'Illuminate\\Database\\ConnectionInterface', // Or DatabaseManager contract? Laravel doesn't have a clean one for DB facade, but DatabaseManager implements connection factory. Let's use Manager for now or ConnectionInterface. Actually let's stick to the user's direction.
            'db.connection': 'Illuminate\\Database\\ConnectionInterface',
            'encrypter': 'Illuminate\\Encryption\\Encrypter',
            'event': 'Illuminate\\Contracts\\Events\\Dispatcher',
            'events': 'Illuminate\\Contracts\\Events\\Dispatcher',
            'file': 'Illuminate\\Contracts\\Filesystem\\Filesystem',
            'files': 'Illuminate\\Contracts\\Filesystem\\Filesystem',
            'filesystem': 'Illuminate\\Contracts\\Filesystem\\Factory',
            'filesystem.disk': 'Illuminate\\Contracts\\Filesystem\\Filesystem',
            'hash': 'Illuminate\\Hashing\\HashManager',
            'log': 'Psr\\Log\\LoggerInterface',
            'mail.manager': 'Illuminate\\Mail\\MailManager',
            'mailer': 'Illuminate\\Mail\\Mailer',
            'password': 'Illuminate\\Contracts\\Auth\\PasswordBroker',
            'pipeline': 'Illuminate\\Pipeline\\Pipeline',
            'queue': 'Illuminate\\Queue\\QueueManager',
            'queue.connection': 'Illuminate\\Contracts\\Queue\\Queue',
            'queue.failer': 'Illuminate\\Queue\\Failed\\FailedJobProviderInterface',
            'redirect': 'Illuminate\\Routing\\Redirector',
            'redis': 'Illuminate\\Redis\\RedisManager',
            'request': 'Illuminate\\Http\\Request',
            'router': 'Illuminate\\Routing\\Router',
            'session': 'Illuminate\\Contracts\\Session\\Session',
            'session.store': 'Illuminate\\Session\\Store',
            'translation.loader': 'Illuminate\\Translation\\FileLoader',
            'translator': 'Illuminate\\Translation\\Translator',
            'url': 'Illuminate\\Routing\\UrlGenerator',
            'validation.presence': 'Illuminate\\Validation\\DatabasePresenceVerifier',
            'view': 'Illuminate\\Contracts\\View\\Factory',
            'view.engine.resolver': 'Illuminate\\View\\Engines\\EngineResolver',
            'view.finder': 'Illuminate\\View\\FileViewFinder',
            'storage': 'Illuminate\\Contracts\\Filesystem\\Factory',
            'validator': 'Illuminate\\Contracts\\Validation\\Factory',
            'inertia': 'Inertia\\ResponseFactory',
        };
    }

    public async resolve(accessor: string, method?: string): Promise<FacadeResolution | null> {
        const lowerAccessor = accessor.toLowerCase();
        const className = this.coreFacades[lowerAccessor];
        if (className) {
            let advice: string | undefined;
            
            // Method-specific advice for DB
            if (lowerAccessor === 'db' && method) {
                const lowerMethod = method.toLowerCase();
                if (lowerMethod === 'transaction') {
                    advice = '🧪 **Transactional Integrity**\n`DB::transaction()` is a critical abstraction. When replacing this facade, ensure you use `Illuminate\\Database\\ConnectionInterface::transaction()`. It handles atomic operations, exception wrapping, and PDO transaction state which a `Builder` cannot do.';
                } else if (lowerMethod === 'table') {
                    advice = '🏗️ **Factory vs Product**\n`DB::table()` acts as a factory. When injecting `ConnectionInterface`, every call to `table()` returns a fresh, isolated `Builder` instance, preventing clause leakage between queries.';
                }
            }

            // Method-specific advice for Auth
            if (lowerAccessor === 'auth' && method) {
                const lowerMethod = method.toLowerCase();
                if (lowerMethod === 'logout' || lowerMethod === 'login' || lowerMethod === 'attempt') {
                    advice = '🏗️ **Architectural Mentorship: Stateful Auth**\n\nYou are calling a stateful method (`' + method + '`). While `Illuminate\\Contracts\\Auth\\Guard` covers basic authentication, methods that manage session state are defined in `Illuminate\\Contracts\\Auth\\StatefulGuard`.\n\n🧪 **Testing & Mocking**\n```php\n$this->actingAs($user);\n```\n\n💡 **Import Recommendation**\n`use Illuminate\\Contracts\\Auth\\StatefulGuard;`';
                    
                    return {
                        className: 'Illuminate\\Contracts\\Auth\\StatefulGuard',
                        lifecycle: 'singleton',
                        advice
                    };
                }
            }

            // Method-specific advice for Auth
            if (lowerAccessor === 'auth' && method) {
                const lowerMethod = method.toLowerCase();
                if (lowerMethod === 'logout' || lowerMethod === 'login' || lowerMethod === 'attempt') {
                    advice = '🏗️ **Architectural Mentorship: Stateful Auth**\n\nYou are calling a stateful method (`' + method + '`). While `Illuminate\\Contracts\\Auth\\Guard` covers basic authentication, methods that manage session state are defined in `Illuminate\\Contracts\\Auth\\StatefulGuard`.\n\n🧪 **Testing & Mocking**\n```php\n$this->actingAs($user);\n```\n\n💡 **Import Recommendation**\n`use Illuminate\\Contracts\\Auth\\StatefulGuard;`';
                    
                    return {
                        className: 'Illuminate\\Contracts\\Auth\\StatefulGuard',
                        lifecycle: 'singleton',
                        advice
                    };
                }
            }

            // Method-specific advice for Events
            if ((lowerAccessor === 'event' || lowerAccessor === 'events') && method) {
                const lowerMethod = method.toLowerCase();
                if (lowerMethod === 'fake') {
                    advice = '🧪 **Architectural Mentorship: Manual Event Faking**\nInstead of `Event::fake()`, you can manually swap the dispatcher for an `EventFake`. This is useful for complex testing scenarios where you want to maintain control over the application container without relying on global facade state.\n\n```php\n$dispatcher = $this->app->make(Dispatcher::class);\n$eventFake = new EventFake($dispatcher);\n\n$this->app->instance(\'events\', $eventFake);\n$this->app->instance(Dispatcher::class, $eventFake);\n```\n\n💡 **Import Recommendation**\n`use Illuminate\\Contracts\\Events\\Dispatcher;`\n`use Illuminate\\Support\\Testing\\Fakes\\EventFake;`';
                }
            }

            if (!advice) {
                if (lowerAccessor === 'auth' || lowerAccessor === 'auth.driver') {
                    advice = '🏗️ **Architectural Mentorship**\n🏗️ **Dependency Inversion Tip**\nInstead of the `Auth` facade, inject `Illuminate\\Contracts\\Auth\\Guard`. Better yet, pass the `User` object directly to your service methods to avoid hidden dependencies on the global session state.\n\n🧪 **Testing & Mocking**\n```php\n$this->actingAs($user);\n```\n\n💡 **Import Recommendation**\n`use Illuminate\\Contracts\\Auth\\Guard;`';
                } else if (lowerAccessor === 'log') {
                    advice = '🏗️ **Architectural Mentorship**\n🏗️ **Dependency Inversion Tip**\nInject `Psr\\Log\\LoggerInterface` instead of using the `Log` facade. This follows the PSR-3 standard, making your code compatible with any PSR-compliant logger.\n\n🧪 **Testing & Mocking**\n```php\nLog::shouldReceive(\'info\')->once();\n```\n\n💡 **Import Recommendation**\n`use Psr\\Log\\LoggerInterface;`';
                } else if (lowerAccessor === 'artisan') {
                    advice = '🏗️ **Architectural Mentorship**\n🏗️ **Dependency Inversion Tip**\nInstead of the `Artisan` facade, inject `Illuminate\\Contracts\\Console\\Kernel`. This allows you to run console commands from within your application while keeping it testable.\n\n🧪 **Testing & Mocking**\n```php\nArtisan::shouldReceive(\'call\')->with(\'migrate\')->once();\n```\n\n💡 **Import Recommendation**\n`use Illuminate\\Contracts\\Console\\Kernel;`';
                } else if (lowerAccessor === 'event' || lowerAccessor === 'events') {
                    advice = '🏗️ **Architectural Mentorship**\n🏗️ **Dependency Inversion Tip**\nInject `Illuminate\\Contracts\\Events\\Dispatcher` to fire events. This makes it easier to mock events in unit tests without actually triggering listeners.\n\n🧪 **Testing & Mocking**\n```php\nEvent::fake();\n```\n\n💡 **Import Recommendation**\n`use Illuminate\\Contracts\\Events\\Dispatcher;`';
                } else if (lowerAccessor === 'request') {
                    advice = '🛑 **Service Coupling**: Avoid injecting `Request` into Services. Pass a **DTO** or array instead.';
                } else if (lowerAccessor === 'session' || lowerAccessor === 'session.store') {
                    advice = '🏗️ **Architectural Mentorship**\n🏗️ **Dependency Inversion Tip**\nInject `Illuminate\\Contracts\\Session\\Session` if you must interact with session state. Be aware that using sessions in services makes them harder to reuse in **CLI commands** or **Queued Jobs**.\n\n🧪 **Testing & Mocking**\n```php\nSession::shouldReceive(\'put\')->with(\'key\', \'value\')->once();\n```\n\n💡 **Import Recommendation**\n`use Illuminate\\Contracts\\Session\\Session;`';
                } else if (lowerAccessor === 'db' || lowerAccessor === 'db.connection') {
                    advice = '🏗️ **Architectural Mentorship: The DB Facade**\n\nWhen satisfying **Dependency Inversion**, avoid injecting `Query\\Builder` directly. Instead, inject `Illuminate\\Database\\ConnectionInterface` for three critical reasons:\n\n### 1. The Factory vs. The Product\nA `Builder` represents a **single mutable SQL query**. If injected, its state (wheres, joins) leaks across multiple calls. `ConnectionInterface` acts as a **Factory**, returning a fresh, isolated `Builder` instance via `table()` every time.\n\n### 2. Transactional Integrity\nA `Builder` cannot manage transactions. In resilient environments, `ConnectionInterface` is required to execute `BEGIN`, `COMMIT`, and `ROLLBACK` via `$db->transaction()`, ensuring atomic operations.\n\n### 3. Static Analysis (PHPStan Level 10)\nInjecting `ConnectionInterface` provides a 1:1 mapping of the facade\'s behavior. PHPStan understands that `ConnectionInterface::table()` returns a `Builder`, maintaining strict type safety.\n\n🧪 **Testing & Mocking**\n```php\n$db = Mockery::mock(Illuminate\\Database\\ConnectionInterface::class);\n$db->shouldReceive(\'transaction\')->once()->andReturnUsing(fn($cb) => $cb());\n```\n\n💡 **Import Recommendation**\n`use Illuminate\\Database\\ConnectionInterface;`';
                } else if (lowerAccessor === 'cache' || lowerAccessor === 'cache.store') {
                    advice = '🏗️ **Architectural Mentorship**\n🏗️ **Dependency Inversion Tip**\nInject `Illuminate\\Contracts\\Cache\\Factory` if you need to access multiple stores, or `Illuminate\\Contracts\\Cache\\Repository` for the default store. This avoids coupling your logic to the global Cache state.\n\n🧪 **Testing & Mocking**\n```php\nCache::shouldReceive(\'get\')->with(\'key\')->andReturn(\'value\');\n```\n\n💡 **Import Recommendation**\n`use Illuminate\\Contracts\\Cache\\Repository;`';
                } else if (lowerAccessor === 'config') {
                    advice = '🏗️ **Architectural Mentorship**\n🏗️ **Dependency Inversion Tip**\nInstead of using the `Config` facade, consider injecting `Illuminate\\Contracts\\Config\\Repository` into your constructor. This makes your class easier to test and decouples it from the global state.\n\n🧪 **Testing & Mocking**\n```php\n$this->instance(Repository::class, Mockery::mock(Repository::class));\n```\n\n💡 **Import Recommendation**\n`use Illuminate\\Contracts\\Config\\Repository;`';
                } else if (lowerAccessor === 'filesystem' || lowerAccessor === 'filesystem.disk' || lowerAccessor === 'storage') {
                    advice = '🏗️ **Architectural Mentorship**\n🏗️ **Dependency Inversion Tip**\nInject `Illuminate\\Contracts\\Filesystem\\Factory` if you need to select disks dynamically, or `Illuminate\\Contracts\\Filesystem\\Filesystem` if you bind a specific disk via a service provider context.\n\n🧩 **ISP Tip**\nThe `Filesystem` contract ensures your service only knows about file operations (read/write/delete) without caring if the backend is local, S3, or a custom adapter.\n\n🧪 **Testing & Mocking**\n```php\n$disk = Mockery::mock(Filesystem::class);\n$disk->shouldReceive(\'delete\')->with($oldPath)->once();\n```\n\n💡 **Import Recommendation**\n`use Illuminate\\Contracts\\Filesystem\\Factory;`';
                } else if (lowerAccessor === 'file' || lowerAccessor === 'files') {
                    advice = '🏗️ **Architectural Mentorship**\n🏗️ **Dependency Inversion Tip**\nInject `Illuminate\\Contracts\\Filesystem\\Filesystem` to handle local file operations. This decouples your code from the global `File` facade and makes it unit-testable.\n\n🧪 **Testing & Mocking**\n```php\nFile::shouldReceive(\'exists\')->once();\n```\n\n💡 **Import Recommendation**\n`use Illuminate\\Contracts\\Filesystem\\Filesystem;`';
                } else if (lowerAccessor === 'validator') {
                    advice = '🏗️ **Architectural Mentorship**\n🏗️ **Dependency Inversion Tip**\nInject `Illuminate\\Contracts\\Validation\\Factory` to create validators manually. However, for HTTP requests, it is cleaner to use **Form Request** classes which encapsulate validation logic.\n\n🧪 **Testing & Mocking**\n```php\nValidator::shouldReceive(\'make\')->once();\n```\n\n💡 **Import Recommendation**\n`use Illuminate\\Contracts\\Validation\\Factory;`';
                } else if (lowerAccessor === 'view') {
                    advice = '🏗️ **Architectural Mentorship**\n🏗️ **Dependency Inversion Tip**\nInject `Illuminate\\Contracts\\View\\Factory` if your service needs to render templates (e.g., for email generation). This decouples your logic from the global view state.\n\n🧪 **Testing & Mocking**\n```php\nView::shouldReceive(\'make\')->with(\'emails.welcome\')->once();\n```\n\n💡 **Import Recommendation**\n`use Illuminate\\Contracts\\View\\Factory;`';
                } else if (lowerAccessor === 'password') {
                    advice = '🏗️ **Architectural Mentorship**\n🏗️ **Dependency Inversion Tip**\nInstead of the `Password` facade, inject `Illuminate\\Contracts\\Auth\\PasswordBroker`. This allows you to handle password resets and token generation in a testable way.\n\n🧪 **Testing & Mocking**\n```php\nPassword::shouldReceive(\'sendResetLink\')->once();\n```\n\n💡 **Import Recommendation**\n`use Illuminate\\Contracts\\Auth\\PasswordBroker;`';
                }
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
