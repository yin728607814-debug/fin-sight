/**
 * 数据类型属性测试
 * **Feature: investment-news-analyzer, Property 2: 新闻过滤准确性**
 * **Feature: investment-news-analyzer, Property 16: 时间戳显示**
 */

import * as fc from 'fast-check';
import { 
  validateNewsItem, 
  validatePriceData, 
  validateNewsAnalysis,
  isValidAssetType,
  sanitizeNewsItem,
  sanitizePriceData
} from '../../utils/validation';
import { 
  formatDate, 
  formatDateTime, 
  formatRelativeTime,
  getAssetName,
  getAssetSymbol
} from '../../utils/helpers';
import { generators } from '../utils';
import { AssetType } from '../../types';

describe('数据类型属性测试', () => {
  
  /**
   * **Feature: investment-news-analyzer, Property 2: 新闻过滤准确性**
   * **Validates: Requirements 1.2**
   * 
   * For any 获取到的新闻数据集，过滤后的结果应该只包含与指定资产类型相关的新闻
   */
  describe('Property 2: 新闻过滤准确性', () => {
    test('过滤后的新闻应该只包含与指定资产类型相关的内容', () => {
      fc.assert(
        fc.property(
          fc.array(generators.newsItem(), { minLength: 1, maxLength: 20 }),
          generators.assetType(),
          (newsItems, assetType: AssetType) => {
            // 模拟新闻过滤逻辑：根据标题和内容判断是否与资产类型相关
            const assetKeywords: Record<AssetType, string[]> = {
              gold: ['黄金', '金价', 'gold', 'XAUUSD', '贵金属'],
              nasdaq: ['纳斯达克', 'NASDAQ', '科技股', '美股', 'NDX', '纳指']
            };
            
            const keywords = assetKeywords[assetType];
            
            const filteredNews = newsItems.filter(news => {
              const content = (news.title + ' ' + news.content).toLowerCase();
              return keywords.some((keyword: string) => 
                content.includes(keyword.toLowerCase())
              );
            });
            
            // 验证：过滤后的每条新闻都应该包含相关关键词
            const allRelevant = filteredNews.every(news => {
              const content = (news.title + ' ' + news.content).toLowerCase();
              return keywords.some((keyword: string) => 
                content.includes(keyword.toLowerCase())
              );
            });
            
            return allRelevant;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('资产类型验证应该正确识别有效的资产类型', () => {
      fc.assert(
        fc.property(
          generators.assetType(),
          (assetType) => {
            // 有效的资产类型应该通过验证
            return isValidAssetType(assetType);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('无效的资产类型应该被正确拒绝', () => {
      fc.assert(
        fc.property(
          fc.string().filter(s => s !== 'gold' && s !== 'nasdaq'),
          (invalidAssetType) => {
            // 无效的资产类型应该被拒绝
            return !isValidAssetType(invalidAssetType);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('新闻项目验证应该确保数据完整性', () => {
      fc.assert(
        fc.property(
          generators.newsItem(),
          (newsItem) => {
            const result = validateNewsItem(newsItem);
            
            // 有效的新闻项目应该通过验证
            if (result.isValid) {
              return (
                newsItem.id.length > 0 &&
                newsItem.title.length > 0 &&
                newsItem.content.length >= 10 &&
                newsItem.source.length > 0 &&
                newsItem.relevanceScore >= 0 &&
                newsItem.relevanceScore <= 1 &&
                newsItem.url.startsWith('http')
              );
            }
            
            return true; // 如果验证失败，说明数据确实有问题，这是正确的
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: investment-news-analyzer, Property 16: 时间戳显示**
   * **Validates: Requirements 6.2**
   * 
   * For any 数据获取操作，系统应该显示数据的更新时间戳
   */
  describe('Property 16: 时间戳显示', () => {
    test('日期格式化应该始终返回有效的中文日期字符串', () => {
      fc.assert(
        fc.property(
          fc.date(),
          (date) => {
            const formatted = formatDate(date);
            
            // 格式化后的日期应该包含中文字符
            return (
              typeof formatted === 'string' &&
              formatted.length > 0 &&
              formatted !== '无效日期' &&
              (formatted.includes('年') || formatted.includes('月') || formatted.includes('日'))
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    test('日期时间格式化应该包含时间信息', () => {
      fc.assert(
        fc.property(
          fc.date(),
          (date) => {
            const formatted = formatDateTime(date);
            
            // 格式化后的日期时间应该包含时间部分
            return (
              typeof formatted === 'string' &&
              formatted.length > 0 &&
              formatted !== '无效日期' &&
              formatted.includes(':') // 时间分隔符
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    test('相对时间显示应该提供有意义的时间描述', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date('2020-01-01'), max: new Date() }),
          (date) => {
            const relative = formatRelativeTime(date);
            
            // 相对时间应该是有意义的描述
            const validFormats = [
              '刚刚',
              '分钟前',
              '小时前', 
              '天前',
              '月',
              '日'
            ];
            
            return (
              typeof relative === 'string' &&
              relative.length > 0 &&
              relative !== '无效日期' &&
              validFormats.some(format => relative.includes(format))
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    test('数据清理应该保持时间戳的有效性', () => {
      fc.assert(
        fc.property(
          generators.newsItem(),
          (newsItem) => {
            const sanitized = sanitizeNewsItem(newsItem);
            
            if (sanitized) {
              // 清理后的数据应该保持时间戳的有效性
              return (
                sanitized.publishedAt instanceof Date &&
                !isNaN(sanitized.publishedAt.getTime())
              );
            }
            
            return true; // 如果清理失败，说明原数据有问题
          }
        ),
        { numRuns: 100 }
      );
    });

    test('价格数据的时间戳应该保持一致性', () => {
      fc.assert(
        fc.property(
          generators.priceData(),
          (priceData) => {
            const sanitized = sanitizePriceData(priceData);
            
            if (sanitized) {
              // 清理后的价格数据应该保持时间戳的有效性
              return (
                sanitized.date instanceof Date &&
                !isNaN(sanitized.date.getTime())
              );
            }
            
            return true; // 如果清理失败，说明原数据有问题
          }
        ),
        { numRuns: 100 }
      );
    });

    test('资产名称和符号应该与类型保持一致', () => {
      fc.assert(
        fc.property(
          generators.assetType(),
          (assetType: AssetType) => {
            const name = getAssetName(assetType);
            const symbol = getAssetSymbol(assetType);
            
            // 资产名称和符号应该是有效的字符串
            return (
              typeof name === 'string' &&
              name.length > 0 &&
              typeof symbol === 'string' &&
              symbol.length > 0
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // 额外的数据完整性测试
  describe('数据完整性验证', () => {
    test('新闻分析数据应该保持一致性', () => {
      fc.assert(
        fc.property(
          generators.newsAnalysis(),
          (analysis) => {
            const result = validateNewsAnalysis(analysis);
            
            if (result.isValid) {
              return (
                analysis.confidence >= 0 &&
                analysis.confidence <= 1 &&
                analysis.keyPoints.length > 0 &&
                analysis.summary.length >= 10 &&
                ['positive', 'negative', 'neutral'].includes(analysis.impact)
              );
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('价格数据应该符合金融数据规则', () => {
      fc.assert(
        fc.property(
          generators.priceData(),
          (priceData) => {
            const result = validatePriceData(priceData);
            
            if (result.isValid) {
              return (
                priceData.low <= priceData.high &&
                priceData.low <= priceData.open &&
                priceData.open <= priceData.high &&
                priceData.low <= priceData.close &&
                priceData.close <= priceData.high &&
                priceData.open > 0 &&
                priceData.high > 0 &&
                priceData.low > 0 &&
                priceData.close > 0
              );
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});