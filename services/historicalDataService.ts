/**
 * 历史数据服务模块
 * 提供统一的历史价格数据获取接口，支持多数据源和故障转移
 */

import axios from 'axios';
import { HistoricalPriceData, DataSource } from '../types';
import { logInfo, logError } from './logger';

export type { HistoricalPriceData, DataSource };

/**
 * 数据验证结果
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * 数据源适配器接口
 */
export interface DataSourceAdapter {
  fetchHistoricalPrices(symbol: string, range: string): Promise<RawPriceData>;
  transformToStandardFormat(rawData: RawPriceData): HistoricalPriceData[];
  isAvailable(): Promise<boolean>;
}

/**
 * 原始价格数据接口（来自各API的原始格式）
 */
export interface RawPriceData {
  [key: string]: any;
}

/**
 * Alpha Vantage适配器
 */
export class AlphaVantageAdapter implements DataSourceAdapter {
  private readonly baseURL = 'https://www.alphavantage.co/query';
  private readonly apiKey: string;
  private readonly source: DataSource;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.source = {
      name: 'Alpha Vantage',
      type: 'primary',
      endpoint: this.baseURL,
      rateLimit: 5, // 每分钟5次请求
      isHistoricalSupported: true
    };
  }

  async fetchHistoricalPrices(symbol: string, _range: string): Promise<RawPriceData> {
    const params = {
      function: 'TIME_SERIES_DAILY',
      symbol: this.normalizeSymbol(symbol),
      outputsize: 'compact',
      apikey: this.apiKey
    };

    const response = await axios.get(this.baseURL, {
      params,
      timeout: 15000,
      headers: {
        'User-Agent': 'Investment-News-Analyzer/1.0'
      }
    });

    // 检查API错误
    if (response.data['Error Message']) {
      throw new Error(`Alpha Vantage API错误: ${response.data['Error Message']}`);
    }

    if (response.data['Note']) {
      throw new Error('Alpha Vantage API调用频率限制，请稍后重试');
    }

    return response.data;
  }

  transformToStandardFormat(rawData: RawPriceData): HistoricalPriceData[] {
    if (!rawData['Time Series (Daily)']) {
      logError('Alpha Vantage响应格式错误', rawData);
      return [];
    }

    const timeSeries = rawData['Time Series (Daily)'];
    const dates = Object.keys(timeSeries).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    return dates.slice(0, 5).map(dateStr => {
      const dayData = timeSeries[dateStr];
      const date = new Date(dateStr);
      const open = parseFloat(dayData['1. open']);
      const high = parseFloat(dayData['2. high']);
      const low = parseFloat(dayData['3. low']);
      const close = parseFloat(dayData['4. close']);
      const volume = parseInt(dayData['5. volume']) || 0;

      return {
        date,
        open,
        high,
        low,
        close,
        volume,
        change: close - open,
        changePercent: ((close - open) / open) * 100,
        source: this.source,
        isReal: true as const,
        lastUpdated: new Date().toISOString()
      };
    }).reverse(); // 按时间正序排列
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await axios.get(this.baseURL, {
        params: {
          function: 'GLOBAL_QUOTE',
          symbol: 'AAPL',
          apikey: this.apiKey
        },
        timeout: 5000
      });
      
      return !response.data['Error Message'] && !response.data['Note'];
    } catch {
      return false;
    }
  }

  private normalizeSymbol(symbol: string): string {
    const symbolMap: Record<string, string> = {
      'gold': 'GLD', // 使用黄金ETF作为代理
      'nasdaq': 'QQQ' // 使用纳斯达克ETF作为代理
    };
    
    return symbolMap[symbol] || symbol.toUpperCase();
  }
}

/**
 * Yahoo Finance适配器
 */
export class YahooFinanceAdapter implements DataSourceAdapter {
  private readonly source: DataSource;

  constructor() {
    this.source = {
      name: 'Yahoo Finance',
      type: 'backup',
      endpoint: '/api/yahoo-finance-proxy',
      rateLimit: 100, // Yahoo Finance限制较宽松
      isHistoricalSupported: true
    };
  }

  async fetchHistoricalPrices(symbol: string, range: string): Promise<RawPriceData> {
    const response = await axios.get('/api/yahoo-finance-proxy', {
      params: { 
        symbol: this.normalizeSymbol(symbol),
        range: range,
        interval: '1d'
      },
      timeout: 15000
    });

    if (response.data.error) {
      throw new Error(`Yahoo Finance API错误: ${response.data.error}`);
    }

    return response.data;
  }

