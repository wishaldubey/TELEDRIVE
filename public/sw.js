// This is the service worker with the combined offline experience

const CACHE = "teledrive-offline-v1";

const offlineFallbackPage = "/";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => {
      return cache.addAll([
        offlineFallbackPage,
        "/logo.webp",
        "/manifest.json"
      ]);
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE) {
            return caches.delete(key);
          }
        })
      );
    })
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        event.waitUntil(updateCache(event.request, response.clone()));
        return response;
      })
      .catch((error) => {
        return fromCache(event.request);
      })
  );
});

function fromCache(request) {
  return caches.open(CACHE).then((cache) => {
    return cache.match(request).then((matching) => {
      if (!matching || matching.status === 404) {
        if (request.destination !== "document" || request.mode !== "navigate") {
          return Promise.reject("no-match");
        }
        return caches.match(offlineFallbackPage);
      }
      return matching;
    });
  });
}

function updateCache(request, response) {
  return caches.open(CACHE).then((cache) => {
    return cache.put(request, response);
  });
} 