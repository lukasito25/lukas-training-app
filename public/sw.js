// Service Worker for Push Notifications and Offline Support

const CACHE_NAME = 'fitness-companion-v1';
const urlsToCache = [
  '/',
  '/fitness-icon.svg',
  '/manifest.json'
];

// Install Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

// Fetch from Cache or Network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});

// Push Event Handler
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Time for your workout! 🏋️',
    icon: '/fitness-icon.svg',
    badge: '/fitness-icon.svg',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '2'
    },
    actions: [
      {
        action: 'start-workout',
        title: 'Start Workout',
        icon: '/fitness-icon.svg'
      },
      {
        action: 'view-gains',
        title: 'View Expected Gains',
        icon: '/fitness-icon.svg'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('🏋️ Fitness Companion', options)
  );
});

// Notification Click Handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'start-workout') {
    event.waitUntil(
      clients.openWindow('/?view=workout')
    );
  } else if (event.action === 'view-gains') {
    event.waitUntil(
      clients.openWindow('/?view=measurements')
    );
  } else {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Background Sync for offline data
self.addEventListener('sync', (event) => {
  if (event.tag === 'workout-sync') {
    event.waitUntil(syncWorkoutData());
  }
});

async function syncWorkoutData() {
  // Sync any pending workout data when connection is restored
  console.log('Syncing workout data...');
}