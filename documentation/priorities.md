## PRIORITIES
#### PRIORITY-1
 - Vision, main features to be added.
#### PRIORITY-2
 - Necessary & important bug fixes.
#### PRIORITY-3
 - Optional features & minor bugs.

Note: All priorities mentioned are future oriented. Current state is different. Bugs mentioned are current bugs to be fixed in future. Features are to be achieved in future. Current features can be viewed by accessing CHANGELOG.md or alternatively, viewing previous priorities.md file.

---
### BSA v1.1.0 – Development Priorities

#### 🔴 Priority 1 — Fix buggy UI behavior (especially on mobile)

- Buttons sometimes not responding on phones
- Restore action occasionally requiring retry
- Edit, delete, and restore actions conflicting in certain flows
- Make interactions predictable and consistent across devices

Goal: the app should always respond reliably to user actions, especially on mobile.

---

#### 🟡 Priority 2 — Necessary bug fixes

- Image not restoring correctly on mobile after delete → restore
- Save button sometimes working inconsistently during edit
- Restore button becoming temporarily unresponsive
- Prevent invalid action combinations (example: delete while editing)

---

#### 🟢 Priority 3 — Improvements & optional features

##### UI & UX
- Fade-out toast notifications (add / delete / restore / permanent delete)
- Thumbnails in “All Breakfasts” and “Recently Deleted”
- Recently Deleted: click row → expand → show Restore / Delete
- Warn only on permanent deletion (single confirmation)
- Disable background buttons when a modal is open
- Clicking outside modal to close (future)

##### Functionality
- Remove unused “save to script.js” checkbox
- Clean up deleted images after permanent delete (later)
- Edit breakfast image from breakfast page (future)

###### Visual polish
- Fix mobile auto-zoom when image loads
- Improve button weight / contrast consistency on mobile
