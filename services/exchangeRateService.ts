/**
 * 汇率服务
 * 实时获取美元兑人民币汇率
 */

import axios from 'axios';
import { logInfo, logError } from './logger';

/**
 * 汇率数据接口
 */
interface ExchangeRateData {
  rate: number;
  timestamp: number;
  source: string;
}

/**
 * 汇率服务类
 */
export class ExchangeRateService {
  private static instance: ExchangeRateService;
  private cachedRate: ExchangeRateData | null = null;
  private readonly CACHE_DURATION = 3600000; // 1小时缓存
  private readonly DEFAULT_RATE = 7.0; // 默认汇率

  /**
   * 获取单例实例
   */
  public static getInstance(): ExchangeRateService {
    if (!ExchangeRateService.instance) {
      ExchangeRateService.instance = new ExchangeRateService();
    }
    return ExchangeRateService.instance;
  }

  /**
   * 私有构造函数
   */
  private constructor() {}

  /**
   * 获取美元兑人民币汇率
   */
  public async getUsdToCnyRate(): Promise<number> {
    // 检查缓存
    if (this.cachedRate && Date.now() - this.cachedRate.timestamp < this.CACHE_DURATION) {
      logInfo('使用缓存的汇率', { rate: this.cachedRate.rate, source: this.cachedRate.source });
      return this.cachedRate.rate;
    }

    try {
      // 尝试多个数据源
      const rate = await this.fetchFromMultipleSources();
      
      // 缓存结果
      this.cachedRate = {
        rate,
        timestamp: Date.now(),
        source: 'api'
      };

      logInfo('成功获取实时汇率', { rate });
      return rate;
    } catch (error) {
      logError('获取汇率失败，使用默认值', error);
      return this.DEFAULT_RATE;
    }
  }

  /**
   * 从多个数据源获取汇率
   */
  private async fetchFromMultipleSources(): Promise<number> {
    // 数据源1: ExchangeRate-API (免费，无需API key)
    try {
      const rate = await this.fetchFromExchangeRateAPI();
      if (rate > 0) return rate;
    } catch (error) {
      logError('ExchangeRate-API 获取失败', error);
    }

    // 数据源2: Frankfurter (免费，欧洲央行数据)
    try {
      const rate = await this.fetchFromFrankfurter();
      if (rate > 0) return rate;
    } catch (error) {
      logError('Frankfurter 获取失败', error);
    }

    // 数据源3: Fixer (备用)
    try {
      const rate = await this.fetchFromFixer();
      if (rate > 0) return rate;
    } catch (error) {
      logError('Fixer 获取失败', error);
    }

    // 所有数据源都失败，使用默认值
    throw new Error('所有汇率数据源都失败');
  }

  /**
   * 从 ExchangeRate-API 获取汇率
   */
  private async fetchFromExchangeRateAPI(): Promise<number> {
    const response = await axios.get('https://api.exchangerate-api.com/v4/latest/USD', {
      timeout: 5000
    });

    if (response.data && response.data.rates && response.data.rates.CNY) {
      return response.data.rates.CNY;
    }

    throw new Error('ExchangeRate-API 返回数据格式错误');
  }

  /**
   * 从 Frankfurter 获取汇率
   */
  private async fetchFromFrankfurter(): Promise<number> {
    const response = await axios.get('https://api.frankfurter.app/latest?from=USD&to=CNY', {
      timeout: 5000
    });

    if (response.data && response.data.rates && response.data.rates.CNY) {
      return response.data.rates.CNY;
    }

    throw new Error('Frankfurter 返回数据格式错误');
  }

  /**
   * 从 Fixer 获取汇率（需要API key，这里作为备用）
   */
  private async fetchFromFixer(): Promise<number> {
    // Fixer 需要 API key，这里暂时跳过
    throw new Error('Fixer 需要 API key');
  }

  /**
   * 清除缓存
   */
  public clearCache(): void {
    this.cachedRate = null;
    logInfo('汇率缓存已清除');
  }

  /**
   * 获取缓存的汇率（如果有）
   */
  public getCachedRate(): number | null {
    if (this.cachedRate && Date.now() - this.cachedRate.timestamp < this.CACHE_DURATION) {
      return this.cachedRate.rate;
    }
    return null;
  }

  /**
   * 手动设置汇率（用于测试或手动覆盖）
   */
  public setManualRate(rate: number): void {
    if (rate <= 0) {
      logError('汇率必须大于0');
      return;
    }

    this.cachedRate = {
      rate,
      timestamp: Date.now(),
      source: 'manual'
    };

    logInfo('手动设置汇率', { rate });
  }
}

/**
 * 导出单例实例
 */
export const exchangeRateService = ExchangeRateService.getInstance();
