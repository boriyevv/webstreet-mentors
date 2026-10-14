const CACHE = 'wsm-v1';
const PRECACHE = ['/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  if (url.pathname.startsWith('/api/')) return; // API hech qachon keshlanmaydi
  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/')) {
    e.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      }))
    );
    return;
  }
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).catch(() => new Response(
        '<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><body style="font-family:system-ui;display:grid;place-items:center;height:100vh;margin:0;color:#0b1220"><div style="text-align:center;padding:24px"><h2>Internet yo\'q</h2><p style="color:#64748b">Aloqa tiklangach qayta urinib ko\'ring.</p></div>',
        { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      ))
    );
  }
});
