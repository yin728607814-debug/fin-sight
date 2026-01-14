/**
 * Supabase 客户端配置
 * 用于连接 Supabase PostgreSQL 数据库
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { logInfo, logError } from './logger';

// 从环境变量获取配置
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * 验证 Supabase 配置
 */
function validateConfig(): boolean {
  console.log('🔍 验证 Supabase 配置...', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    urlValue: supabaseUrl,
    keyPrefix: supabaseAnonKey ? supabaseAnonKey.substring(0, 20) : 'undefined',
    keyLength: supabaseAnonKey ? supabaseAnonKey.length : 0
  });

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Supabase 配置缺失', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey
    });
    return false;
  }

  // 检查是否是占位符
  if (supabaseUrl.includes('your_supabase') || supabaseUrl.includes('your-project')) {
    console.error('❌ Supabase URL 是占位符');
    return false;
  }

  if (supabaseAnonKey.includes('your_supabase') || supabaseAnonKey.includes('your-anon-key')) {
    console.error('❌ Supabase Anon Key 是占位符');
    return false;
  }

  // 验证 URL 格式
  if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
    console.error('❌ Supabase URL 格式不正确', { url: supabaseUrl });
    return false;
  }

  // 验证 Key 格式（支持新旧两种格式）
  const isOldFormat = supabaseAnonKey.startsWith('eyJ'); // JWT token
  const isNewFormat = supabaseAnonKey.startsWith('sb_publishable_'); // Publishable key
  
  if (!isOldFormat && !isNewFormat) {
    console.error('❌ Supabase Anon Key 格式不正确', {
      keyPrefix: supabaseAnonKey.substring(0, 20),
      expectedFormat: 'eyJ... (JWT) 或 sb_publishable_... (Publishable Key)'
    });
    return false;
  }

  console.log('✅ Supabase 配置验证通过', {
    url: supabaseUrl,
    keyFormat: isNewFormat ? 'Publishable Key' : 'JWT Token',
    keyLength: supabaseAnonKey.length
  });

  return true;
}

/**
 * 创建 Supabase 客户端实例
 */
function createSupabaseClient(): SupabaseClient | null {
  console.log('🚀 开始创建 Supabase 客户端...');
  
  if (!validateConfig()) {
    console.error('❌ 配置验证失败，无法创建客户端');
    return null;
  }

  try {
    const client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,  // 启用 session 持久化到 localStorage
        autoRefreshToken: true, // 自动刷新 token
        detectSessionInUrl: true // 检测 URL 中的 session
      },
      db: {
        schema: 'public'
      },
      global: {
        headers: {
          'x-client-info': 'portfolio-app'
        },
        fetch: (url, options = {}) => {
          // 设置超时时间为 60 秒（更长的超时时间）
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 60000);
          
          // 添加重试逻辑
          const fetchWithRetry = async (retries = 3) => {
            try {
              const response = await fetch(url, {
                ...options,
                signal: controller.signal
              });
              clearTimeout(timeoutId);
              return response;
            } catch (error: any) {
              if (retries > 0 && error.name === 'AbortError') {
                console.log(`⏱️ Supabase 请求超时，重试中... (剩余 ${retries} 次)`);
                await new Promise(resolve => setTimeout(resolve, 1000)); // 等待1秒后重试
                return fetchWithRetry(retries - 1);
              }
              clearTimeout(timeoutId);
              throw error;
            }
          };
          
          return fetchWithRetry();
        }
      }
    });

    console.log('✅ Supabase 客户端创建成功', {
      url: supabaseUrl.substring(0, 30) + '...'
    });

    return client;
  } catch (error) {
    console.error('❌ Supabase 客户端创建失败', error);
    return null;
  }
}

/**
 * Supabase 客户端单例
 */
export const supabase = createSupabaseClient();

/**
 * 检查 Supabase 是否可用
 */
export function isSupabaseAvailable(): boolean {
  return supabase !== null;
}

/**
 * 测试 Supabase 连接
 */
export async function testSupabaseConnection(): Promise<boolean> {
  if (!supabase) {
    return false;
  }

  try {
    // 尝试查询一个简单的表（即使不存在也能测试连接）
    const { error } = await supabase.from('positions').select('count', { count: 'exact', head: true });
    
    if (error && error.code !== 'PGRST116') {  // PGRST116 = 表不存在，但连接正常
      logError('Supabase 连接测试失败', error);
      return false;
    }

    logInfo('Supabase 连接测试成功');
    return true;
  } catch (error) {
    logError('Supabase 连接测试异常', error);
    return false;
  }
}
