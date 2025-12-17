/**
 * Jest测试环境设置
 * 设置测试所需的环境变量和全局对象
 */

// 设置测试环境变量
process.env.NODE_ENV = 'test';
process.env.GEMINI_API_KEY = 'test-gemini-key';
process.env.NEWS_API_KEY = 'test-news-key';
process.env.ALPHA_VANTAGE_API_KEY = 'test-alpha-vantage-key';
process.env.VITE_APP_TITLE = 'Investment News Analyzer Test';
process.env.VITE_APP_VERSION = '1.0.0-test';

// 模拟import.meta对象（用于Vite环境变量）
global.importMeta = {
  env: {
    NODE_ENV: 'test',
    GEMINI_API_KEY: 'test-gemini-key',
    NEWS_API_KEY: 'test-news-key',
    ALPHA_VANTAGE_API_KEY: 'test-alpha-vantage-key',
    VITE_APP_TITLE: 'Investment News Analyzer Test',
    VITE_APP_VERSION: '1.0.0-test',
  }
};

// 确保全局对象存在
if (typeof globalThis === 'undefined') {
  global.globalThis = global;
}