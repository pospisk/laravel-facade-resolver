# Laravel Facade Resolver

[![Marketplace](https://img.shields.io/badge/Marketplace-v1.0.0-007ACC?logo=visual-studio-code&logoColor=white)](https://marketplace.visualstudio.com/items?itemName=pospisk.laravel-facade-resolver)
[![PHP Version](https://img.shields.io/badge/PHP-%3E%3D%208.3-8892BF?logo=php)](https://packagist.org/packages/laravel/framework)

Speed up your Laravel & Larastan (PHPStan Level 10) development workflow!

This VS Code extension instantly resolves Laravel Facades to their underlying bound classes when you hover over them. Instead of clicking through `Facade -> getFacadeAccessor() -> Global Search for bindings`, this extension does it all automatically for you.

## Features

- **Instant Facade Resolution**: Hover over any facade (e.g. `Hash::`) to see the actual class it resolves to.
- **PHPStan Level 10 Ready**: Knowing the exact bound class is essential for writing accurate `@var` annotations and satisfying strict static analysis.
- **Core Laravel Support**: Comes pre-mapped with all core Laravel facades for zero-latency resolution.
- **Dynamic Custom Facades**: Automatically searches your `app/Providers/` directory to resolve your own custom Facades dynamically!

## Preview
![Usage Preview](usage-preview.gif)

## Usage

1. Open any PHP file.
2. Hover your mouse cursor over a Laravel Facade (e.g. `Cache::`, `Auth::`, or `YourCustomFacade::`).
3. A tooltip will appear showing the fully qualified class name bound to that facade.

## Requirements

- VS Code 1.85.0 or higher.
- A Laravel workspace with Facades or `app/Providers` available for custom bindings.
- PHP extension (like Intelephense) should be active to provide Go-to-Definition data.

## Extension Settings

This extension contributes the following settings:

* `laravelFacadeResolver.enable`: Enable/disable this extension.

## Known Issues

- Custom facade resolution performs a basic regex search on `app/Providers`. It might not perfectly resolve highly dynamic bindings or bindings located in vendor packages.

## Release Notes

### 1.0.0
- Initial release
- Core Laravel facade mapping
- Dynamic search in `app/Providers`
