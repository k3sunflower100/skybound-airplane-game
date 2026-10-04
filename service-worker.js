const CACHE_NAME = 'skybound-shell-v5';
const BASE_URL = self.registration.scope;
const THREE_URL = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
const EXTERNAL_ASSETS = [
  THREE_URL,
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/examples/js/postprocessing/Pass.js',
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/examples/js/shaders/CopyShader.js',
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/examples/js/shaders/LuminosityHighPassShader.js',
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/examples/js/shaders/BokehShader.js',
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/examples/js/postprocessing/ShaderPass.js',
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/examples/js/postprocessing/EffectComposer.js',
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/examples/js/postprocessing/RenderPass.js',
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/examples/js/postprocessing/UnrealBloomPass.js',
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/examples/js/postprocessing/BokehPass.js',
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/examples/js/loaders/RGBELoader.js'
];
const CORE_FILES = [
  './index.html',
  './manifest.json',
  './style.css?v=topgun-hud-v4',
  './script.js?v=topgun-hud-v4',
  './textures/grand-canyon-landsat.jpg',
  './textures/mount-mabu-landsat.jpg',
  './textures/sunset-fairway-2k.hdr',
  './assets/pilots/maverick.jpg',
  './assets/pilots/rooster.jpg',
  './assets/pilots/phoenix.jpg',
  './assets/pilots/payback.jpg',
  './assets/pilots/coyote.jpg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png'
].map(path => new URL(path, BASE_URL).href);
const AUDIO_FILES = [
  './audio/engine-loop.mp3',
  './audio/flight-music.mp3',
  './audio/ring-bonus.mp3'
].map(path => new URL(path, BASE_URL).href);

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(CORE_FILES);
    await Promise.all(AUDIO_FILES.map(async url => {
      try {
        const response = await fetch(url);
        if (response.ok) await cache.put(url, response);
      } catch (_) {}
    }));
    await Promise.all(EXTERNAL_ASSETS.map(async url => {
      try {
        const response = await fetch(url, { mode: url === THREE_URL ? 'no-cors' : 'cors' });
        if (response.ok || response.type === 'opaque') await cache.put(url, response);
      } catch (_) {}
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith('skybound-shell-') && name !== CACHE_NAME).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (EXTERNAL_ASSETS.includes(url.href)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(url.href);
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok || response.type === 'opaque') await cache.put(url.href, response.clone());
      return response;
    })());
    return;
  }
  if (url.origin !== self.location.origin || !url.href.startsWith(BASE_URL)) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    if (request.headers.has('range')) {
      const full = await cache.match(request.url);
      if (full) {
        const blob = await full.blob();
        const match = /^bytes=(\d+)-(\d*)$/.exec(request.headers.get('range'));
        if (match) {
          const start = Number(match[1]);
          const end = Math.min(match[2] ? Number(match[2]) : blob.size - 1, blob.size - 1);
          return new Response(blob.slice(start, end + 1), {
            status: 206,
            headers: {
              'Content-Type': full.headers.get('Content-Type') || 'audio/mpeg',
              'Content-Length': String(end - start + 1),
              'Content-Range': `bytes ${start}-${end}/${blob.size}`,
              'Accept-Ranges': 'bytes'
            }
          });
        }
      }
    }

    try {
      const response = await fetch(request);
      if (response.ok && response.status === 200 && !request.headers.has('range')) await cache.put(request, response.clone());
      return response;
    } catch (_) {
      const cached = await cache.match(request);
      if (cached) return cached;
      if (request.mode === 'navigate') return (await cache.match(new URL('./index.html', BASE_URL).href)) || Response.error();
      return Response.error();
    }
  })());
});