  transformToStandardFormat(rawData: RawPriceData): HistoricalPriceData[] {
    if (!rawData.priceData || !Array.isArray(rawData.priceData)) {
      logError('Yahoo Finance响应格式错误', rawData);
      return [];
    }

    return rawData.priceData.map((item: any) => ({
      date: new Date(item.date),
      open: parseFloat(item.open) || 0,
      high: parseFloat(item.high) || 0,
      low: parseFloat(item.low) || 0,
      close: parseFloat(item.close) || 0,
      volume: parseInt(item.volume) || 0,
      change: parseFloat(item.change) || 0,
      changePercent: parseFloat(item.changePercent) || 0,
      source: this.source,
      isReal: true as const,
      lastUpdated: new Date().toISOString()
    })).filter((item: any) => item.close > 0);
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await axios.get('/api/yahoo-finance-proxy', {
        params: { 
          symbol: 'nasdaq',
          range: '1d',
          interval: '1d'
        },
        timeout: 5000
      });
      
      return !response.data.error;
    } catch {
      return false;
    }
  }

  private normalizeSymbol(symbol: string): string {
    const symbolMap: Record<string, string> = {
      'gold': 'gold',
      'nasdaq': 'nasdaq'
    };
    
    return symbolMap[symbol] || symbol;
  }
}

/**
 * Investing.com适配器
 */
export class InvestingAdapter implements DataSourceAdapter {
  private readonly source: DataSource;

  constructor() {
    // Investing.com 在 Cloudflare Pages 上不可用，跳过
    this.source = {
      name: 'Investing.com',
      type: 'backup',
      endpoint: '/yahoo-finance-proxy',
      rateLimit: 60,
      isHistoricalSupported: true
    };
  }

  async fetchHistoricalPrices(_symbol: string, _range: string): Promise<RawPriceData> {
    // 直接抛出错误，让系统使用 Yahoo Finance 备选
    throw new Error('Investing.com not available on Cloudflare Pages');
  }

  transformToStandardFormat(rawData: RawPriceData): HistoricalPriceData[] {
    if (!rawData.priceData || !Array.isArray(rawData.priceData)) {
      logError('Investing.com响应格式错误', rawData);
      return [];
    }

    return rawData.priceData.map((item: any) => ({
      date: new Date(item.date),
      open: parseFloat(item.open) || 0,
      high: parseFloat(item.high) || 0,
      low: parseFloat(item.low) || 0,
      close: parseFloat(item.close) || 0,
      volume: parseInt(item.volume) || 0,
      change: parseFloat(item.change) || 0,
      changePercent: parseFloat(item.changePercent) || 0,
      source: this.source,
      isReal: true as const,
      lastUpdated: new Date().toISOString()
    })).filter((item: any) => item.close > 0);
  }

  async isAvailable(): Promise<boolean> {
    // Investing.com 在 Cloudflare Pages 上不可用
    return false;
  }

}

/**
 * 历史数据服务接口
 */
export interface HistoricalPriceService {
  fetchRealHistoricalData(symbol: string, days: number): Promise<HistoricalPriceData[]>;
  validateHistoricalData(data: HistoricalPriceData[]): ValidationResult;
  switchDataSource(source: DataSource): void;
}

/**
 * 历史数据服务实现
 */
export class HistoricalDataService implements HistoricalPriceService {
  private adapters: Map<string, DataSourceAdapter>;
  private currentAdapter: DataSourceAdapter;
  private cache: Map<string, { data: HistoricalPriceData[]; timestamp: number }>;
  private readonly CACHE_DURATION = 1 * 60 * 1000; // 1分钟缓存（更频繁更新）

  constructor(alphaVantageApiKey?: string) {
    this.adapters = new Map();
    this.cache = new Map();

    // 初始化适配器（按优先级顺序）
    this.adapters.set('yahoo', new YahooFinanceAdapter());
    if (alphaVantageApiKey) {
      this.adapters.set('alphavantage', new AlphaVantageAdapter(alphaVantageApiKey));
    }
    this.adapters.set('investing', new InvestingAdapter());

    // 设置默认适配器为 Yahoo Finance（最可靠）
    this.currentAdapter = this.adapters.get('yahoo')!;
    
    logInfo('历史数据服务初始化完成', { 
      adapters: Array.from(this.adapters.keys()),
      currentAdapter: this.currentAdapter.constructor.name
    });
  }

  async fetchRealHistoricalData(symbol: string, days: number): Promise<HistoricalPriceData[]> {
    const cacheKey = `${symbol}_${days}_${this.currentAdapter.constructor.name}`;
    
    // 检查缓存
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      logInfo('返回缓存的历史数据', { symbol, days, source: this.currentAdapter.constructor.name });
      return cached;
    }

