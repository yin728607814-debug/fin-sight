/**
 * 通用工具函数模块
 * 提供日期处理、数据格式化等常用功能
 */

import { format, subDays, isValid, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { AssetType, ImpactType, ASSET_NAMES, ASSET_SYMBOLS, IMPACT_COLORS } from '../types';

// ============================================================================
// 日期处理函数
// ============================================================================

/**
 * 默认时区设置
 */
export const DEFAULT_TIMEZONE = 'Asia/Shanghai';

/**
 * 获取用户时区
 */
export function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_TIMEZONE;
  } catch {
    return DEFAULT_TIMEZONE;
  }
}

/**
 * 在指定时区格式化日期
 */
export function formatDateInTimezone(
  date: Date | string, 
  formatStr: string = 'yyyy年MM月dd日',
  timezone?: string
): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) {
      return '无效日期';
    }
    
    // 简化版本：直接使用format，不处理时区转换
    // 在实际项目中可以考虑使用date-fns-tz包
    return format(dateObj, formatStr, { locale: zhCN });
  } catch {
    return '无效日期';
  }
}

/**
 * 获取当前时区的当前时间
 */
export function getCurrentTimeInTimezone(timezone?: string): Date {
  const tz = timezone || getUserTimezone();
  const now = new Date();
  
  try {
    // 使用Intl.DateTimeFormat来获取时区时间
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    
    const parts = formatter.formatToParts(now);
    const partsObj = parts.reduce((acc, part) => {
      acc[part.type] = part.value;
      return acc;
    }, {} as Record<string, string>);
    
    return new Date(
      `${partsObj.year}-${partsObj.month}-${partsObj.day}T${partsObj.hour}:${partsObj.minute}:${partsObj.second}`
    );
  } catch {
    return now;
  }
}

/**
 * 格式化日期为中文显示
 */
export function formatDate(date: Date | string, formatStr: string = 'yyyy年MM月dd日'): string {
  return formatDateInTimezone(date, formatStr);
}

/**
 * 格式化日期时间为中文显示
 */
export function formatDateTime(date: Date | string): string {
  return formatDateInTimezone(date, 'yyyy年MM月dd日 HH:mm');
}

/**
 * 格式化为相对时间显示
 */
export function formatRelativeTime(date: Date | string): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) {
      return '无效日期';
    }

    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - dateObj.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) {
      return '刚刚';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}分钟前`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours}小时前`;
    } else if (diffInMinutes < 10080) {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days}天前`;
    } else {
      return formatDate(dateObj, 'MM月dd日');
    }
  } catch {
    return '无效日期';
  }
}

/**
 * 格式化时间戳显示
 * 符合需求6.2：显示数据的更新时间戳
 */
export function formatTimestamp(date: Date | string): string {
  return formatDate(date, 'yyyy-MM-dd HH:mm:ss');
}

/**
 * 格式化更新时间显示
 * 符合需求6.2：显示数据更新时间
 */
export function formatUpdateTime(date: Date | string): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) {
      return '未知时间';
    }

    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - dateObj.getTime()) / (1000 * 60));

    if (diffInMinutes < 5) {
      return '刚刚更新';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}分钟前更新`;
    } else {
      return `更新于 ${formatDate(dateObj, 'HH:mm')}`;
    }
  } catch {
    return '未知时间';
  }
}

/**
 * 格式化数据过期提示
 * 符合需求6.3：提示用户数据可能不是最新的
 */
export function formatExpirationWarning(lastUpdated: Date | string, maxAgeMinutes: number = 30): string | null {
  if (!isDataExpired(lastUpdated, maxAgeMinutes)) {
    return null;
  }

  const ageMinutes = getDataAge(lastUpdated);
  
  if (ageMinutes === Infinity) {
    return '数据时间未知，可能不是最新的';
  } else if (ageMinutes < 60) {
    return `数据已过期 ${ageMinutes} 分钟，建议刷新`;
  } else if (ageMinutes < 1440) {
    const hours = Math.floor(ageMinutes / 60);
    return `数据已过期 ${hours} 小时，建议刷新`;
  } else {
    const days = Math.floor(ageMinutes / 1440);
    return `数据已过期 ${days} 天，建议刷新`;
  }
}

