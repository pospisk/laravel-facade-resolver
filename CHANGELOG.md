# Change Log

All notable changes to the "laravel-facade-resolver" extension will be documented in this file.

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
