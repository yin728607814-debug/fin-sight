/**
 * 环境变量配置管理
 * 统一管理所有环境变量，提供类型安全的访问方式
 */

export interface AppConfig {
  apiKeys: {
    gemini: string;
    finnhub: string;
  };
  supabase: {
    url: string;
    anonKey: string;
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

declare const __APP_ENV__: Record<string, string | undefined> | undefined;

/**
 * 获取环境变量，如果未设置则返回默认值
 */
function getEnvVar(key: string, defaultValue: string = ''): string {
  // Vite 浏览器构建入口：vite.config.ts 会把 Cloudflare/Vite 环境变量注入到这里。
  if (typeof __APP_ENV__ !== 'undefined' && __APP_ENV__?.[key]) {
    return __APP_ENV__[key] || defaultValue;
  }

  // 检查全局importMeta对象（测试环境模拟）
  if (typeof globalThis !== 'undefined' && (globalThis as any).importMeta?.env) {
    return (globalThis as any).importMeta.env[key] || defaultValue;
  }

  // Node.js 环境（Cloudflare Pages Functions / scripts）；
  // 测试和服务端脚本可从 process.env 读取。
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] || defaultValue;
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
    gemini: getEnvVar('GEMINI_API_KEY') || getEnvVar('VITE_GEMINI_API_KEY'),
    finnhub: getEnvVar('VITE_FINNHUB_API_KEY') || getEnvVar('FINNHUB_API_KEY'),
  },
  supabase: {
    url: getEnvVar('VITE_SUPABASE_URL'),
    anonKey: getEnvVar('VITE_SUPABASE_ANON_KEY'),
  },
  app: {
    title: getEnvVar('VITE_APP_TITLE', 'FinSight AI'),
    version: getEnvVar('VITE_APP_VERSION', '1.0.0'),
    environment: (getEnvVar('NODE_ENV', 'development') as 'development' | 'production' | 'preview') || 'development',
  },
  api: {
    timeout: parseInt(getEnvVar('VITE_API_TIMEOUT', '30000'), 10),
    retryAttempts: parseInt(getEnvVar('VITE_API_RETRY_ATTEMPTS', '3'), 10),
    cacheTimeout: parseInt(getEnvVar('VITE_CACHE_TIMEOUT', '300000'), 10),
  },
};

/**
 * 验证必需的环境变量是否已设置
 */
export function validateConfig(): { isValid: boolean; missingKeys: string[] } {
  const requiredKeys = [
    { key: 'GEMINI_API_KEY', value: config.apiKeys.gemini },
    { key: 'VITE_SUPABASE_URL', value: config.supabase.url },
    { key: 'VITE_SUPABASE_ANON_KEY', value: config.supabase.anonKey },
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
  // 生产环境中，API密钥由Cloudflare Functions处理，前端不需要访问
  console.log('🌐 生产环境：API密钥由服务器端Cloudflare Functions处理');
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
