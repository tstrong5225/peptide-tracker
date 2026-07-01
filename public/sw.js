// Peptide Tracker service worker — handles Web Push notifications.
self.addEventListener("push", (event) => {
  let data = { title: "Peptide Tracker", body: "Time for your dose." };
  try {
    if (event.data) data = event.data.json();
  } catch {}
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: "peptide-reminder",
      renotify: true,
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      for (const c of clientList) {
        if (c.url.includes("/protocols") && "focus" in c) return c.focus();
      }
      if (clients.openWindow) return clients.openWindow("/protocols");
    })
  );
});
