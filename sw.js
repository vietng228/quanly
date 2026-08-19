/* sw.js — service worker: cache toàn bộ app để chạy offline hoàn toàn */
const CACHE_NAME = 'thuchi-shop-v7'; // Bump số này ở MỌI lần phát hành để buộc
// trình duyệt xoá cache cũ và lấy bản mới — nếu quên bump, người dùng đã từng
// mở app có thể bị kẹt ở bản cũ vĩnh viễn dù đã cập nhật code lên GitHub.
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css?v=11',
  './js/utils.js?v=11',
  './js/db.js?v=11',
  './js/scanner.js?v=11',
  './js/app.js?v=11',
  './vendor/html5-qrcode.min.js',
  './vendor/xlsx.full.min.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-apple.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function isHtmlRequest(request) {
  return request.mode === 'navigate' || (request.headers.get('accept') || '').includes('text/html');
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // Trang HTML (index.html / điều hướng): luôn ưu tiên lấy bản MỚI NHẤT từ
  // mạng trước, chỉ dùng bản đã lưu khi mất mạng. Nhờ vậy mọi bản cập nhật đưa
  // lên GitHub Pages sẽ hiện ra ngay lần mở app kế tiếp (khi có mạng), thay vì
  // bị kẹt vĩnh viễn ở bản cache-first cũ.
  if (isHtmlRequest(event.request)) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return res;
        })
        .catch(() => caches.match(event.request).then((c) => c || caches.match('./index.html')))
    );
    return;
  }

  // Tài nguyên tĩnh (JS/CSS/ảnh...): cache-first — các file JS/CSS đã có số
  // phiên bản ?v= trong URL nên không lo phục vụ nhầm bản cũ khi có bản mới.
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((res) => {
          if (res && res.status === 200 && res.type === 'basic') {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return res;
        })
        .catch(() => caches.match('./index.html'));
    })
  );
});
