/* eslint-disable no-restricted-globals */
/* DineSync: Firebase Cloud Messaging service worker – background push notifications */

importScripts("https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js");

const DEFAULT_CLICK_ACTION = "/dashboard/orders";

self.addEventListener("install", function () {
  self.skipWaiting();
});

fetch("/api/firebase-config")
  .then(function (res) {
    return res.json();
  })
  .then(function (config) {
    if (!firebase.apps.length) {
      firebase.initializeApp(config);
    }
    const messaging = firebase.messaging();

    messaging.onBackgroundMessage(function (payload) {
      const notification = payload.notification || {};
      const title = notification.title || "DineSync";
      const body = notification.body || "";
      const clickAction =
        (payload.data && payload.data.click_action) || DEFAULT_CLICK_ACTION;

      return self.registration.showNotification(title, {
        body: body,
        icon: "/favicon.ico",
        data: {
          url: clickAction,
          ...(payload.data || {}),
        },
        tag: "dinesync-" + (payload.data && payload.data.tag ? payload.data.tag : Date.now()),
      });
    });
  })
  .catch(function (err) {
    console.error("firebase-messaging-sw: init failed", err);
  });

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  const path = (event.notification.data && event.notification.data.url) || DEFAULT_CLICK_ACTION;
  const fullUrl = new URL(path, self.location.origin).href;
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if (client.url.indexOf(self.registration.scope) !== -1 && "focus" in client) {
          client.navigate(fullUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(fullUrl);
      }
    })
  );
});
