/**
 * 数据验证工具模块
 * 使用Zod进行运行时类型检查和数据验证
 */

import { z } from 'zod';
import { 
  NewsItem, 
  NewsAnalysis, 
  PriceData, 
  AssetInfo, 
  AssetType, 
  ImpactType, 
  TimeFrame,
  ValidationResult 
} from '../types';

// ============================================================================
// Zod Schema定义
// ============================================================================

/**
 * 资产类型Schema
 */
export const AssetTypeSchema = z.enum(['gold', 'nasdaq']);

/**
 * 影响类型Schema
 */
export const ImpactTypeSchema = z.enum(['positive', 'negative', 'neutral']);

/**
 * 时间框架Schema
 */
export const TimeFrameSchema = z.enum(['short', 'medium', 'long']);

/**
 * 新闻项目Schema
 */
export const NewsItemSchema = z.object({
  id: z.string().min(1, '新闻ID不能为空'),
  title: z.string().min(1, '新闻标题不能为空').max(2000, '新闻标题过长'), // 增加长度限制
  content: z.string().min(1, '新闻内容不能为空'), // 至少1个字符即可
  source: z.string().min(1, '新闻来源不能为空'),
  publishedAt: z.date(),
  url: z.string().min(1, '新闻URL不能为空'), // 只要不为空即可，不验证URL格式
  relevanceScore: z.number().min(0, '相关性评分不能小于0').max(1, '相关性评分不能大于1')
});

/**
 * 新闻分析Schema
 */
export const NewsAnalysisSchema = z.object({
  newsId: z.string().min(1, '新闻ID不能为空'),
  impact: ImpactTypeSchema,
  confidence: z.number().min(0, '置信度不能小于0').max(1, '置信度不能大于1'),
  summary: z.string().min(10, '分析摘要至少需要10个字符').max(1000, '分析摘要过长'),
  keyPoints: z.array(z.string().min(1, '关键点不能为空')).min(1, '至少需要一个关键点'),
  predictedChange: z.number().min(-100, '预测变化不能小于-100%').max(100, '预测变化不能大于100%'),
  timeframe: TimeFrameSchema
});

/**
 * 价格数据Schema
 */
export const PriceDataSchema = z.object({
  date: z.date(),
  open: z.number().positive('开盘价必须为正数'),
  high: z.number().positive('最高价必须为正数'),
  low: z.number().positive('最低价必须为正数'),
  close: z.number().positive('收盘价必须为正数'),
  volume: z.number().nonnegative('成交量不能为负数').optional(),
  change: z.number(),
  changePercent: z.number()
}).refine(
  (data) => data.low <= data.high,
  {
    message: '最低价不能高于最高价',
    path: ['low']
  }
).refine(
  (data) => data.low <= data.open && data.open <= data.high,
  {
    message: '开盘价必须在最高价和最低价之间',
    path: ['open']
  }
).refine(
  (data) => data.low <= data.close && data.close <= data.high,
  {
    message: '收盘价必须在最高价和最低价之间',
    path: ['close']
  }
);

/**
 * 资产信息Schema
 */
export const AssetInfoSchema = z.object({
  symbol: z.string().min(1, '资产符号不能为空'),
  name: z.string().min(1, '资产名称不能为空'),
  currentPrice: z.number().positive('当前价格必须为正数'),
  currency: z.string().min(1, '货币单位不能为空'),
  lastUpdated: z.date()
});

// ============================================================================
// 验证函数
// ============================================================================

/**
 * 验证新闻项目
 */
export function validateNewsItem(data: unknown): ValidationResult {
  try {
    NewsItemSchema.parse(data);
    return { isValid: true, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      };
    }
    return { isValid: false, errors: ['验证过程中发生未知错误'] };
  }
}

/**
 * 验证新闻分析
 */
export function validateNewsAnalysis(data: unknown): ValidationResult {
  try {
    NewsAnalysisSchema.parse(data);
    return { isValid: true, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      };
    }
    return { isValid: false, errors: ['验证过程中发生未知错误'] };
  }
}

/**
 * 验证价格数据
 */
export function validatePriceData(data: unknown): ValidationResult {
  try {
    PriceDataSchema.parse(data);
    return { isValid: true, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      };
    }
    return { isValid: false, errors: ['验证过程中发生未知错误'] };
  }
}

/**
 * 验证资产信息
 */
