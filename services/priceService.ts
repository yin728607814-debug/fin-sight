/**
 * 价格数据服务模块
 * 负责获取金融产品的价格历史数据和当前价格信息
 */

import axios, { AxiosResponse } from 'axios';
import { 
  PriceData, 
  AssetInfo, 
  PriceService as IPriceService,
  ErrorType
} from '../types';
import { 
  createAPIError, 
  ErrorHandler, 
  isRetryableError,
  calculateRetryDelay,
  DEFAULT_RETRY_CONFIG 
} from '../utils/errors';
import { validatePriceData, validateAssetInfo, sanitizePriceData, sanitizeAssetInfo } from '../utils/validation';
import { isDataExpired } from '../utils/helpers';
import { logInfo, logError } from './logger';
import { config } from '../config/env';

/**
 * 价格API配置
 */
interface PriceAPIConfig {
  baseURL: string;
  apiKey: string;
  timeout: number;
  maxRetries: number;
}

/**
 * 缓存项接口
 */
interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

/**
 * 价格服务实现类
 */
export class PriceService implements IPriceService {
  private config: PriceAPIConfig;
  private errorHandler: ErrorHandler;
  private priceCache: Map<string, CacheItem<PriceData[]>>;
  private assetCache: Map<string, CacheItem<AssetInfo>>;
  private readonly PRICE_CACHE_DURATION = 1 * 60 * 1000; // 1分钟缓存（更频繁更新）
  private readonly ASSET_CACHE_DURATION = 1 * 60 * 1000; // 1分钟缓存

  constructor(apiConfig?: Partial<PriceAPIConfig>) {
    this.config = {
      baseURL: 'https://www.alphavantage.co/query',
      apiKey: config.apiKeys.alphaVantage,
      timeout: 15000,
      maxRetries: 3,
      ...apiConfig
    };
    
    this.errorHandler = ErrorHandler.getInstance();
    this.priceCache = new Map();
    this.assetCache = new Map();
    
    logInfo('PriceService initialized', { baseURL: this.config.baseURL });
  }

  /**
   * 获取5天价格历史数据（符合需求4.2）
   */
  async fetchFiveDayPriceHistory(symbol: string): Promise<PriceData[]> {
    return this.fetchPriceHistory(symbol, 5);
  }

