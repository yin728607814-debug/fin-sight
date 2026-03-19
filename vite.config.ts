import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const isProduction = mode === 'production';
  
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        '/api/news': {
          target: 'https://newsapi.org/v2',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/news/, ''),
          configure: (proxy, options) => {
            proxy.on('proxyReq', (proxyReq, req, res) => {
              proxyReq.setHeader('User-Agent', 'Investment-News-Analyzer/1.0');
            });
          }
        },
        '/api/alphavantage': {
          target: 'https://www.alphavantage.co',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/alphavantage/, ''),
        },
        '/jisu-news-proxy': {
          target: 'http://localhost:3001',
          changeOrigin: true
        }
      }
    },
    plugins: [react()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.NEWS_API_KEY': JSON.stringify(env.NEWS_API_KEY),
      'process.env.ALPHA_VANTAGE_API_KEY': JSON.stringify(env.ALPHA_VANTAGE_API_KEY),
      'process.env.VITE_NEWS_API_URL': JSON.stringify(env.VITE_NEWS_API_URL || 'https://newsapi.org/v2'),
      'process.env.VITE_ALPHA_VANTAGE_URL': JSON.stringify(env.VITE_ALPHA_VANTAGE_URL || 'https://www.alphavantage.co/query'),
      'process.env.VITE_OPENAI_API_URL': JSON.stringify(env.VITE_OPENAI_API_URL || 'https://api.openai.com/v1'),
      'process.env.VITE_OPENAI_API_KEY': JSON.stringify(env.VITE_OPENAI_API_KEY || ''),
      'process.env.VITE_OPENAI_MODEL': JSON.stringify(env.VITE_OPENAI_MODEL || 'gpt-3.5-turbo'),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    css: {
      postcss: './postcss.config.js',
    },
    build: {
      outDir: 'dist',
      sourcemap: true, // 始终生成 source map 以便调试
      minify: isProduction ? 'esbuild' : false,
      target: 'es2015',
      rollupOptions: {
        output: {
          manualChunks: {
            // 将React相关库分离到单独的chunk
            react: ['react', 'react-dom'],
            // 将路由库分离
            router: ['react-router-dom'],
            // 将图表库分离
            charts: ['chart.js', 'react-chartjs-2'],
            // 将工具库分离
            utils: ['axios', 'date-fns', 'zod'],
          },
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]',
        },
      },
      // 构建优化
      chunkSizeWarningLimit: 1000,
      assetsInlineLimit: 4096,
      // PWA支持 - 复制Service Worker和manifest到dist
      copyPublicDir: true,
    },
    // 预构建优化
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        'chart.js',
        'react-chartjs-2',
        'axios',
        'date-fns',
        'zod',
      ],
    },
  };
});
