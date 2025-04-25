const CACHE_NAME = "task-manager-v9";
const urlsToCache = [
  "/",
  "/index.html",
  "/styles.css",
  "/app.js",
  "/alarm.mp3",
  "https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap",
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css",
  "https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js",
  "https://via.placeholder.com/150?text=Tasks",
  "https://via.placeholder.com/64?text=Task",
  "https://via.placeholder.com/32?text=T",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches
      .match(event.request)
      .then((response) => response || fetch(event.request))
  );
});

self.addEventListener("push", (event) => {
  const data = event.data.json();
  self.registration.showNotification(data.title, {
    body: data.body,
    icon: "https://via.placeholder.com/64?text=Task",
    badge: "https://via.placeholder.com/32?text=T",
    vibrate: [200, 100, 200],
    data: { fontSize: "18px" },
  });
});