  /**
   * 获取价格历史数据
   */
  async fetchPriceHistory(symbol: string, days: number): Promise<PriceData[]> {
    // 使用新的缓存键，避免与旧数据冲突 - 强制刷新黄金价格缓存
    const cacheKey = symbol === 'gold' 
      ? `price_gold_investing_v2_${days}` 
      : symbol === 'nasdaq' 
        ? `price_nasdaq_yahoo_${days}` 
        : `price_${symbol}_v2_${days}`;
    
    // 检查缓存
    const cached = this.getFromPriceCache(cacheKey);
    if (cached) {
      logInfo('返回缓存的价格数据', { symbol, days, count: cached.length });
      return cached;
    }

    // 如果API密钥明确是占位符，提示用户配置真实密钥
    if (this.shouldUseDemoData()) {
      logInfo('⚠️ 检测到占位符API密钥，请配置真实的Alpha Vantage API密钥以获取真实价格数据');
      console.warn('请访问 https://www.alphavantage.co/ 获取真实的Alpha Vantage API密钥');
    }

    try {
      logInfo('🔍 开始获取价格历史数据', { symbol, days, cacheKey });
      
      // 对于黄金，强制清除旧缓存并使用新API
      if (symbol === 'gold') {
        // 清除所有可能的旧缓存键
        const oldCacheKeys = [
          `price_gold_${days}`,
          `price_${symbol}_${days}`,
          `price_${symbol}_investing_${days}`,
          `price_gold_yahoo_${days}`
        ];
        oldCacheKeys.forEach(key => this.priceCache.delete(key));
        logInfo('🗑️ 已清除黄金价格旧缓存', { clearedKeys: oldCacheKeys });
      }
      
      let priceData: PriceData[];
      
      // 对于纳斯达克指数，使用Yahoo Finance；对于黄金，使用Investing.com
      if (symbol === 'nasdaq' || symbol === 'NDX') {
        const response = await this.makeRequest({
          symbol: 'nasdaq'
        });
        priceData = this.transformInvestingResponse(response.data as any, days);
      } else if (symbol === 'gold') {
        // 对于黄金，强制使用Investing.com API获取实时价格
        console.log('🌐 强制使用Investing.com API获取黄金价格数据');
        logInfo('🔍 黄金价格API调用开始', { symbol, endpoint: 'investing-proxy' });
        
        const response = await this.makeRequest({
          symbol: 'gold'
        });
        
        logInfo('📊 黄金价格API响应', { 
          hasData: !!response.data, 
          hasPriceData: !!(response.data as any)?.priceData,
          dataLength: (response.data as any)?.priceData?.length || 0
        });
        
        priceData = this.transformInvestingResponse(response.data as any, days);
        
        // 验证价格数据是否正确
        if (priceData.length > 0) {
          const latestPrice = priceData[priceData.length - 1].close;
          logInfo('💰 黄金价格验证', { 
            latestPrice, 
            isCorrectRange: latestPrice >= 4000 && latestPrice <= 5000,
            dataPoints: priceData.length 
          });
          
          if (latestPrice < 3500) {
            logError('⚠️ 黄金价格异常偏低', { latestPrice, expected: '4000+' });
          }
        }
      } else {
        // 其他资产使用Alpha Vantage
        const response = await this.makeRequest({
          function: 'TIME_SERIES_DAILY',
          symbol: this.normalizeSymbol(symbol),
          outputsize: 'compact' // 获取最近100天数据
        });
        priceData = this.transformPriceResponse(response.data as any, days);
      }
      
      const validatedData = this.validateAndFilterPriceData(priceData);
      
      // 缓存结果
      this.setPriceCache(cacheKey, validatedData);
      
      logInfo('成功获取价格历史数据', { 
        symbol, 
        days, 
        total: priceData.length, 
        validated: validatedData.length 
      });
      
      return validatedData;
      
    } catch (error) {
      // 如果API调用失败，使用真实的历史数据作为备用
      logError('⚠️ 价格API调用失败，使用备用数据', error);
      console.warn('价格API暂时不可用，使用最近的真实历史数据');
      
      const { generateDemoPriceData } = await import('./demoDataService');
      const assetType = this.symbolToAssetType(symbol);
      const fallbackData = generateDemoPriceData(assetType, days);
      this.setPriceCache(cacheKey, fallbackData);
      return fallbackData;
    }
  }

  /**
   * 获取当前价格信息
   */
  async getCurrentPrice(symbol: string): Promise<AssetInfo> {
    const cacheKey = `asset_${symbol}`;
    
    // 检查缓存
    const cached = this.getFromAssetCache(cacheKey);
    if (cached) {
      logInfo('返回缓存的资产信息', { symbol });
      return cached;
    }

    // 如果API密钥明确是占位符，提示用户配置真实密钥
    if (this.shouldUseDemoData()) {
      logInfo('⚠️ 检测到占位符API密钥，请配置真实的Alpha Vantage API密钥以获取真实资产信息');
      console.warn('请访问 https://www.alphavantage.co/ 获取真实的Alpha Vantage API密钥');
    }

    try {
      logInfo('开始获取当前价格信息', { symbol });
      
      const response = await this.makeRequest({
        function: 'GLOBAL_QUOTE',
        symbol: this.normalizeSymbol(symbol)
      });

      const assetInfo = this.transformAssetResponse(response.data as any, symbol);
      const validatedInfo = this.validateAssetInfo(assetInfo);
      
      // 缓存结果
      this.setAssetCache(cacheKey, validatedInfo);
      
      logInfo('成功获取当前价格信息', { symbol, price: validatedInfo.currentPrice });
      
      return validatedInfo;
      
    } catch (error) {
      // 如果API调用失败，提供详细错误信息并回退到演示数据
      logError('⚠️ 资产信息API调用失败，请检查API密钥配置', error);
      console.error('Alpha Vantage API错误 - 请检查以下配置：');
      console.error('1. API密钥是否正确: ', this.config.apiKey?.substring(0, 8) + '...');
      console.error('2. 是否超出API限制 (免费版每分钟5次请求)');
      console.error('3. 网络连接是否正常');
      console.error('获取真实API密钥: https://www.alphavantage.co/');
      
      const { generateDemoAssetInfo } = await import('./demoDataService');
      const assetType = this.symbolToAssetType(symbol);
      const demoInfo = generateDemoAssetInfo(assetType);
      this.setAssetCache(cacheKey, demoInfo);
      return demoInfo;
    }
  }

