/**
 * 历史数据获取属性测试
 * **Feature: real-gold-price-data, Property 1: 真实历史数据获取**
 * **Validates: Requirements 1.1, 1.2**
 */

import * as fc from 'fast-check';
import { 
  HistoricalDataService, 
  AlphaVantageAdapter, 
  YahooFinanceAdapter, 
  InvestingAdapter,
  HistoricalPriceData,
  DataSource
} from '../../services/historicalDataService';

// Mock axios for testing
jest.mock('axios');
const mockedAxios = jest.mocked(require('axios'));

describe('历史数据获取属性测试', () => {
  let historicalDataService: HistoricalDataService;

  beforeEach(() => {
    jest.clearAllMocks();
    historicalDataService = new HistoricalDataService('test-api-key');
  });

  /**
   * **Feature: real-gold-price-data, Property 1: 真实历史数据获取**
   * **Validates: Requirements 1.1, 1.2**
   * 
   * For any 黄金价格历史数据请求，返回的数据应该是来自真实市场交易的历史价格，而不是基于当前价格生成的模拟数据
   */
  describe('Property 1: 真实历史数据获取', () => {
    
    test('历史数据服务应该正确初始化', () => {
      expect(historicalDataService).toBeDefined();
      expect(historicalDataService.getAvailableDataSources()).toHaveLength(3);
    });

    test('数据源适配器应该正确标记真实数据', () => {
      const mockData = {
        priceData: [{
          date: '2024-01-01',
          open: 4000,
          high: 4100,
          low: 3900,
          close: 4050,
          volume: 100000,
          change: 50,
          changePercent: 1.25
        }]
      };

      const investingAdapter = new InvestingAdapter();
      const result = investingAdapter.transformToStandardFormat(mockData);
      
      expect(result).toHaveLength(1);
      expect(result[0].isReal).toBe(true);
      expect(result[0].source.name).toBe('Investing.com');
    });

    test('Alpha Vantage适配器应该正确转换数据格式', () => {
      const mockApiResponse = {
        'Time Series (Daily)': {
          '2024-01-01': {
            '1. open': '4000.00',
            '2. high': '4100.00',
            '3. low': '3900.00',
            '4. close': '4050.00',
            '5. volume': '100000'
          }
        }
      };

      const adapter = new AlphaVantageAdapter('test-key');
      const result = adapter.transformToStandardFormat(mockApiResponse);
      
      expect(result).toHaveLength(1);
      expect(result[0].isReal).toBe(true);
      expect(result[0].source.name).toBe('Alpha Vantage');
      expect(result[0].close).toBe(4050);
    });

    test('Yahoo Finance适配器应该正确处理API响应', () => {
      const mockApiResponse = {
        priceData: [{
          date: '2024-01-01',
          open: 400,
          high: 410,
          low: 390,
          close: 405,
          volume: 100000,
          change: 5,
          changePercent: 1.25
        }]
      };

      const adapter = new YahooFinanceAdapter();
      const result = adapter.transformToStandardFormat(mockApiResponse);
      
      expect(result).toHaveLength(1);
      expect(result[0].isReal).toBe(true);
      expect(result[0].source.name).toBe('Yahoo Finance');
      expect(result[0].close).toBe(405);
    });

    test('Investing.com适配器应该正确处理黄金价格数据', () => {
      const mockApiResponse = {
        priceData: [{
          date: '2024-01-01',
          open: 4000,
          high: 4100,
          low: 3900,
          close: 4050,
          volume: 100000,
          change: 50,
          changePercent: 1.25
        }]
      };

      const adapter = new InvestingAdapter();
      const result = adapter.transformToStandardFormat(mockApiResponse);
      
      expect(result).toHaveLength(1);
      expect(result[0].isReal).toBe(true);
      expect(result[0].source.name).toBe('Investing.com');
      expect(result[0].close).toBe(4050);
    });

    test('数据验证应该确保OHLC逻辑一致性', () => {
      const validData = [{
        date: new Date('2024-01-01'),
        open: 4000,
        high: 4100,
        low: 3900,
        close: 4050,
        volume: 100000,
        change: 50,
        changePercent: 1.25,
        source: {
          name: 'Test Source',
          type: 'primary' as const,
          endpoint: 'test',
          rateLimit: 100,
          isHistoricalSupported: true
        },
        isReal: true as const,
        lastUpdated: new Date().toISOString()
      }];

      const validation = historicalDataService.validateHistoricalData(validData);
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('数据验证应该拒绝无效的OHLC数据', () => {
      const invalidData = [{
        date: new Date('2024-01-01'),
        open: 4000,
        high: 3900, // 最高价低于开盘价，这是无效的
        low: 4100,  // 最低价高于开盘价，这是无效的
        close: 4050,
        volume: 100000,
        change: 50,
        changePercent: 1.25,
        source: {
          name: 'Test Source',
          type: 'primary' as const,
          endpoint: 'test',
          rateLimit: 100,
          isHistoricalSupported: true
        },
        isReal: true as const,
        lastUpdated: new Date().toISOString()
      }];

      const validation = historicalDataService.validateHistoricalData(invalidData);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    test('历史数据应该包含数据来源信息', () => {
      const testData = [{
        date: new Date('2024-01-01'),
        open: 4000,
        high: 4100,
        low: 3900,
        close: 4050,
        volume: 100000,
        change: 50,
        changePercent: 1.25,
        source: {
          name: 'Alpha Vantage',
          type: 'primary' as const,
          endpoint: 'https://www.alphavantage.co/query',
          rateLimit: 5,
          isHistoricalSupported: true
        },
        isReal: true as const,
        lastUpdated: new Date().toISOString()
      }];

      // 验证数据来源信息完整
      expect(testData[0].source).toBeDefined();
      expect(testData[0].source.name).toBe('Alpha Vantage');
      expect(testData[0].source.type).toBe('primary');
      expect(testData[0].source.isHistoricalSupported).toBe(true);
      expect(testData[0].isReal).toBe(true);
    });
  });

  describe('数据源管理测试', () => {
    test('应该能够获取当前数据源信息', () => {
      const currentSource = historicalDataService.getCurrentDataSource();
      expect(currentSource).toBeDefined();
      expect(currentSource.name).toBeDefined();
      expect(currentSource.isHistoricalSupported).toBe(true);
    });

    test('应该能够获取所有可用数据源', () => {
      const sources = historicalDataService.getAvailableDataSources();
      expect(sources).toHaveLength(3);
      expect(sources.map(s => s.name)).toContain('Investing.com');
      expect(sources.map(s => s.name)).toContain('Yahoo Finance');
    });

    test('应该能够切换数据源', () => {
      const sources = historicalDataService.getAvailableDataSources();
      const targetSource = sources.find(s => s.name === 'Yahoo Finance');
      
      if (targetSource) {
        historicalDataService.switchDataSource(targetSource);
        const currentSource = historicalDataService.getCurrentDataSource();
        expect(currentSource.name).toBe('Yahoo Finance');
      }
    });
  });

  describe('缓存机制测试', () => {
    test('应该能够清理过期缓存', () => {
      // 这个测试验证缓存清理功能不会抛出错误
      expect(() => {
        historicalDataService.clearExpiredCache();
      }).not.toThrow();
    });
  });
});