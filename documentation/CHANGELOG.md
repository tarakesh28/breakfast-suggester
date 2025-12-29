# CHANGELOG

## BSAv1.0.0

### Added
- `manifest.json`
  - Defines web app metadata required for Progressive Web App (PWA) support.
- `service-worker.js`
  - Enables caching of core application files for offline usage.

### Changed
- `index.html`
  - Linked the web app manifest.
  - Registered the service worker.

### Deleted
- Removed unnecessary documentation like tasks, bugs, change-log
- new documentation includes compact and efficient CHANGELOG.md (yes, this file) and priorities.md

### Notes
- This version prepares the project for Progressive Web App behavior.
- Core app files can now be cached by the browser.
- Full installability depends on HTTPS hosting and access from a mobile browser.
