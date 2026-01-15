// Service Worker for PWA
const CACHE_NAME = 'portfolio-v6'; // 更新版本号以清除旧缓存
const RUNTIME_CACHE = 'portfolio-runtime-v6';

// 需要缓存的静态资源
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// 安装事件 - 缓存静态资源
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching static assets');
      return cache.addAll(STATIC_CACHE_URLS);
    })
  );
  self.skipWaiting();
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // 删除所有旧版本的缓存
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // 立即接管所有页面
      return self.clients.claim();
    })
  );
});

// Fetch事件 - 网络优先策略（适合动态数据）
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 跳过非GET请求
  if (request.method !== 'GET') {
    return;
  }

  // 跳过chrome扩展和开发工具请求
  if (url.protocol === 'chrome-extension:' || url.protocol === 'devtools:') {
    return;
  }

  // 跳过外部字体和样式（让浏览器直接处理，避免CSP问题）
  if (
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com')
  ) {
    return; // 不拦截，让浏览器直接处理
  }

  // JS/CSS 等构建文件使用网络优先策略（确保总是获取最新版本）
  if (
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.jsx') ||
    url.pathname.endsWith('.tsx') ||
    url.pathname.includes('/assets/')
  ) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // 不缓存构建文件，避免旧版本问题
          return response;
        })
        .catch(() => {
          // 网络失败时尝试从缓存获取（离线支持）
          return caches.match(request);
        })
    );
    return;
  }

  // API请求使用网络优先策略
  if (
    url.pathname.includes('/api/') ||
    url.pathname.includes('/.netlify/functions/') ||
    url.hostname.includes('supabase') ||
    url.hostname.includes('gemini') ||
    url.hostname.includes('newsapi') ||
    url.hostname.includes('alphavantage') ||
    url.hostname.includes('finnhub') ||
    url.hostname.includes('1234567.com.cn')
  ) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // 只缓存成功的响应
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // 网络失败时尝试从缓存获取
          return caches.match(request);
        })
    );
    return;
  }

  // 其他静态资源（图片、字体等）使用缓存优先策略
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request).then((response) => {
        // 只缓存成功的响应
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }

        const responseClone = response.clone();
        caches.open(RUNTIME_CACHE).then((cache) => {
          cache.put(request, responseClone);
        });

        return response;
      });
    })
  );
});

// 消息事件 - 支持手动更新
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
