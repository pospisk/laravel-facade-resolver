import * as vscode from 'vscode';

export interface SolidAdvice {
    title: string;
    content: string;
    severity: 'info' | 'warning';
}

export class SolidEducationProvider {
    public async getSrpAdvice(document: vscode.TextDocument): Promise<SolidAdvice | null> {
        const text = document.getText();
        
        // Count constructor dependencies (including promoted properties)
        const constructorMatch = text.match(/public\s+function\s+__construct\s*\(([^)]*)\)/s);
        if (!constructorMatch) {
            return null;
        }

        const params = constructorMatch[1].split(',').filter(p => p.trim().length > 0);
        const dependencyCount = params.length;
        
        const config = vscode.workspace.getConfiguration('laravelFacadeResolver');
        const threshold = config.get<number>('education.srpThreshold', 5);

        if (dependencyCount > threshold) {
            return {
                title: '⚠️ SRP Warning: Fat Class Detected',
                content: `This class has **${dependencyCount}** dependencies. Consider breaking it down into smaller, specialized services to adhere to the Single Responsibility Principle.`,
                severity: 'warning'
            };
        }

        return null;
    }

    public getDipAdvice(facadeName: string, contractFqcn: string, prefix: string): SolidAdvice | null {
        const lowerFacade = facadeName.toLowerCase();

        if (['abort', 'abort_if', 'abort_unless', 'app_path', 'base_path', 'config_path', 'database_path', 'public_path', 'resource_path', 'storage_path'].includes(lowerFacade)) {
            return null;
        }

        if (lowerFacade === 'db') {
            return {
                title: '🏗️ Dependency Inversion Tip',
                content: `Relying on the \`${facadeName}\` ${prefix.toLowerCase()} hides your database dependencies. Inject \`Illuminate\\Database\\ConnectionInterface\` instead of \`Builder\`. The connection acts as a **Factory** for isolated builders, ensures **Transactional Integrity**, and is fully understood by PHPStan Level 10.`,
                severity: 'info'
            };
        }

        if (lowerFacade === 'log') {
            return {
                title: '🏗️ Dependency Inversion Tip',
                content: `Do not bind your service to Laravel's logging facade. Inject the industry-standard \`Psr\\Log\\LoggerInterface\` into your constructor instead.`,
                severity: 'info'
            };
        }

        if (lowerFacade === 'storage') {
            return {
                title: '🏗️ Dependency Inversion Tip',
                content: `Inject \`Illuminate\\Contracts\\Filesystem\\Factory\` if you need to select disks dynamically, or \`Illuminate\\Contracts\\Filesystem\\Filesystem\` if you bind a specific disk via a service provider context.`,
                severity: 'info'
            };
        }

        if (lowerFacade === 'env') {
            return {
                title: '⚠️ Architecture Warning: Environment Coupling',
                content: `Never use the \`env()\` helper outside of configuration files. If configuration is cached (\`php artisan config:cache\`), \`env()\` will return \`null\` in production. Always use \`config()\` or inject the Config Repository.`,
                severity: 'warning'
            };
        }

        if (lowerFacade === 'app' || lowerFacade === 'resolve') {
            return {
                title: '⚠️ Architecture Warning: Service Locator',
                content: `Using \`${facadeName}()\` acts as a Service Locator, hiding your class's true dependencies. Inject the specific services you need through the constructor instead.`,
                severity: 'warning'
            };
        }

        if (lowerFacade === 'request') {
            return {
                title: '🏗️ Dependency Inversion Tip',
                content: `Instead of using the \`${facadeName}\` ${prefix.toLowerCase()}, inject \`Illuminate\\Http\\Request\` into your controller method or service. This makes testing easier and explicitly declares your input dependencies.`,
                severity: 'info'
            };
        }

        const contractReplacements: Record<string, string> = {
            'Illuminate\\Config\\Repository': 'Illuminate\\Contracts\\Config\\Repository',
            'Illuminate\\Cache\\CacheManager': 'Illuminate\\Contracts\\Cache\\Repository',
            'Illuminate\\Session\\SessionManager': 'Illuminate\\Contracts\\Session\\Session',
            'Illuminate\\Events\\Dispatcher': 'Illuminate\\Contracts\\Events\\Dispatcher',
            'Illuminate\\Bus\\Dispatcher': 'Illuminate\\Contracts\\Bus\\Dispatcher',
            'Illuminate\\Queue\\QueueManager': 'Illuminate\\Contracts\\Queue\\Queue',
            'Illuminate\\Routing\\UrlGenerator': 'Illuminate\\Contracts\\Routing\\UrlGenerator',
            'Illuminate\\Routing\\ResponseFactory': 'Illuminate\\Contracts\\Routing\\ResponseFactory'
        };

        if (contractReplacements[contractFqcn]) {
            contractFqcn = contractReplacements[contractFqcn];
        }

        return {
            title: '🏗️ Dependency Inversion Tip',
            content: `Instead of using the \`${facadeName}\` ${prefix.toLowerCase()}, consider injecting \`${contractFqcn}\` into your constructor. This makes your class easier to test and decouples it from the global state.`,
            severity: 'info'
        };
    }

    public getIspAdvice(interfaceName: string, accessor?: string): SolidAdvice | null {
        const shortName = interfaceName.split('\\').pop() || '';
        const lowerAccessor = accessor ? accessor.toLowerCase() : '';
        
        if (['abort', 'abort_if', 'abort_unless'].includes(lowerAccessor)) {
            return {
                title: '📏 ISP/Flow Control Warning',
                content: `Injecting \`Application\` just for \`${accessor}()\` is overkill. Consider returning a proper \`Response\` or throwing a custom exception that is handled by the \`ExceptionHandler\`.`,
                severity: 'warning'
            };
        }

        if (['storage', 'file', 'files'].includes(lowerAccessor)) {
            return {
                title: '🧩 ISP Tip',
                content: `The \`Filesystem\` contract ensures your service only knows about file operations (read/write/delete) without caring if the backend is local, S3, or a custom adapter.`,
                severity: 'info'
            };
        }

        if (shortName === 'Application') {
            return {
                title: '📏 ISP Warning: Fat Interface',
                content: `\`Application\` is a large interface. Suggest using more specific contracts like \`Config\`, \`Filesystem\`, or \`Dispatcher\`. Interface Segregation recommends using smaller, more specific contracts.`,
                severity: 'warning'
            };
        }

        const fatInterfaces: Record<string, string> = {
            'Request': 'Consider using specialized Request classes or narrow interfaces if you only need specific data.',
            'Container': 'Inject only what you need instead of the entire container.'
        };

        if (fatInterfaces[shortName]) {
            return {
                title: '📏 ISP Warning: Fat Interface',
                content: `\`${shortName}\` is a large interface. ${fatInterfaces[shortName]} Interface Segregation recommends using smaller, more specific contracts.`,
                severity: 'warning'
            };
        }

        return null;
    }

    public getLspOcpAdvice(serviceName: string, prefix: string): SolidAdvice | null {
        const lowerService = serviceName.toLowerCase();

        if (lowerService === 'db') {
            return {
                title: '🧩 OCP/LSP Tip',
                content: `Coding against \`ConnectionInterface\` ensures your service can operate seamlessly regardless of the underlying database driver (MySQL, Postgres, SQLite), adhering to the Liskov Substitution Principle.`,
                severity: 'info'
            };
        }

        if (lowerService === 'log') {
            return {
                title: '🧩 SRP Tip',
                content: `If logging becomes complex (e.g., structuring extensive audit trails), extract the logging logic into a dedicated \`TeamAuditLogger\` service rather than cluttering the core domain logic.`,
                severity: 'info'
            };
        }

        const fluffServices = [
            'abort', 'abort_if', 'abort_unless', 'inertia', 'redirect', 'auth', 'config',
            'env', 'app', 'resolve', 'request', 'response', 'session', 'cookie', 'cache',
            'event', 'bus', 'queue', 'storage', 'gate', 'url', 'validator'
        ];
        if (prefix === 'Global Helper' || fluffServices.includes(lowerService)) {
            return null;
        }

        return {
            title: '🧩 OCP/LSP Tip',
            content: `When extending or implementing \`${serviceName}\`, ensure that the new behavior doesn't break existing consumers and remains open for extension but closed for modification.`,
            severity: 'info'
        };
    }

    public getTestingAdvice(accessor: string, resolvedClass: string): string | null {
        const lowerAccessor = accessor.toLowerCase();

        if (['abort', 'abort_if', 'abort_unless', 'env', 'app', 'resolve', 'app_path', 'base_path', 'config_path', 'database_path', 'public_path', 'resource_path', 'storage_path'].includes(lowerAccessor)) {
            return null;
        }

        if (lowerAccessor === 'db') {
            return `$connection = Mockery::mock(Illuminate\\Database\\ConnectionInterface::class);\n$connection->shouldReceive('transaction')->once()->andReturnUsing(fn($callback) => $callback());`;
        }

        if (lowerAccessor === 'log') {
            return `$logger = Mockery::mock(Psr\\Log\\LoggerInterface::class);\n$logger->shouldReceive('info')->with('Created fallback personal workspace...')->once();`;
        }

        if (['storage', 'file', 'files'].includes(lowerAccessor)) {
            return `$disk = Mockery::mock(Illuminate\\Contracts\\Filesystem\\Filesystem::class);\n$disk->shouldReceive('delete')->with($oldPath)->once();`;
        }

        const contractReplacements: Record<string, string> = {
            'Illuminate\\Config\\Repository': 'Illuminate\\Contracts\\Config\\Repository',
            'Illuminate\\Cache\\CacheManager': 'Illuminate\\Contracts\\Cache\\Repository',
            'Illuminate\\Session\\SessionManager': 'Illuminate\\Contracts\\Session\\Session',
            'Illuminate\\Events\\Dispatcher': 'Illuminate\\Contracts\\Events\\Dispatcher',
            'Illuminate\\Bus\\Dispatcher': 'Illuminate\\Contracts\\Bus\\Dispatcher',
            'Illuminate\\Queue\\QueueManager': 'Illuminate\\Contracts\\Queue\\Queue',
            'Illuminate\\Routing\\UrlGenerator': 'Illuminate\\Contracts\\Routing\\UrlGenerator',
            'Illuminate\\Routing\\ResponseFactory': 'Illuminate\\Contracts\\Routing\\ResponseFactory'
        };

        if (contractReplacements[resolvedClass]) {
            resolvedClass = contractReplacements[resolvedClass];
        }

        return `$this->instance(${resolvedClass}::class, Mockery::mock(${resolvedClass}::class));`;
    }
}
