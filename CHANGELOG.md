# Change Log

All notable changes to the "laravel-facade-resolver" extension will be documented in this file.

## [1.2.1]
- **Bug Fixes**:
  - Fixed a critical bug where capitalized facades (e.g., `Log`, `DB`, `Storage`) were failing to trigger tooltips; core facades are now resolved case-insensitively.
  - Fixed `abort()` helpers incorrectly resolving to the `Application` container; they now properly resolve to `Symfony\\Component\\HttpKernel\\Exception\\HttpException`.
  - Removed contradictory Dependency Inversion advice for `abort()` helpers that incorrectly suggested injecting the entire `Application` container (Service Locator anti-pattern).

## [1.2.0] - The Architectural Mentor Update
- **Architectural Code Actions**: Introduced "Convert to Constructor Injection" quick action (Ctrl+.) to automate refactoring Facades to DI.
- **SOLID Education Engine**: Integrated contextual SOLID tips in hovers, including SRP warnings for classes with too many dependencies.
- **Architecture Mentorship Improvements**: 
  - Suppressed generic/irrelevant OCP/LSP fluff when consuming standard core facades.
  - Added severe anti-pattern warnings for `env()` (Environment Coupling) and `app()`/`resolve()` (Service Locator).
  - Corrected testing snippets to mock framework `Contracts` (e.g., `Illuminate\\Contracts\\Cache\\Repository`) rather than concrete `Managers`.
  - Added customized Dependency Inversion logic and specialized Mockery examples for `DB`, `Log`, and `Storage`.
- **Architecture Health Report**: Added `Analyze Architecture Health` command to score your file's SOLID compliance.
- **Deep Key Validation**: Implemented nested validation for `config()` keys and file-existence checks for `view()` helpers.
- **Service Lifecycle Education**: Added visual indicators (🔒 Singleton / 🔄 Transient) to hovers based on service provider bindings.
- **Docstring Proxying**: Tooltips now extract and display the original class-level documentation from the underlying Contract/Interface.
- **Testing & Mocking Integration**: Added dedicated snippets in hovers for quick Mockery/Laravel test setup.
- **Blade File Support**: Extended all resolution and validation features to `.blade.php` files.
- **Custom Domain Support**: Added support for `.facade-resolver.json` to map custom or third-party services.
- **Enhanced Code Lenses**: Added unobtrusive DI reminders above methods using Facades.

## [1.1.0]
- Added ability to import facade classes by clicking on import in the tooltip
- Added **Global Helper Resolution**: Resolves Laravel's global helper functions (e.g., `event()`, `__()`, `redirect()`) to their underlying Dependency Injection Contracts, resolving Larastan's `noGlobalLaravelFunction` strict rules.
- **Tooltip Priority**: Adjusted extension registration specificity to encourage VS Code to display this extension's tooltip at the top.
- **Import Feedback**: The `[Import]` button will now display a notification if the class is already imported, instead of failing silently.
- **New Helpers**: Added support for `route()` resolving to `Illuminate\Contracts\Routing\UrlGenerator`.
- **New Helpers**: Added support for `abort()`, `abort_if()`, and `abort_unless()`.
- **Bug Fixes**: Fixed missing `.js` extension on internal resolver imports which could cause activation issues in some environments.
- **SOLID Compliance**: Updated `back()` helper resolution to `Illuminate\Routing\Redirector` (instead of `RedirectResponse`) to support proper Dependency Injection of the factory service.
- **Inertia Support**: Added `Inertia` facade resolution to `Inertia\ResponseFactory`.
- **Contract Fixes**: Updated `Password` facade to resolve to the `PasswordBroker` contract.

## [1.0.1]
- Added missing Laravel Facades: 
  - `Broadcast`
  - `Bus`
  - `Context`
  - `Date`
  - `Exceptions`
  - `Hash`
  - `Http`
  - `Pipeline`
  - `Process`
  - `RateLimiter`
  - `Response`
  - `Schedule`
  - `View`
  - `Vite`

## [1.0.0]
- Initial release.
- Added Core Laravel Facade resolution mapping for blazing fast lookups.
- Added Dynamic Custom Facade resolution which scans `app/Providers` for application-specific bindings.
- Fully implemented SOLID principles in the extension architecture.
