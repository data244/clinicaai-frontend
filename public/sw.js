// Clínica.ai — Service Worker v1.2
const CACHE_NAME = 'clinicaai-v2'
const API_ORIGIN = 'https://clinicaai-backend-production.up.railway.app'

// ── Install ──────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting())
})

// ── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  )
})

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Nunca interceptar: não-GET, API do Railway, rotas /api/, chrome-extension
  if (request.method !== 'GET') return
  if (url.origin === API_ORIGIN) return
  if (url.pathname.startsWith('/api/')) return
  if (!url.protocol.startsWith('http')) return

  // Apenas assets estáticos Next.js → cache-first
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.match(/\.(woff2?|png|jpg|jpeg|svg|ico|webp)$/)
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached
        return fetch(request).then((response) => {
          if (response && response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          }
          return response
        })
      })
    )
  }
  // Tudo mais (HTML, páginas) → deixa o browser lidar normalmente (sem respondWith)
})