/**
 * 计算指定天数前的日期
 */
export function getDaysAgo(days: number): Date {
  return subDays(new Date(), days);
}

/**
 * 获取过去N天的日期范围
 */
export function getDateRange(days: number): { start: Date; end: Date } {
  const end = new Date();
  // 确保至少有1天的范围
  const actualDays = Math.max(1, days);
  const start = getDaysAgo(actualDays - 1); // 包含今天，所以减1
  
  // 如果days为1，确保start稍微早于end
  if (days === 1) {
    const startOfDay = new Date(end);
    startOfDay.setHours(0, 0, 0, 0);
    return { start: startOfDay, end };
  }
  
  return { start, end };
}

/**
 * 获取过去5天的日期范围（专门用于价格趋势图）
 * 符合需求4.2：从当前日期往前推算5天获取价格数据
 */
export function getFiveDayRange(): { start: Date; end: Date } {
  return getDateRange(5);
}

/**
 * 计算5天前的日期
 * 符合需求4.2：系统计算时间范围
 */
export function getFiveDaysAgo(): Date {
  return getDaysAgo(5);
}

/**
 * 检查日期是否在指定的天数范围内
 */
export function isWithinDays(date: Date | string, days: number): boolean {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) {
      return false;
    }
    
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - dateObj.getTime()) / (1000 * 60 * 60 * 24));
    return diffInDays <= days;
  } catch {
    return false;
  }
}

/**
 * 检查数据是否过期
 * 符合需求6.3：数据过期检查
 */
export function isDataExpired(lastUpdated: Date | string, maxAgeMinutes: number = 30): boolean {
  try {
    const lastUpdatedDate = typeof lastUpdated === 'string' ? parseISO(lastUpdated) : lastUpdated;
    if (!isValid(lastUpdatedDate)) {
      return true; // 无效日期视为过期
    }
    
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - lastUpdatedDate.getTime()) / (1000 * 60));
    return diffInMinutes > maxAgeMinutes;
  } catch {
    return true; // 出错时视为过期
  }
}

/**
 * 获取数据年龄（分钟）
 */
export function getDataAge(lastUpdated: Date | string): number {
  try {
    const lastUpdatedDate = typeof lastUpdated === 'string' ? parseISO(lastUpdated) : lastUpdated;
    if (!isValid(lastUpdatedDate)) {
      return Infinity;
    }
    
    const now = new Date();
    return Math.floor((now.getTime() - lastUpdatedDate.getTime()) / (1000 * 60));
  } catch {
    return Infinity;
  }
}

/**
 * 检查是否为工作日
 */
export function isWeekday(date: Date | string = new Date()): boolean {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) {
      return false;
    }
    
    const dayOfWeek = dateObj.getDay();
    return dayOfWeek >= 1 && dayOfWeek <= 5; // 周一到周五
  } catch {
    return false;
  }
}

/**
 * 检查是否为市场交易时间（简化版本）
 */
export function isMarketHours(assetType: AssetType, date: Date | string = new Date()): boolean {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) {
      return false;
    }

    // 首先检查是否为工作日
    if (!isWeekday(dateObj)) {
      return false;
    }

    const hour = dateObj.getHours();
    
    if (assetType === 'nasdaq') {
      // 纳斯达克交易时间：9:30-16:00 EST (考虑时区转换的简化版本)
      return hour >= 9 && hour < 16;
    } else if (assetType === 'gold') {
      // 黄金市场几乎24小时交易，除了周末
      return true;
    }
    
    return false;
  } catch {
    return false;
  }
}

/**
 * 获取下一个交易日
 */
export function getNextTradingDay(date: Date | string = new Date()): Date {
  try {
    let nextDay = typeof date === 'string' ? parseISO(date) : new Date(date);
    
    do {
      nextDay = new Date(nextDay.getTime() + 24 * 60 * 60 * 1000); // 加一天
    } while (!isWeekday(nextDay));
    
    return nextDay;
  } catch {
    return new Date();
  }
}

// ============================================================================
// 数字格式化函数
// ============================================================================

/**
 * 格式化价格显示
 */
