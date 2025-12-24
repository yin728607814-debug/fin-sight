/**
 * 环境变量配置管理
 * 统一管理所有环境变量，提供类型安全的访问方式
 */

export interface AppConfig {
  apiKeys: {
    gemini: string;
    news: string;
    alphaVantage: string;
    finnhub: string;
  };
  app: {
    title: string;
    version: string;
    environment: 'development' | 'production' | 'preview';
  };
  api: {
    timeout: number;
    retryAttempts: number;
    cacheTimeout: number;
  };
}

/**
 * 获取环境变量，如果未设置则返回默认值
 */
function getEnvVar(key: string, defaultValue: string = ''): string {
  // 在浏览器环境中，Vite会将环境变量注入到import.meta.env
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key] || defaultValue;
  }
  
  // Node.js 环境（Netlify Functions）
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] || defaultValue;
  }
  
  // 检查全局importMeta对象（测试环境模拟）
  if (typeof globalThis !== 'undefined' && (globalThis as any).importMeta?.env) {
    return (globalThis as any).importMeta.env[key] || defaultValue;
  }
  
  // 检查全局process对象
  if (typeof globalThis !== 'undefined' && (globalThis as any).process?.env) {
    return (globalThis as any).process.env[key] || defaultValue;
  }
  
  return defaultValue;
}

/**
 * 应用配置
 */
export const config: AppConfig = {
  apiKeys: {
    gemini: getEnvVar('VITE_GEMINI_API_KEY') || getEnvVar('GEMINI_API_KEY'),
    news: getEnvVar('VITE_NEWS_API_KEY') || getEnvVar('NEWS_API_KEY'),
    alphaVantage: getEnvVar('VITE_ALPHA_VANTAGE_API_KEY') || getEnvVar('ALPHA_VANTAGE_API_KEY'),
    finnhub: getEnvVar('VITE_FINNHUB_API_KEY') || getEnvVar('FINNHUB_API_KEY'),
  },
  app: {
    title: getEnvVar('VITE_APP_TITLE', 'Investment News Analyzer'),
    version: getEnvVar('VITE_APP_VERSION', '1.0.0'),
    environment: (getEnvVar('NODE_ENV', 'development') as 'development' | 'production' | 'preview') || 'development',
  },
  api: {
    timeout: parseInt(getEnvVar('VITE_API_TIMEOUT', '30000'), 10), // 增加到30秒
    retryAttempts: parseInt(getEnvVar('VITE_API_RETRY_ATTEMPTS', '3'), 10),
    cacheTimeout: parseInt(getEnvVar('VITE_CACHE_TIMEOUT', '300000'), 10), // 5分钟
  },
};

/**
 * 验证必需的环境变量是否已设置
 */
export function validateConfig(): { isValid: boolean; missingKeys: string[] } {
  const requiredKeys = [
    { key: 'GEMINI_API_KEY', value: config.apiKeys.gemini },
    { key: 'NEWS_API_KEY', value: config.apiKeys.news },
    { key: 'ALPHA_VANTAGE_API_KEY', value: config.apiKeys.alphaVantage },
    { key: 'FINNHUB_API_KEY', value: config.apiKeys.finnhub },
  ];

  const missingKeys = requiredKeys
    .filter(({ value }) => !value || value.trim() === '')
    .map(({ key }) => key);

  return {
    isValid: missingKeys.length === 0,
    missingKeys,
  };
}

/**
 * 环境检查
 */
const isProduction = typeof window !== 'undefined' && 
                    window.location.hostname !== 'localhost' && 
                    window.location.hostname !== '127.0.0.1';

if (isProduction) {
  // 生产环境中，API密钥由Netlify函数处理，前端不需要访问
  console.log('🌐 生产环境：API密钥由服务器端Netlify函数处理');
} else if (config.app.environment === 'development') {
  // 开发环境下的配置检查
  const validation = validateConfig();
  if (!validation.isValid) {
    console.warn(
      '⚠️ 缺少必需的环境变量:',
      validation.missingKeys.join(', '),
      '\n请检查 .env 文件或环境变量设置'
    );
  }
}