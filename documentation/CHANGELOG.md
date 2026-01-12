# CHANGELOG

## BSA v1.1.1 — Cache versioning & mobile test indicator

### Added
- Cache version bump system in service worker  
  Ensures older cached files are replaced when new updates are deployed.

- Visible version label in UI (v1.1.1)  
  Helps confirm correct version during mobile testing.

- Developer notes for testing, caching, and service worker behavior  
  Keeps important dev workflow instructions documented.

### Changed
- Service worker cache name updated  
  Prevents stale files from persisting after updates.

### Why
- Makes update testing easier on mobile devices  
- Prevents caching issues during future deployments  
- Establishes a stable update workflow before next development phase

---

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
