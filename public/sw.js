// Service Worker for NOTSPAM.uk PWA
// Strategy: Cache-First for shell assets (HTML/CSS/JS).
// EMAIL DATA IS NEVER CACHED — all API requests bypass the SW completely.
// This preserves the zero-persistence privacy promise.

const CACHE_NAME = 'notspam-shell-v1'

// Only cache the static app shell — never email content
const SHELL_URLS = [
  '/',
  '/terms/',
  '/privacy/',
  '/cookies/',
  '/accessibility/',
]

// ── Install: pre-cache the app shell ────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_URLS))
  )
  self.skipWaiting()
})

// ── Activate: clean up old caches ────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

// ── Fetch: network-first for API calls, cache-first for shell ────────────────
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // CRITICAL: Never cache 1secmail API requests — always go to network
  // This ensures email data is never persisted by the service worker
  if (url.hostname === '1secmail.com' || url.hostname === 'www.1secmail.com') {
    event.respondWith(fetch(event.request))
    return
  }

  // For everything else (app shell): cache-first with network fallback
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached
      return fetch(event.request).then((response) => {
        // Only cache successful same-origin responses
        if (
          response.status === 200 &&
          url.origin === self.location.origin
        ) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
        }
        return response
      })
    })
  )
})
