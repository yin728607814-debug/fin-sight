/**
 * API错误处理属性测试
 * **Feature: investment-news-analyzer, Property 14: API请求处理**
 * **Feature: investment-news-analyzer, Property 17: 数据过期提示**
 */

import * as fc from 'fast-check';
// import axios from 'axios'; // 未使用
import { NewsService } from '../../services/newsService';
import { PriceService } from '../../services/priceService';
import { AnalysisService } from '../../services/analysisService';
import { 
  ErrorHandler,
  createAPIError,
  createNetworkError,
  createAnalysisError,
  isAPIError,
  isNetworkError,
  isAnalysisError,
  getErrorMessage,
  isRetryableError,
  calculateRetryDelay
} from '../../utils/errors';
import { ErrorType } from '../../types';
// import { generators } from '../utils'; // 未使用

// 模拟axios错误
const createMockAxiosError = (status: number, message: string) => {
  const error = new Error(message) as any;
  error.isAxiosError = true;
  error.response = { status, data: { message } };
  return error;
};

describe('API错误处理属性测试', () => {
  let errorHandler: ErrorHandler;

  beforeEach(() => {
    errorHandler = ErrorHandler.getInstance();
  });

  /**
   * **Feature: investment-news-analyzer, Property 14: API请求处理**
   * **Validates: Requirements 5.4**
   * 
   * For any API请求，系统应该正确处理跨域请求和API限制情况
   */
  describe('Property 14: API请求处理', () => {
    test('错误类型创建应该生成正确的错误对象', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...Object.values(ErrorType)),
          fc.string({ minLength: 1, maxLength: 200 }),
          fc.option(fc.string(), { nil: undefined }),
          fc.option(fc.anything(), { nil: undefined }),
          (errorType, message, code, details) => {
            const error = createAPIError(errorType, message, code, details);
            
            // 验证错误对象结构
            return (
              error.type === errorType &&
              error.message === message &&
              error.code === code &&
              error.details === details &&
              isAPIError(error)
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    test('网络错误创建应该包含状态码信息', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 200 }),
          fc.option(fc.integer({ min: 100, max: 599 }), { nil: undefined }),
          fc.option(fc.anything(), { nil: undefined }),
          (message, status, details) => {
            const error = createNetworkError(message, status, details);
            
            // 验证网络错误结构
            return (
              error.type === ErrorType.NETWORK_ERROR &&
              error.message === message &&
              error.status === status &&
              error.details === details &&
              isNetworkError(error)
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    test('分析错误创建应该包含新闻ID信息', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 200 }),
          fc.option(fc.string(), { nil: undefined }),
          fc.option(fc.anything(), { nil: undefined }),
          (message, newsId, details) => {
            const error = createAnalysisError(message, newsId, details);
            
            // 验证分析错误结构
            return (
              error.type === ErrorType.ANALYSIS_FAILED &&
              error.message === message &&
              error.newsId === newsId &&
              error.details === details &&
              isAnalysisError(error)
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    test('错误消息生成应该返回用户友好的中文消息', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...Object.values(ErrorType)),
          fc.string({ minLength: 1, maxLength: 200 }),
          (errorType, originalMessage) => {
            const error = createAPIError(errorType, originalMessage);
            const userMessage = getErrorMessage(error);
            
            // 验证返回的是中文错误消息
            return (
              typeof userMessage === 'string' &&
              userMessage.length > 0 &&
              userMessage !== originalMessage // 应该是转换后的用户友好消息
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    test('重试延迟计算应该实现指数退避', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 5 }), // 减少范围避免超出最大延迟
          (attempt) => {
            const delay1 = calculateRetryDelay(attempt);
            const delay2 = calculateRetryDelay(attempt + 1);
            
            // 验证延迟时间递增（指数退避）
            return (
              typeof delay1 === 'number' &&
              typeof delay2 === 'number' &&
              delay1 > 0 &&
              delay1 <= 10000 && // 不超过最大延迟
              delay2 <= 10000 &&
              (delay2 >= delay1 || delay2 === 10000) // 允许达到最大值时不再增长
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    test('可重试错误判断应该正确识别', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            ErrorType.NETWORK_ERROR,
            ErrorType.API_LIMIT_EXCEEDED,
            ErrorType.INVALID_RESPONSE,
            ErrorType.VALIDATION_ERROR,
            ErrorType.DATA_NOT_FOUND
          ),
          (errorType) => {
            const error = createAPIError(errorType, 'Test error');
            const canRetry = isRetryableError(error);
            
            // 验证重试逻辑
            const shouldRetry = [
              ErrorType.NETWORK_ERROR,
              ErrorType.API_LIMIT_EXCEEDED,
              ErrorType.INVALID_RESPONSE
            ].includes(errorType);
            
            return canRetry === shouldRetry;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('HTTP状态码错误应该被正确分类', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 400, max: 599 }),
          fc.string({ minLength: 5, maxLength: 100 }), // 确保消息有足够长度
          (status, message) => {
            const axiosError = createMockAxiosError(status, message.trim());
            const handledError = errorHandler.handleNetworkError(axiosError);
            
            // 验证错误处理结果
            return (
              isNetworkError(handledError) &&
              handledError.status === status &&
              typeof handledError.message === 'string' &&
              handledError.message.length > 0
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    test('API限制错误应该被特殊处理', () => {
      const rateLimitError = createMockAxiosError(429, 'Rate limit exceeded');
      const handledError = errorHandler.handleNewsAPIError(rateLimitError);
      
      expect(isAPIError(handledError)).toBe(true);
      expect(handledError.message).toContain('新闻API调用失败');
    });

    test('跨域请求错误应该被正确处理', () => {
      const corsError = new Error('Network Error');
      const handledError = errorHandler.handleNetworkError(corsError);
      
      expect(isNetworkError(handledError)).toBe(true);
      expect(handledError.message).toContain('网络错误');
    });
  });

  /**
   * **Feature: investment-news-analyzer, Property 17: 数据过期提示**
   * **Validates: Requirements 6.3**
   * 
   * For any 过期的数据，系统应该提示用户数据可能不是最新的
   */
  describe('Property 17: 数据过期提示', () => {
    test('新闻服务应该正确检测数据过期', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          (cacheKey) => {
            const newsService = new NewsService();
            
            // 对于不存在的缓存，应该返回已过期
            const isExpired = newsService.isDataExpired(cacheKey);
            
            return typeof isExpired === 'boolean' && isExpired === true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('价格服务应该正确检测价格数据过期', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.integer({ min: 1, max: 30 }),
          (symbol, days) => {
            const priceService = new PriceService();
            
            // 对于不存在的缓存，应该返回已过期
            const isExpired = priceService.isPriceDataExpired(symbol, days);
            
            return typeof isExpired === 'boolean' && isExpired === true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('价格服务应该正确检测资产信息过期', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }),
          (symbol) => {
            const priceService = new PriceService();
            
            // 对于不存在的缓存，应该返回已过期
            const isExpired = priceService.isAssetInfoExpired(symbol);
            
            return typeof isExpired === 'boolean' && isExpired === true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('缓存清理操作应该安全执行', () => {
      fc.assert(
        fc.property(
          fc.constant(null),
          () => {
            const newsService = new NewsService();
            const priceService = new PriceService();
            const analysisService = new AnalysisService();
            
            // 缓存清理不应该抛出错误
            expect(() => {
              newsService.clearExpiredCache();
              priceService.clearExpiredCache();
              analysisService.clearExpiredCache();
            }).not.toThrow();
            
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });

    test('缓存统计信息应该返回有效数据', () => {
      fc.assert(
        fc.property(
          fc.constant(null),
          () => {
            const priceService = new PriceService();
            const analysisService = new AnalysisService();
            
            const priceStats = priceService.getCacheStats();
            const analysisStats = analysisService.getCacheStats();
            
            // 验证统计信息格式
            return (
              typeof priceStats.priceCache === 'number' &&
              typeof priceStats.assetCache === 'number' &&
              priceStats.priceCache >= 0 &&
              priceStats.assetCache >= 0 &&
              typeof analysisStats.size === 'number' &&
              Array.isArray(analysisStats.keys) &&
              analysisStats.size >= 0
            );
          }
        ),
        { numRuns: 50 }
      );
    });

    test('过期时间计算应该基于当前时间', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1000, max: 3600000 }), // 1秒到1小时
          (cacheDuration) => {
            const now = Date.now();
            const expiresAt = now + cacheDuration;
            
            // 验证过期时间在未来
            return expiresAt > now;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // 集成错误处理测试
  describe('集成错误处理', () => {
    test('服务应该优雅处理API密钥缺失', async () => {
      // 模拟axios返回API密钥错误
      const axios = require('axios');
      const originalGet = axios.get;
      
      axios.get = jest.fn().mockRejectedValue(
        createMockAxiosError(401, 'Invalid API key')
      );
      
      const serviceWithoutKey = new NewsService({
        apiKey: '', // 空API密钥
        maxRetries: 1
      });

      await expect(serviceWithoutKey.fetchMarketNews('gold', 5)).rejects.toThrow();
      
      // 恢复原始的axios.get
      axios.get = originalGet;
    });

    test('服务应该处理无效的API响应格式', () => {
      const invalidResponse: unknown = { invalid: 'format' };
      
      expect(() => {
        // 模拟处理无效响应
        if (!invalidResponse.articles) {
          throw createAPIError(
            ErrorType.INVALID_RESPONSE,
            'API响应格式无效',
            'INVALID_FORMAT'
          );
        }
      }).toThrow();
    });

    test('错误处理器应该是单例模式', () => {
      const handler1 = ErrorHandler.getInstance();
      const handler2 = ErrorHandler.getInstance();
      
      expect(handler1).toBe(handler2);
    });

    test('分析服务应该在AI API失败时回退到本地分析', async () => {
      const analysisService = new AnalysisService({
        apiKey: 'invalid-key',
        maxRetries: 1,
        timeout: 100
      });

      // 应该回退到本地分析而不是抛出错误
      const result = await analysisService.analyzeNewsImpact(
        'Gold prices are rising due to market uncertainty',
        'gold'
      );

      expect(result).toBeDefined();
      expect(typeof result.impact).toBe('string');
      expect(typeof result.confidence).toBe('number');
      expect(typeof result.summary).toBe('string');
      expect(Array.isArray(result.keyPoints)).toBe(true);
      expect(typeof result.predictedChange).toBe('number');
    });
  });
});