  /**
   * 标准化符号名称
   */
  private normalizeSymbol(symbol: string): string {
    // 处理特殊符号映射
    const symbolMap: Record<string, string> = {
      'XAUUSD': 'gold', // 现货黄金使用Investing.com
      'NDX': 'nasdaq', // 纳斯达克100指数 - 使用Yahoo Finance
      'nasdaq': 'nasdaq', // 纳斯达克100指数 - 使用Yahoo Finance
      'gold': 'gold' // 黄金使用Investing.com
    };
    
    return symbolMap[symbol] || symbol.toUpperCase();
  }

  /**
   * 发起API请求（带重试机制）
   */
  private async makeRequest(params: Record<string, string>): Promise<AxiosResponse<unknown>> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        // 检测是否在浏览器环境中
        const isBrowser = typeof window !== 'undefined';
        let response: AxiosResponse<unknown>;

        if (isBrowser) {
          // 对于纳斯达克指数，使用Yahoo Finance API
          if (params.symbol === 'nasdaq' || params.symbol === 'NDX') {
            console.log('🌐 使用Yahoo Finance API获取纳斯达克100指数数据');
            response = await axios.get('/.netlify/functions/yahoo-finance-proxy', {
              params: { 
                symbol: 'nasdaq',
                range: '5d',
                interval: '1d'
              },
              timeout: this.config.timeout
            });
          } else if (params.symbol === 'gold') {
            // 对于黄金，使用Investing.com API
            console.log('🌐 使用Investing.com API获取黄金价格数据');
            response = await axios.get('/.netlify/functions/investing-proxy', {
              params: { 
                symbol: 'gold',
                range: '5d'
              },
              timeout: this.config.timeout
            });
          } else {
            // 其他资产使用Alpha Vantage API
            console.log('🌐 使用Netlify函数代理调用Alpha Vantage API');
            response = await axios.get('/.netlify/functions/price-proxy', {
              params: params, // 不包含apiKey，由代理处理
              timeout: this.config.timeout
            });
          }
        } else {
          // 服务器环境：直接调用API
          response = await axios.get(this.config.baseURL, {
            params: {
              ...params,
              apikey: this.config.apiKey
            },
            timeout: this.config.timeout,
            headers: {
              'User-Agent': 'Investment-News-Analyzer/1.0'
            }
          });
        }

        // 检查API错误响应
        if ((response.data as any)['Error Message']) {
          throw createAPIError(
            ErrorType.INVALID_RESPONSE,
            (response.data as any)['Error Message'],
            'API_ERROR'
          );
        }

        if ((response.data as any)['Note']) {
          throw createAPIError(
            ErrorType.API_LIMIT_EXCEEDED,
            'API调用频率限制，请稍后重试',
            'RATE_LIMIT'
          );
        }

