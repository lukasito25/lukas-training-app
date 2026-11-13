// LiftWise service worker: lets the app open and log workouts offline.
// - Page loads: network first, fall back to the cached shell (so new deploys show up right away).
// - Built assets (/assets/*, hashed names): cache first, since they never change.
// - Anything cross-origin (Supabase, fonts, MCP) is left to the network.

const CACHE = 'liftwise-v2';
const SHELL = ['/', '/manifest.json', '/liftwise-icon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => Promise.allSettled(SHELL.map((u) => c.add(u)))),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('/', copy));
          return res;
        })
        .catch(() => caches.match('/').then((r) => r || Response.error())),
    );
    return;
  }

  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(req, copy));
            }
            return res;
          }),
      ),
    );
  }
});

// Workout reminders (sent by the server once accounts and push are enabled).
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : '' };
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'LiftWise', {
      body: data.body || "Today's session is ready.",
      icon: '/liftwise-icon.svg',
      badge: '/liftwise-icon.svg',
      data: { url: data.url || '/#today' },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) => {
      const open = wins.find((w) => new URL(w.url).origin === self.location.origin);
      if (open) {
        open.navigate(target);
        return open.focus();
      }
      return self.clients.openWindow(target);
    }),
  );
});