    try {
      logInfo('开始获取真实历史数据', { symbol, days, source: this.currentAdapter.constructor.name });
      
      // 转换天数为范围字符串
      const range = this.daysToRange(days);
      
      // 获取原始数据
      const rawData = await this.currentAdapter.fetchHistoricalPrices(symbol, range);
      
      // 转换为标准格式
      const historicalData = this.currentAdapter.transformToStandardFormat(rawData);
      
      // 验证数据
      const validation = this.validateHistoricalData(historicalData);
      if (!validation.isValid) {
        logError('历史数据验证失败', { errors: validation.errors });
        throw new Error(`数据验证失败: ${validation.errors.join(', ')}`);
      }

      // 缓存结果
      this.setCache(cacheKey, historicalData);
      
      logInfo('成功获取真实历史数据', { 
        symbol, 
        days, 
        dataPoints: historicalData.length,
        source: this.currentAdapter.constructor.name
      });
      
      return historicalData;
      
    } catch (error) {
      logError('获取历史数据失败，尝试故障转移', error);
      
      // 尝试故障转移到其他数据源
      const fallbackData = await this.tryFallbackSources(symbol, days);
      if (fallbackData.length > 0) {
        this.setCache(cacheKey, fallbackData);
        return fallbackData;
      }
      
      throw error;
    }
  }

  validateHistoricalData(data: HistoricalPriceData[]): ValidationResult {
    const errors: string[] = [];

    if (!Array.isArray(data)) {
      errors.push('数据必须是数组格式');
      return { isValid: false, errors };
    }

    if (data.length === 0) {
      errors.push('数据不能为空');
      return { isValid: false, errors };
    }

    // 验证每个数据点
    data.forEach((item, index) => {
      if (!item.date || !(item.date instanceof Date)) {
        errors.push(`数据点${index}: 日期格式无效`);
      }

      if (typeof item.open !== 'number' || item.open <= 0) {
        errors.push(`数据点${index}: 开盘价无效`);
      }

      if (typeof item.high !== 'number' || item.high <= 0) {
        errors.push(`数据点${index}: 最高价无效`);
      }

      if (typeof item.low !== 'number' || item.low <= 0) {
        errors.push(`数据点${index}: 最低价无效`);
      }

      if (typeof item.close !== 'number' || item.close <= 0) {
        errors.push(`数据点${index}: 收盘价无效`);
      }

      // 验证OHLC逻辑关系
      if (item.high < Math.max(item.open, item.close)) {
        errors.push(`数据点${index}: 最高价不能低于开盘价或收盘价`);
      }

      if (item.low > Math.min(item.open, item.close)) {
        errors.push(`数据点${index}: 最低价不能高于开盘价或收盘价`);
      }

      if (!item.isReal) {
        errors.push(`数据点${index}: 必须标记为真实数据`);
      }
    });

    // 验证日期连续性（交易日）- 对于历史数据，允许更大的日期间隔
    const sortedData = [...data].sort((a, b) => a.date.getTime() - b.date.getTime());
    for (let i = 1; i < sortedData.length; i++) {
      const prevDate = sortedData[i - 1].date;
      const currDate = sortedData[i].date;
      const daysDiff = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // 对于历史数据，允许更大的间隔（最多1年），因为可能跨越较长时间段
      if (daysDiff > 365) {
        errors.push(`日期间隔过大: ${prevDate.toISOString().split('T')[0]} 到 ${currDate.toISOString().split('T')[0]}`);
      }
      
      // 确保日期不是倒序的
      if (daysDiff < 0) {
        errors.push(`日期顺序错误: ${prevDate.toISOString().split('T')[0]} 晚于 ${currDate.toISOString().split('T')[0]}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  switchDataSource(source: DataSource): void {
    const adapter = Array.from(this.adapters.values()).find(a => 
      (a as any).source?.name === source.name
    );
    
    if (adapter) {
      this.currentAdapter = adapter;
      logInfo('切换数据源', { newSource: source.name });
    } else {
      logError('未找到指定的数据源适配器', { sourceName: source.name });
    }
  }

  private async tryFallbackSources(symbol: string, days: number): Promise<HistoricalPriceData[]> {
    const range = this.daysToRange(days);
    
    for (const [name, adapter] of this.adapters.entries()) {
      if (adapter === this.currentAdapter) continue; // 跳过当前失败的适配器
      
      try {
        logInfo('尝试故障转移数据源', { source: name });
        
        const isAvailable = await adapter.isAvailable();
        if (!isAvailable) {
          logInfo('数据源不可用，跳过', { source: name });
          continue;
        }
        
        const rawData = await adapter.fetchHistoricalPrices(symbol, range);
        const historicalData = adapter.transformToStandardFormat(rawData);
        
        const validation = this.validateHistoricalData(historicalData);
        if (validation.isValid) {
          logInfo('故障转移成功', { source: name, dataPoints: historicalData.length });
          this.currentAdapter = adapter; // 切换到成功的数据源
          return historicalData;
        }
        
      } catch (error) {
        logError('故障转移数据源失败', { source: name, error });
      }
    }
    
    return [];
  }

  private daysToRange(days: number): string {
    // 将天数转换为各API支持的范围格式
    if (days <= 1) return '1d';
    if (days <= 5) return '5d';
    if (days <= 30) return '1mo';
    if (days <= 90) return '3mo';
    return '1y';
  }

  private getFromCache(key: string): HistoricalPriceData[] | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > this.CACHE_DURATION) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  private setCache(key: string, data: HistoricalPriceData[]): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * 获取当前使用的数据源信息
   */
  getCurrentDataSource(): DataSource {
    return (this.currentAdapter as any).source;
  }

  /**
   * 获取所有可用的数据源
   */
  getAvailableDataSources(): DataSource[] {
    return Array.from(this.adapters.values()).map(adapter => (adapter as any).source);
  }

  /**
   * 清理过期缓存
   */
  clearExpiredCache(): void {
    const now = Date.now();
    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.timestamp > this.CACHE_DURATION) {
        this.cache.delete(key);
      }
    }
  }
}

// 导出默认实例
export const historicalDataService = new HistoricalDataService();
