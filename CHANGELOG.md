# Change Log

All notable changes to the "laravel-facade-resolver" extension will be documented in this file.

## [1.2.3]
- **Architectural Refinement**:
  - Enforced "Contract-First" resolution: All core Laravel facades and helpers now resolve directly to their underlying **Contracts** (Interfaces) rather than concrete Manager classes.
  - This ensures that hover information, "Go to Definition," and auto-imports prioritize Dependency Inversion and SOLID principles by default.
  - Specifically, `auth()` and `Auth::` now resolve and import `Illuminate\Contracts\Auth\Guard`.
  - **Database Alignment**: Realigned the `DB` facade to resolve to `Illuminate\Database\ConnectionInterface` (instead of `Builder`) to promote correct state management and transactional integrity.
- **Context-Aware Method Analysis**:
  - The extension now analyzes the specific method being called on a facade to provide targeted architectural advice.
  - Added specialized deep-dives for `DB::transaction()` (emphasizing transaction orchestration) and `DB::table()` (explaining builder factory isolation).
  - **Stateful Auth Detection**: Hovering over stateful methods like `logout()`, `login()`, or `attempt()` on `Auth::` or `auth()` now intelligently suggests and imports `Illuminate\Contracts\Auth\StatefulGuard` instead of the generic `Guard`.
  - **Manual Event Faking**: Added specialized architectural advice for `Event::fake()`, suggesting a SOLID manual faking approach that uses `EventFake` and the `Dispatcher` contract for cleaner dependency injection in tests.
- **New Helpers & Facades**:
  - Added support for the `Event` facade (mapping to the `events` dispatcher contract).
  - Added support for the `Password` facade, resolving to `Illuminate\Contracts\Auth\PasswordBroker`.
  - Added support for global path helpers (`app_path`, `base_path`, etc.) with custom architectural advice.
  - Added support for the `File` facade, resolving to `Illuminate\Contracts\Filesystem\Filesystem`.
  - Added support for the `Validator` facade, resolving to `Illuminate\Contracts\Validation\Factory`.

## [1.2.2]
- **Architecture Mentorship Expansion**:
  - Significantly enhanced architectural mentorship for `config()` and `storage()` helpers/facades with detailed DIP (Dependency Inversion Principle) and ISP (Interface Segregation Principle) guidance.
  - Added specialized testing snippets and Mockery examples for `config()` and `storage()` to promote better unit testing patterns.
  - Expanded mentorship coverage to include `auth`, `cache`, `log`, `event`, `session`, `validator`, and `view` with context-aware Dependency Inversion tips.
  - Recommended specific Contract imports for all core services to align with Larastan Level 10 and strict SOLID architectures.
- **Global Helper Support**:
  - Added `storage()` global helper resolution to `Illuminate\Filesystem\FilesystemManager`.

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