export function validateAssetInfo(data: unknown): ValidationResult {
  try {
    AssetInfoSchema.parse(data);
    return { isValid: true, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      };
    }
    return { isValid: false, errors: ['验证过程中发生未知错误'] };
  }
}

// ============================================================================
// 类型守卫函数
// ============================================================================

/**
 * 检查是否为有效的资产类型
 */
export function isValidAssetType(value: unknown): value is AssetType {
  return AssetTypeSchema.safeParse(value).success;
}

/**
 * 检查是否为有效的影响类型
 */
export function isValidImpactType(value: unknown): value is ImpactType {
  return ImpactTypeSchema.safeParse(value).success;
}

/**
 * 检查是否为有效的时间框架
 */
export function isValidTimeFrame(value: unknown): value is TimeFrame {
  return TimeFrameSchema.safeParse(value).success;
}

/**
 * 检查是否为有效的新闻项目
 */
export function isValidNewsItem(value: unknown): value is NewsItem {
  return NewsItemSchema.safeParse(value).success;
}

/**
 * 检查是否为有效的新闻分析
 */
export function isValidNewsAnalysis(value: unknown): value is NewsAnalysis {
  return NewsAnalysisSchema.safeParse(value).success;
}

/**
 * 检查是否为有效的价格数据
 */
export function isValidPriceData(value: unknown): value is PriceData {
  return PriceDataSchema.safeParse(value).success;
}

/**
 * 检查是否为有效的资产信息
 */
export function isValidAssetInfo(value: unknown): value is AssetInfo {
  return AssetInfoSchema.safeParse(value).success;
}

// ============================================================================
// 数据清理和转换函数
// ============================================================================

/**
 * 清理和转换新闻项目数据
 */
export function sanitizeNewsItem(data: unknown): NewsItem | null {
  try {
    // 处理日期字符串转换
    if (typeof data === 'object' && data !== null && 'publishedAt' in data) {
      const item = { ...data } as any;
      if (typeof item.publishedAt === 'string') {
        item.publishedAt = new Date(item.publishedAt);
      }
      return NewsItemSchema.parse(item);
    }
    return NewsItemSchema.parse(data);
  } catch {
    return null;
  }
}

/**
 * 清理和转换价格数据
 */
export function sanitizePriceData(data: unknown): PriceData | null {
  try {
    // 处理日期字符串转换
    if (typeof data === 'object' && data !== null && 'date' in data) {
      const item = { ...data } as any;
      if (typeof item.date === 'string') {
        item.date = new Date(item.date);
      }
      return PriceDataSchema.parse(item);
    }
    return PriceDataSchema.parse(data);
  } catch {
    return null;
  }
}

/**
 * 清理和转换资产信息数据
 */
export function sanitizeAssetInfo(data: unknown): AssetInfo | null {
  try {
    // 处理日期字符串转换
    if (typeof data === 'object' && data !== null && 'lastUpdated' in data) {
      const item = { ...data } as any;
      if (typeof item.lastUpdated === 'string') {
        item.lastUpdated = new Date(item.lastUpdated);
      }
      return AssetInfoSchema.parse(item);
    }
    return AssetInfoSchema.parse(data);
  } catch {
    return null;
  }
}

// ============================================================================
// 批量验证函数
// ============================================================================

/**
 * 批量验证新闻项目数组
 */
export function validateNewsItems(data: unknown[]): {
  valid: NewsItem[];
  invalid: { index: number; errors: string[] }[];
} {
  const valid: NewsItem[] = [];
  const invalid: { index: number; errors: string[] }[] = [];

  data.forEach((item, index) => {
    const result = validateNewsItem(item);
    if (result.isValid) {
      valid.push(item as NewsItem);
    } else {
      invalid.push({ index, errors: result.errors });
    }
  });

  return { valid, invalid };
}

/**
 * 批量验证价格数据数组
 */
export function validatePriceDataArray(data: unknown[]): {
  valid: PriceData[];
  invalid: { index: number; errors: string[] }[];
} {
  const valid: PriceData[] = [];
  const invalid: { index: number; errors: string[] }[] = [];

  data.forEach((item, index) => {
    const result = validatePriceData(item);
    if (result.isValid) {
      valid.push(item as PriceData);
    } else {
      invalid.push({ index, errors: result.errors });
    }
  });

  return { valid, invalid };
}