/**
 * A股基金数据服务
 * 从 Cloudflare Pages Function 代理获取A股基金的实时数据
 */

import { getFundCode } from '../config/aStockFunds';

/**
 * 基金实时数据接口
 */
export interface FundRealtimeData {
  fundCode: string;        // 基金代码
  fundName: string;        // 基金名称
  netValue: number;        // 当日净值（上一交易日）
  estimatedValue: number;  // 估算净值（当前交易日）
  dailyReturn: number;     // 当日收益率(%)
  updateTime: string;      // 更新时间
}

/**
 * A股基金数据服务类
 */
class AStockFundService {
  private static instance: AStockFundService;
  private readonly PROXY_URL = '/fund-proxy'; // Cloudflare Pages Function代理
  private cache: Map<string, { data: FundRealtimeData; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 60 * 1000; // 缓存1分钟

  private constructor() {}

  public static getInstance(): AStockFundService {
    if (!AStockFundService.instance) {
      AStockFundService.instance = new AStockFundService();
    }
    return AStockFundService.instance;
  }

  /**
   * 获取单个基金的实时数据
   */
  public async getFundData(fundName: string): Promise<FundRealtimeData | null> {
    try {
      // 获取基金代码
      const fundCode = getFundCode(fundName);
      if (!fundCode) {
        console.error(`未找到基金代码: ${fundName}`);
        return null;
      }

      // 检查缓存
      const cached = this.cache.get(fundCode);
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        return cached.data;
      }

      // 通过 Cloudflare Pages Function 代理获取数据
      const url = `${this.PROXY_URL}?code=${fundCode}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // 转换为标准格式
      const fundData: FundRealtimeData = {
        fundCode: data.fundCode,
        fundName: data.fundName,
        netValue: data.netValue,
        estimatedValue: data.estimatedValue,
        dailyReturn: data.dailyReturn,
        updateTime: data.updateTime
      };

      // 更新缓存
      this.cache.set(fundCode, { data: fundData, timestamp: Date.now() });

      return fundData;
    } catch (error) {
      console.error(`获取基金数据失败 (${fundName}):`, error);
      return null;
    }
  }

  /**
   * 批量获取多个基金的实时数据
   */
  public async getBatchFundData(fundNames: string[]): Promise<Map<string, FundRealtimeData>> {
    const results = new Map<string, FundRealtimeData>();

    // 并发获取所有基金数据
    const promises = fundNames.map(async (fundName) => {
      const data = await this.getFundData(fundName);
      if (data) {
        results.set(fundName, data);
      }
    });

    await Promise.all(promises);

    return results;
  }

  /**
   * 计算持仓的当日收益
   */
  public calculateDailyProfit(investmentAmount: number, dailyReturn: number): number {
    return investmentAmount * (dailyReturn / 100);
  }

  /**
   * 清除缓存
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * 清除特定基金的缓存
   */
  public clearFundCache(fundName: string): void {
    const fundCode = getFundCode(fundName);
    if (fundCode) {
      this.cache.delete(fundCode);
    }
  }
}

export const aStockFundService = AStockFundService.getInstance();
