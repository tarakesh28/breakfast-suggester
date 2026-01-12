## Roadmap

This file tracks forward-looking work.  
Completed items from this version can be viewed in the changelog.

#### PRIORITY-1
 - Vision, main features to be added.
#### PRIORITY-2
 - Necessary & important bug fixes.
#### PRIORITY-3
 - Optional features & minor bugs.

---
### Development Priorities

#### 🔴 Priority 1 — Mobile stability & restore-image glitch

Goal: eliminate remaining Safari/mobile-only inconsistencies.

- Restored breakfasts sometimes temporarily lose images on mobile
- Restore button occasionally needs reopening modal before responding
- Ensure image blobs rehydrate reliably after restore on all browsers

---

#### 🟡 Priority 2 — UI polish & interaction refinements

- Block text selection for:
  - Breakfast list rows
  - “No image” placeholder text
  - Drag & drop helper text
- Replace text buttons with icons (future UI enhancement)
- Make Recently Deleted rows expandable with inline Restore/Delete actions
- Add toast notifications for add / delete / restore actions

---

#### 🟢 Priority 3 — Future features & enhancements

These are planned improvements after mobile stability and core bug fixes are complete.

##### UI & UX
- Replace floating text buttons with icon-based controls
- Thumbnails in “All Breakfasts” and “Recently Deleted” lists
- Expandable rows in “Recently Deleted” (tap row → reveal Restore / Delete)
- Toast notifications for add / delete / restore / permanent delete
- Clicking outside modal to close
- Gesture-based back navigation from breakfast page
- Prevent text selection on:
  - Breakfast list rows
  - “No image” placeholder text
  - Drag & drop helper text

##### Functionality
- Clean up stored image blobs after permanent delete (future-proofing)
- Offline status indicator (show when app is running from cache)
- Optional image compression before storing in IndexedDB

##### Visual polish
- Refined image centering on suggestion screen
- Consistent spacing for breakfast name regardless of image presence
- Replace remaining layout shifts with fixed layout slots
