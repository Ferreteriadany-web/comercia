/* Comercia · Service Worker — Etapa 1 (instalable + apertura offline básica)
   Regla de oro: la PÁGINA se busca SIEMPRE por internet primero (así siempre ves
   la última versión que subiste). Solo si no hay conexión, se abre la copia guardada.
   Los datos en vivo (Firebase/Firestore) NO se tocan acá: manejan su propia conexión. */

var CACHE = 'comercia-shell-v1';
var SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

// Hosts de recursos estáticos que SÍ conviene cachear para abrir sin internet.
var ASSET_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com', 'cdnjs.cloudflare.com', 'cdn.sheetjs.com'];

self.addEventListener('install', function(e){
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(SHELL).catch(function(){}); }));
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){ if(k !== CACHE) return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e){
  var req = e.request;
  if(req.method !== 'GET') return;
  var url;
  try{ url = new URL(req.url); }catch(err){ return; }

  // 1) Abrir la app (navegación): RED PRIMERO → así siempre traés la última versión.
  //    Sin internet → servimos el index.html guardado.
  if(req.mode === 'navigate'){
    e.respondWith(
      fetch(req).then(function(resp){
        try{ var copy = resp.clone(); caches.open(CACHE).then(function(c){ c.put('./index.html', copy); }); }catch(_){}
        return resp;
      }).catch(function(){
        return caches.match('./index.html').then(function(r){ return r || caches.match('./'); });
      })
    );
    return;
  }

  var sameOrigin = (url.origin === self.location.origin);
  var esGstaticFirebase = (url.hostname === 'www.gstatic.com' && url.pathname.indexOf('/firebasejs/') === 0);
  var esAsset = sameOrigin || ASSET_HOSTS.indexOf(url.hostname) >= 0 || esGstaticFirebase;

  // 2) Recursos estáticos (íconos, fuentes, librerías, SDK de Firebase): cache primero,
  //    si no está, lo busco por red y lo guardo para la próxima.
  if(esAsset){
    e.respondWith(
      caches.match(req).then(function(cached){
        if(cached) return cached;
        return fetch(req).then(function(resp){
          if(resp && (resp.status === 200 || resp.type === 'opaque')){
            try{ var copy = resp.clone(); caches.open(CACHE).then(function(c){ c.put(req, copy).catch(function(){}); }); }catch(_){}
          }
          return resp;
        }).catch(function(){ return cached; });
      })
    );
    return;
  }

  // 3) Todo lo demás (Firestore, login, etc.): pasa directo a la red, sin tocar.
});
