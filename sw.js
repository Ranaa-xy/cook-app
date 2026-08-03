/**
 * 拍照识菜 - Service Worker
 * 提供离线缓存和 PWA 支持
 */

const CACHE_NAME = 'cookcam-v2';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './conflict-data.js',
    './manifest.json',
];

// 安装：缓存核心文件
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        }).then(() => {
            return self.skipWaiting();
        })
    );
});

// 激活：清理旧缓存
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            );
        }).then(() => {
            return self.clients.claim();
        })
    );
});

// 请求：缓存优先，网络回退
self.addEventListener('fetch', (event) => {
    // 跳过 API 请求和非 GET 请求
    if (event.request.method !== 'GET') return;
    if (event.request.url.includes('/v1/chat/completions')) return;
    if (event.request.url.includes('dashscope')) return;

    event.respondWith(
        caches.match(event.request).then((cached) => {
            // 缓存命中，直接返回
            if (cached) return cached;

            // 网络请求
            return fetch(event.request).then((response) => {
                // 只缓存成功的响应
                if (!response || response.status !== 200) return response;

                const clone = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, clone);
                });
                return response;
            }).catch(() => {
                // 网络失败，返回离线页面（对于 HTML 请求）
                if (event.request.headers.get('accept')?.includes('text/html')) {
                    return caches.match('./index.html');
                }
                // 对于其他资源，静默失败
                return new Response('', { status: 408 });
            });
        })
    );
});
