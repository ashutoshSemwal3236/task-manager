const CACHE_NAME = "task-manager-v12";
const urlsToCache = [
  "/",
  "/index.html",
  "/styles.css",
  "/app.js",
  "/assets/alarm.wav",
  "/assets/task-icon.svg",
  "https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap",
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css",
  "https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

self.addEventListener("push", (event) => {
  console.log("Push event received:", event);
  let data = { title: "Task Reminder", body: "A task is due!" };
  if (event.data) {
    data = event.data.json();
  }
  self.registration.showNotification(data.title, {
    body: data.body,
    icon: "/assets/task-icon.svg",
    badge: "/assets/task-icon.svg",
    vibrate: [200, 100, 200],
  });
});
