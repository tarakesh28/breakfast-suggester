# CHANGELOG

## BSA v1.1.0

### Added
- IndexedDB-based storage for breakfasts, notes, and images
- Offline-first data persistence suitable for mobile and PWA usage
- Recently Deleted system with restore and permanent delete
- Default breakfasts automatically created on first run

### Changed
- Removed dependency on Node backend for data storage
- Breakfast images stored as Blobs in browser storage
- App can now be tested fully offline using local or hosted static servers

### Known Issues
- Some UI interactions can be inconsistent on mobile devices
- Restore action may occasionally require retry
- Image restoration on mobile is not always reliable

These issues are planned to be addressed in v1.2.0.
