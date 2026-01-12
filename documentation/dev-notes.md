# BSA: Breakfast Suggester App – Development & PWA Notes

This document contains critical information for development, testing,
service worker behavior, and deployment.  
Saved for future reference.

---

## 1. Local Testing (DO NOT push just to test)

Always test locally before pushing to GitHub Pages.

Use a local static server:

### Option A
npx http-server

### Option B
npx serve

Why this is required:
- Service Workers do NOT work correctly with file://
- Matches GitHub Pages behavior
- Prevents breaking live users during experimentation
- Allows phone testing over local network

---

## 2. Testing on Phone

To test on phone:
- Use local network IP (not localhost)

Example:
http://192.168.x.x:3000

Notes:
- IP changes when Wi-Fi network changes
- This is normal
- Works on both Android and iPhone

---

## 3. Service Worker Debugging (IMPORTANT)

Service Workers aggressively cache files.
Old versions may appear even after refresh.

### During development
Open DevTools → Application → Service Workers

Enable:
- Update on reload → forces latest service worker
- Bypass for network → ignores service worker temporarily

Use when:
- Changes don’t reflect
- App behaves like an older version

---

### If things feel “stuck”
In DevTools:
- Click “Unregister Service Worker”
- Reload page

This is safe and site-specific.

---

## 4. Cache Versioning (MANDATORY for releases)

Service Workers do NOT auto-update cached files.

Every release must bump the cache name.

Example:
const CACHE_NAME = 'bsa-cache-v1.1.1';

Never reuse an old cache name.

---

### Required activate cleanup
Old caches must be deleted:

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
});

Why:
- Ensures users receive updates
- Prevents stale UI bugs
- Does NOT delete IndexedDB data

---

## 5. IndexedDB Safety

IndexedDB is separate from cache storage.

What does NOT delete user data:
- Hard reload
- Clearing cache
- Updating service worker
- App updates

What DOES delete user data:
- Manual deletion in DevTools
- indexedDB.deleteDatabase()

---

## 6. iPhone / iOS Reality

iOS Safari caches aggressively.

Sometimes required:
- Close Safari completely (swipe away)
- Reopen app or reinstall PWA icon

No on-device DevTools exist on iPhone.
This is normal iOS behavior.

---

## 7. Safe Release Workflow

Recommended process:

1. Develop locally using npx
2. Test on phone via local IP
3. Bump cache version
4. Commit changes
5. Push to GitHub
6. Tag release
7. Deploy via GitHub Pages

---

## 8. Git Command Reminders

git status        → view changes  
git add .         → stage changes  
git commit -m ""  → create commit  
git push          → push to GitHub  
git tag v1.x.x    → create version tag  
git push origin v1.x.x → push tag  

---

End of document.
