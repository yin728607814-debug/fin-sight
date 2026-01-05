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
  if (!supabaseUrl || !supabaseAnonKey) {
    logError('Supabase 配置缺失', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey
    });
    return false;
  }

  if (supabaseUrl.includes('your_supabase') || supabaseAnonKey.includes('your_supabase')) {
    logError('Supabase 配置未设置，请在 .env 文件中配置真实的 Supabase 凭证');
    return false;
  }

  return true;
}

/**
 * 创建 Supabase 客户端实例
 */
function createSupabaseClient(): SupabaseClient | null {
  if (!validateConfig()) {
    return null;
  }

  try {
    const client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,  // 我们使用自定义的用户ID系统
        autoRefreshToken: false
      },
      db: {
        schema: 'public'
      },
      global: {
        headers: {
          'x-client-info': 'portfolio-app'
        },
        fetch: (url, options = {}) => {
          // 设置超时时间为 10 秒
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);
          
          return fetch(url, {
            ...options,
            signal: controller.signal
          }).finally(() => clearTimeout(timeoutId));
        }
      }
    });

    logInfo('Supabase 客户端初始化成功', {
      url: supabaseUrl.substring(0, 30) + '...'
    });

    return client;
  } catch (error) {
    logError('Supabase 客户端初始化失败', error);
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
