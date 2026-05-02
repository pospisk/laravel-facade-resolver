# Change Log

All notable changes to the "laravel-facade-resolver" extension will be documented in this file.
## [1.1.0]
- Added ability to import facade classes by clicking on import in the tooltip

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
