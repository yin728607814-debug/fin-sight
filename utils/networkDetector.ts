/**
 * 网络状态检测工具
 * 帮助诊断 VPN 和网络连接问题
 */

import { logInfo, logWarn } from '../services/logger';
import { config } from '../config/env';

/**
 * 网络状态接口
 */
export interface NetworkStatus {
  isOnline: boolean;
  isVpnDetected: boolean;
  latency: number | null;
  supabaseReachable: boolean;
  geminiReachable: boolean;
}

/**
 * 检测网络延迟
 */
async function checkLatency(url: string): Promise<number | null> {
  try {
    const startTime = Date.now();
    await fetch(url, {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-cache'
    });
    const endTime = Date.now();
    return endTime - startTime;
  } catch (error) {
    return null;
  }
}

/**
 * 检测 Supabase 可达性
 */
async function checkSupabaseReachability(): Promise<boolean> {
  try {
    const supabaseUrl = config.supabase.url;
    if (!supabaseUrl) return false;
    
    await fetch(supabaseUrl, {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-cache'
    });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * 检测 Gemini 可达性
 */
async function checkGeminiReachability(): Promise<boolean> {
  try {
    await fetch('https://generativelanguage.googleapis.com', {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-cache'
    });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * 简单的 VPN 检测
 * 注意：这只是一个粗略的检测，不是100%准确
 */
function detectVpn(): boolean {
  // 检测常见的 VPN 特征
  const userAgent = navigator.userAgent.toLowerCase();
  const hasVpnKeywords = /vpn|proxy|tunnel/i.test(userAgent);
  
  // 检测时区异常（可能使用了 VPN）
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const isChineseTimezone = timezone.includes('Asia/Shanghai') || timezone.includes('Asia/Hong_Kong');
  
  return hasVpnKeywords;
}

/**
 * 获取网络状态
 */
export async function getNetworkStatus(): Promise<NetworkStatus> {
  logInfo('开始检测网络状态...');
  
  const isOnline = navigator.onLine;
  const isVpnDetected = detectVpn();
  
  // 检测延迟（使用百度作为测试）
  const latency = await checkLatency('https://www.baidu.com');
  
  // 检测服务可达性
  const supabaseReachable = await checkSupabaseReachability();
  const geminiReachable = await checkGeminiReachability();
  
  const status: NetworkStatus = {
    isOnline,
    isVpnDetected,
    latency,
    supabaseReachable,
    geminiReachable
  };
  
  logInfo('网络状态检测完成', status);
  
  // 给出建议
  if (!supabaseReachable && geminiReachable) {
    logWarn('检测到 Gemini 可访问但 Supabase 不可达，可能是 VPN 导致的连接问题');
  }
  
  if (latency && latency > 1000) {
    logWarn(`网络延迟较高 (${latency}ms)，可能影响 Supabase 连接`);
  }
  
  return status;
}

/**
 * 获取网络建议
 */
export function getNetworkAdvice(status: NetworkStatus): string[] {
  const advice: string[] = [];
  
  if (!status.isOnline) {
    advice.push('❌ 网络未连接，请检查网络设置');
    return advice;
  }
  
  if (status.isVpnDetected) {
    advice.push('🔒 检测到可能使用了 VPN');
  }
  
  if (status.latency && status.latency > 1000) {
    advice.push(`⚠️ 网络延迟较高 (${status.latency}ms)`);
  }
  
  if (!status.supabaseReachable && status.geminiReachable) {
    advice.push('💡 建议：VPN 可能影响 Supabase 连接，可以尝试：');
    advice.push('  1. 使用分流规则，让 Supabase 直连');
    advice.push('  2. 切换到延迟更低的 VPN 节点');
    advice.push('  3. 临时关闭 VPN 进行数据同步');
  }
  
  if (!status.geminiReachable && status.supabaseReachable) {
    advice.push('💡 需要 VPN 才能访问 Gemini AI 功能');
  }
  
  if (status.supabaseReachable && status.geminiReachable) {
    advice.push('✅ 网络状态良好，所有服务可访问');
  }
  
  return advice;
}