        return response;
        
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === this.config.maxRetries) {
          break;
        }
        
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 429) {
            // API限制，等待更长时间
            const delay = calculateRetryDelay(attempt, {
              ...DEFAULT_RETRY_CONFIG,
              baseDelay: 5000 // Alpha Vantage需要更长等待时间
            });
            logInfo(`API限制，等待${delay}ms后重试`, { attempt });
            await this.sleep(delay);
            continue;
          }
          
          if (!isRetryableError(error)) {
            throw this.errorHandler.handleNetworkError(error);
          }
        }
        
        const delay = calculateRetryDelay(attempt);
        logInfo(`请求失败，${delay}ms后重试`, { attempt, error: (error as Error).message });
        await this.sleep(delay);
      }
    }
    
    throw this.errorHandler.handleNetworkError(lastError);
  }

  /**
   * 转换Investing API响应
   */
  private transformInvestingResponse(apiResponse: any, days: number): PriceData[] {
    if (!apiResponse || !apiResponse.priceData || !Array.isArray(apiResponse.priceData)) {
      logError('Investing API响应格式错误', apiResponse);
      return [];
    }

    // 先转换所有数据
    const allPriceData = apiResponse.priceData
      .map((item: any) => ({
        date: new Date(item.date),
        open: parseFloat(item.open) || 0,
        high: parseFloat(item.high) || 0,
        low: parseFloat(item.low) || 0,
        close: parseFloat(item.close) || 0,
        volume: parseInt(item.volume) || 0,
        change: parseFloat(item.change) || 0,
        changePercent: parseFloat(item.changePercent) || 0
      }))
      .filter((item: any) => item.close > 0); // 过滤无效数据

    // 过滤掉周末数据（周六=6，周日=0）
    const weekdayData = allPriceData.filter((item: any) => {
      const dayOfWeek = item.date.getDay();
      return dayOfWeek !== 0 && dayOfWeek !== 6;
    });

    // 返回最近的N个工作日数据
    return weekdayData.slice(-days);
  }

  /**
   * 转换价格API响应
   */
  private transformPriceResponse(apiResponse: any, days: number): PriceData[] {
    if (!apiResponse['Time Series (Daily)']) {
      logError('价格API响应格式错误', apiResponse);
      return [];
    }

    const timeSeries = apiResponse['Time Series (Daily)'];
    const dates = Object.keys(timeSeries).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    const targetDates = dates.slice(0, days);

    return targetDates.map(dateStr => {
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
        changePercent: ((close - open) / open) * 100
      };
    }).reverse(); // 按时间正序排列
  }

  /**
   * 转换资产信息API响应
   */
  private transformAssetResponse(apiResponse: any, originalSymbol: string): AssetInfo {
    if (!apiResponse['Global Quote']) {
      throw createAPIError(
        ErrorType.INVALID_RESPONSE,
        '资产信息API响应格式错误',
        'INVALID_FORMAT'
      );
    }

    const quote = apiResponse['Global Quote'];
    const currentPrice = parseFloat(quote['05. price']);
    const lastUpdated = new Date(quote['07. latest trading day']);

    return {
      symbol: originalSymbol,
      name: this.getAssetName(originalSymbol),
      currentPrice,
      currency: this.getAssetCurrency(originalSymbol),
      lastUpdated
    };
  }

  /**
   * 获取资产名称
   */
  private getAssetName(symbol: string): string {
    const nameMap: Record<string, string> = {
      'XAUUSD': '现货黄金',
      'NDX': '纳斯达克100指数',
      'GLD': '黄金ETF',
      'QQQ': '纳斯达克100 ETF',
      'gold': '现货黄金',
      'nasdaq': '纳斯达克100指数'
    };
    
    return nameMap[symbol] || symbol;
  }

  /**
   * 获取资产货币单位
   */
  private getAssetCurrency(symbol: string): string {
    const currencyMap: Record<string, string> = {
      'XAUUSD': 'USD',
      'NDX': 'USD',
      'GLD': 'USD',
      'QQQ': 'USD',
      'gold': 'USD',
      'nasdaq': 'USD'
    };
    
    return currencyMap[symbol] || 'USD';
  }

  /**
   * 验证和过滤价格数据
   */
  private validateAndFilterPriceData(priceData: PriceData[]): PriceData[] {
    return priceData
      .map(item => sanitizePriceData(item))
      .filter((item): item is PriceData => {
        if (!item) return false;
        
        const validation = validatePriceData(item);
        if (!validation.isValid) {
          logError('价格数据验证失败', { item, errors: validation.errors });
          return false;
        }
        
        return true;
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime()); // 按时间排序
  }

  /**
   * 验证资产信息
   */
  private validateAssetInfo(assetInfo: AssetInfo): AssetInfo {
    const sanitized = sanitizeAssetInfo(assetInfo);
    if (!sanitized) {
      throw createAPIError(
        ErrorType.VALIDATION_ERROR,
        '资产信息数据无效',
        'VALIDATION_FAILED'
      );
    }

    const validation = validateAssetInfo(sanitized);
    if (!validation.isValid) {
      logError('资产信息验证失败', { assetInfo, errors: validation.errors });
      throw createAPIError(
        ErrorType.VALIDATION_ERROR,
        `资产信息验证失败: ${validation.errors.join(', ')}`,
        'VALIDATION_FAILED'
      );
    }

    return sanitized;
  }

  /**
   * 价格缓存管理
   */
  private getFromPriceCache(key: string): PriceData[] | null {
    const cached = this.priceCache.get(key);
    if (!cached) return null;
    
    if (Date.now() > cached.expiresAt) {
      this.priceCache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  private setPriceCache(key: string, data: PriceData[]): void {
    const now = Date.now();
    this.priceCache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + this.PRICE_CACHE_DURATION
    });
  }

  /**
   * 资产缓存管理
   */
  private getFromAssetCache(key: string): AssetInfo | null {
    const cached = this.assetCache.get(key);
    if (!cached) return null;
    
    if (Date.now() > cached.expiresAt) {
      this.assetCache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  private setAssetCache(key: string, data: AssetInfo): void {
    const now = Date.now();
    this.assetCache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + this.ASSET_CACHE_DURATION
    });
  }

  /**
   * 清理过期缓存
   */
  public clearExpiredCache(): void {
    const now = Date.now();
    
    for (const [key, item] of this.priceCache.entries()) {
      if (now > item.expiresAt) {
        this.priceCache.delete(key);
      }
    }
    
    for (const [key, item] of this.assetCache.entries()) {
      if (now > item.expiresAt) {
        this.assetCache.delete(key);
      }
    }
  }

  /**
   * 检查价格数据是否过期
   */
  public isPriceDataExpired(symbol: string, days: number): boolean {
    const cacheKey = `price_${symbol}_${days}`;
    const cached = this.priceCache.get(cacheKey);
    if (!cached) return true;
    
    // 使用我们的时间工具函数检查过期
    return isDataExpired(new Date(cached.timestamp), this.PRICE_CACHE_DURATION / (1000 * 60));
  }

  /**
   * 检查资产信息是否过期
   */
  public isAssetInfoExpired(symbol: string): boolean {
    const cacheKey = `asset_${symbol}`;
    const cached = this.assetCache.get(cacheKey);
    if (!cached) return true;
    
    // 使用我们的时间工具函数检查过期
    return isDataExpired(new Date(cached.timestamp), this.ASSET_CACHE_DURATION / (1000 * 60));
  }

  /**
   * 获取缓存统计信息
   */
  public getCacheStats(): { priceCache: number; assetCache: number } {
    return {
      priceCache: this.priceCache.size,
      assetCache: this.assetCache.size
    };
  }

  /**
   * 检查是否应该使用演示数据
   */
  private shouldUseDemoData(): boolean {
    // 在生产环境中，API密钥由Netlify函数处理，不需要检查
    const isProduction = typeof window !== 'undefined' && 
                        window.location.hostname !== 'localhost' && 
                        window.location.hostname !== '127.0.0.1';
    
    if (isProduction) {
      return false; // 生产环境总是尝试真实API
    }
    
    return !this.config.apiKey || 
           this.config.apiKey === 'demo' ||
           this.config.apiKey === '' || 
           this.config.apiKey.includes('demo') || 
           this.config.apiKey.includes('placeholder') || 
           this.config.apiKey.includes('your_');
  }

  /**
   * 将符号转换为资产类型
   */
  private symbolToAssetType(symbol: string): 'gold' | 'nasdaq' {
    const lowerSymbol = symbol.toLowerCase();
    if (lowerSymbol.includes('gold') || lowerSymbol.includes('xau') || lowerSymbol.includes('gld')) {
      return 'gold';
    }
    return 'nasdaq';
  }

  /**
   * 工具方法：延迟执行
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * 默认价格服务实例
 */
export const priceService = new PriceService();