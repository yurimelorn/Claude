/* Service worker: deixa o app funcionar offline depois da primeira visita. */
const CACHE = 'organizador-tarefas-v17';
const ARQUIVOS = [
  '.',
  'index.html',
  'style.css',
  'app.js',
  'editor.js',
  'pdf.min.js',
  'pdf.worker.min.js',
  'pdf-lib.min.js',
  'manifest.webmanifest',
  'icon-192.png',
  'icon-512.png',
  'icon-180.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARQUIVOS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((chaves) =>
      Promise.all(chaves.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Tocar na notificação abre (ou traz de volta) o app
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((janelas) =>
      janelas.length ? janelas[0].focus() : self.clients.openWindow('.')
    )
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(
      (res) =>
        res ||
        fetch(e.request).then((resposta) => {
          const copia = resposta.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copia));
          return resposta;
        })
    ).catch(() => caches.match('index.html'))
  );
});
