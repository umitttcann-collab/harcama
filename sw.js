// Harcama Defteri: uygulama dosyalarını telefonda saklar, internet yokken de açılır.
// Sayfanın kendisi önce internetten istenir (yeni sürüm hemen gelsin), yoksa telefondaki kopya açılır.
const SURUM = 'harcama-v8';
const DOSYALAR = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(SURUM).then(c => c.addAll(DOSYALAR.map(u => new Request(u, { cache: 'reload' })))));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== SURUM).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  if (e.request.mode === 'navigate') {
    e.respondWith(caches.open(SURUM).then(c =>
      fetch(e.request, { cache: 'no-store' })
        .then(r => { if (r.ok) c.put(e.request, r.clone()); return r; })
        .catch(() => c.match(e.request, { ignoreSearch: true }).then(x => x || c.match('./')))
    ));
    return;
  }
  e.respondWith(caches.open(SURUM).then(async c => {
    const eski = await c.match(e.request, { ignoreSearch: true });
    const yeni = fetch(e.request).then(r => { if (r.ok) c.put(e.request, r.clone()); return r; }).catch(() => eski);
    return eski || yeni;
  }));
});