export function formatPrice(price: number, currency: string = 'USD'): string {
  try {
    if (currency === 'USD') {
      return `$${price.toLocaleString('en-US', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      })}`;
    } else if (currency === 'CNY') {
      return `¥${price.toLocaleString('zh-CN', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      })}`;
    } else {
      return `${price.toLocaleString('en-US', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      })} ${currency}`;
    }
  } catch {
    return `${price} ${currency}`;
  }
}

/**
 * 格式化百分比显示
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  try {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(decimals)}%`;
  } catch {
    return `${value}%`;
  }
}

/**
 * 格式化大数字显示（K, M, B）
 */
export function formatLargeNumber(num: number): string {
  try {
    if (num >= 1e9) {
      return `${(num / 1e9).toFixed(1)}B`;
    } else if (num >= 1e6) {
      return `${(num / 1e6).toFixed(1)}M`;
    } else if (num >= 1e3) {
      return `${(num / 1e3).toFixed(1)}K`;
    } else {
      return num.toString();
    }
  } catch {
    return num.toString();
  }
}

// ============================================================================
// 资产相关函数
// ============================================================================

/**
 * 获取资产名称
 */
export function getAssetName(assetType: AssetType): string {
  return ASSET_NAMES[assetType] || assetType;
}

/**
 * 获取资产符号
 */
export function getAssetSymbol(assetType: AssetType): string {
  return ASSET_SYMBOLS[assetType] || assetType.toUpperCase();
}

/**
 * 获取影响类型的颜色类名
 */
export function getImpactColor(impact: ImpactType): string {
  return IMPACT_COLORS[impact] || 'text-gray-600';
}

/**
 * 获取影响类型的中文显示
 */
export function getImpactText(impact: ImpactType): string {
  switch (impact) {
    case 'positive':
      return '利好';
    case 'negative':
      return '利空';
    case 'neutral':
      return '中性';
    default:
      return '未知';
  }
}

// ============================================================================
// 字符串处理函数
// ============================================================================

/**
 * 截断文本并添加省略号
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * 清理HTML标签
 */
export function stripHtml(html: string): string {
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  } catch {
    // 如果DOMParser不可用，使用简单的正则表达式
    return html.replace(/<[^>]*>/g, '');
  }
}

/**
 * 高亮关键词
 */
export function highlightKeywords(text: string, keywords: string[]): string {
  if (!keywords.length) return text;
  
  let result = text;
  keywords.forEach(keyword => {
    const regex = new RegExp(`(${keyword})`, 'gi');
    result = result.replace(regex, '<mark>$1</mark>');
  });
  
  return result;
}

// ============================================================================
// 数组处理函数
// ============================================================================

/**
 * 按日期排序（最新的在前）
 */
export function sortByDateDesc<T extends { publishedAt?: Date; date?: Date }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const dateA = a.publishedAt || a.date;
    const dateB = b.publishedAt || b.date;
    
    if (!dateA || !dateB) return 0;
    return dateB.getTime() - dateA.getTime();
  });
}

/**
 * 按相关性评分排序（高分在前）
 */
export function sortByRelevanceDesc<T extends { relevanceScore?: number; confidence?: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const scoreA = a.relevanceScore || a.confidence || 0;
    const scoreB = b.relevanceScore || b.confidence || 0;
    return scoreB - scoreA;
  });
}

/**
 * 去重函数（基于ID）
 */
export function uniqueById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter(item => {
    if (seen.has(item.id)) {
      return false;
    }
    seen.add(item.id);
    return true;
  });
}

// ============================================================================
// URL和网络相关函数
// ============================================================================

/**
 * 检查URL是否有效
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * 获取域名
 */
export function getDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return '';
  }
}

/**
 * 构建查询参数字符串
 */
export function buildQueryString(params: Record<string, string | number | boolean>): string {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });
  
  return searchParams.toString();
}

// ============================================================================
// 本地存储函数
// ============================================================================

/**
 * 安全的localStorage设置
 */
export function setLocalStorage(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/**
 * 安全的localStorage获取
 */
export function getLocalStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

/**
 * 安全的localStorage删除
 */
export function removeLocalStorage(key: string): boolean {
  try {
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// 防抖和节流函数
// ============================================================================

/**
 * 防抖函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: any[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}