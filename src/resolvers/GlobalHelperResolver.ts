import { IFacadeResolver, FacadeResolution } from '../interfaces/IFacadeResolver.js';

export class GlobalHelperResolver implements IFacadeResolver {
    
    public async resolve(helperName: string): Promise<FacadeResolution | null> {
        const globalHelpers: Record<string, { className: string, advice?: string }> = {
            'abort': { 
                className: 'Symfony\\Component\\HttpKernel\\Exception\\HttpException',
                advice: 'Instead of aborting mid-execution, consider returning a `JsonResponse` or `RedirectResponse`. This keeps your method\'s return type predictable and makes testing easier.'
            },
            'abort_if': { className: 'Symfony\\Component\\HttpKernel\\Exception\\HttpException' },
            'abort_unless': { className: 'Symfony\\Component\\HttpKernel\\Exception\\HttpException' },
            'app': { className: 'Illuminate\\Contracts\\Foundation\\Application' },
            'auth': { 
                className: 'Illuminate\\Contracts\\Auth\\Guard',
                advice: '🏗️ **Architectural Mentorship**\n🏗️ **Dependency Inversion Tip**\nInstead of `auth()`, inject `Illuminate\\Contracts\\Auth\\Guard`. Better yet, pass the `User` object directly to your service methods to avoid hidden dependencies on the global session state.\n\n🧪 **Testing & Mocking**\n```php\n$this->actingAs($user);\n```\n\n💡 **Import Recommendation**\n`use Illuminate\\Contracts\\Auth\\Guard;`'
            },
            'back': { className: 'Illuminate\\Routing\\Redirector' },
            'bcrypt': { className: 'Illuminate\\Contracts\\Hashing\\Hasher' },
            'broadcast': { className: 'Illuminate\\Contracts\\Broadcasting\\Factory' },
            'cache': { 
                className: 'Illuminate\\Contracts\\Cache\\Repository',
                advice: '🏗️ **Architectural Mentorship**\n🏗️ **Dependency Inversion Tip**\nInject `Illuminate\\Contracts\\Cache\\Factory` if you need to access multiple stores, or `Illuminate\\Contracts\\Cache\\Repository` for the default store. This avoids coupling your logic to the global Cache state.\n\n🧪 **Testing & Mocking**\n```php\nCache::shouldReceive(\'get\')->with(\'key\')->andReturn(\'value\');\n```\n\n💡 **Import Recommendation**\n`use Illuminate\\Contracts\\Cache\\Repository;`'
            },
            'config': { 
                className: 'Illuminate\\Config\\Repository',
                advice: '🏗️ **Architectural Mentorship**\n🏗️ **Dependency Inversion Tip**\nInstead of using the `config` global helper, consider injecting `Illuminate\\Contracts\\Config\\Repository` into your constructor. This makes your class easier to test and decouples it from the global state.\n\n🧪 **Testing & Mocking**\n```php\n$this->instance(Repository::class, Mockery::mock(Repository::class));\n```\n\n💡 **Import Recommendation**\n`use Illuminate\\Contracts\\Config\\Repository;`'
            },
            'storage': {
                className: 'Illuminate\\Filesystem\\FilesystemManager',
                advice: '🏗️ **Architectural Mentorship**\n🏗️ **Dependency Inversion Tip**\nInject `Illuminate\\Contracts\\Filesystem\\Factory` if you need to select disks dynamically, or `Illuminate\\Contracts\\Filesystem\\Filesystem` if you bind a specific disk via a service provider context.\n\n🧩 **ISP Tip**\nThe `Filesystem` contract ensures your service only knows about file operations (read/write/delete) without caring if the backend is local, S3, or a custom adapter.\n\n🧪 **Testing & Mocking**\n```php\n$disk = Mockery::mock(Filesystem::class);\n$disk->shouldReceive(\'delete\')->with($oldPath)->once();\n```\n\n💡 **Import Recommendation**\n`use Illuminate\\Contracts\\Filesystem\\Factory;`'
            },
            'cookie': { className: 'Illuminate\\Contracts\\Cookie\\Factory' },
            'decrypt': { className: 'Illuminate\\Contracts\\Encryption\\Encrypter' },
            'dispatch': { className: 'Illuminate\\Contracts\\Bus\\Dispatcher' },
            'dispatch_sync': { className: 'Illuminate\\Contracts\\Bus\\Dispatcher' },
            'encrypt': { className: 'Illuminate\\Contracts\\Encryption\\Encrypter' },
            'event': { 
                className: 'Illuminate\\Contracts\\Events\\Dispatcher',
                advice: '🏗️ **Architectural Mentorship**\n🏗️ **Dependency Inversion Tip**\nInject `Illuminate\\Contracts\\Events\\Dispatcher` to fire events. This makes it easier to mock events in unit tests without actually triggering listeners.\n\n🧪 **Testing & Mocking**\n```php\nEvent::fake();\n```\n\n💡 **Import Recommendation**\n`use Illuminate\\Contracts\\Events\\Dispatcher;`'
            },
            'info': { 
                className: 'Psr\\Log\\LoggerInterface',
                advice: '🏗️ **Architectural Mentorship**\n🏗️ **Dependency Inversion Tip**\nInject `Psr\\Log\\LoggerInterface` instead of using the `Log` facade or `logger()` helper. This follows the PSR-3 standard, making your code compatible with any PSR-compliant logger.\n\n🧪 **Testing & Mocking**\n```php\nLog::shouldReceive(\'info\')->once();\n```\n\n💡 **Import Recommendation**\n`use Psr\\Log\\LoggerInterface;`'
            },
            'logger': { 
                className: 'Psr\\Log\\LoggerInterface',
                advice: '🏗️ **Architectural Mentorship**\n🏗️ **Dependency Inversion Tip**\nInject `Psr\\Log\\LoggerInterface` instead of using the `Log` facade or `logger()` helper. This follows the PSR-3 standard, making your code compatible with any PSR-compliant logger.\n\n🧪 **Testing & Mocking**\n```php\nLog::shouldReceive(\'info\')->once();\n```\n\n💡 **Import Recommendation**\n`use Psr\\Log\\LoggerInterface;`'
            },
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
                advice: '🏗️ **Architectural Mentorship**\n🏗️ **Dependency Inversion Tip**\nInject `Illuminate\\Contracts\\Session\\Session` if you must interact with session state. Be aware that using sessions in services makes them harder to reuse in **CLI commands** or **Queued Jobs**.\n\n🧪 **Testing & Mocking**\n```php\nsession()->put(\'key\', \'value\');\n```\n\n💡 **Import Recommendation**\n`use Illuminate\\Contracts\\Session\\Session;`'
            },
            'today': { className: 'Illuminate\\Support\\Carbon' },
            'trans': { className: 'Illuminate\\Contracts\\Translation\\Translator' },
            'trans_choice': { className: 'Illuminate\\Contracts\\Translation\\Translator' },
            '__': { className: 'Illuminate\\Contracts\\Translation\\Translator' },
            'url': { className: 'Illuminate\\Contracts\\Routing\\UrlGenerator' },
            'validator': { 
                className: 'Illuminate\\Contracts\\Validation\\Factory',
                advice: '🏗️ **Architectural Mentorship**\n🏗️ **Dependency Inversion Tip**\nInject `Illuminate\\Contracts\\Validation\\Factory` to create validators manually. However, for HTTP requests, it is cleaner to use **Form Request** classes which encapsulate validation logic.\n\n🧪 **Testing & Mocking**\n```php\nValidator::shouldReceive(\'make\')->once();\n```\n\n💡 **Import Recommendation**\n`use Illuminate\\Contracts\\Validation\\Factory;`'
            },
            'view': { 
                className: 'Illuminate\\Contracts\\View\\Factory',
                advice: '🏗️ **Architectural Mentorship**\n🏗️ **Dependency Inversion Tip**\nInject `Illuminate\\Contracts\\View\\Factory` if your service needs to render templates (e.g., for email generation). This decouples your logic from the global view state.\n\n🧪 **Testing & Mocking**\n```php\nView::shouldReceive(\'make\')->with(\'emails.welcome\')->once();\n```\n\n💡 **Import Recommendation**\n`use Illuminate\\Contracts\\View\\Factory;`'
            }
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
