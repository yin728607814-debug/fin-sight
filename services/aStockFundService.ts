/**
 * A股基金数据服务
 * 从天天基金网获取A股基金的实时数据
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
 * API响应数据接口
 */
interface FundAPIResponse {
  fundcode: string;
  name: string;
  jzrq: string;      // 净值日期
  dwjz: string;      // 当日净值
  gsz: string;       // 估算净值
  gszzl: string;     // 估算涨跌幅
  gztime: string;    // 估值时间
}

/**
 * A股基金数据服务类
 */
class AStockFundService {
  private static instance: AStockFundService;
  private readonly API_BASE_URL = 'http://fundgz.1234567.com.cn/js';
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

      // 获取数据
      const url = `${this.API_BASE_URL}/${fundCode}.js`;
      const response = await fetch(url);
      const text = await response.text();

      // 解析JSONP响应
      const jsonMatch = text.match(/jsonpgz\((.*)\)/);
      if (!jsonMatch) {
        console.error(`无法解析基金数据: ${fundName}`);
        return null;
      }

      const apiData: FundAPIResponse = JSON.parse(jsonMatch[1]);

      // 转换为标准格式
      const data: FundRealtimeData = {
        fundCode: apiData.fundcode,
        fundName: apiData.name,
        netValue: parseFloat(apiData.dwjz),
        estimatedValue: parseFloat(apiData.gsz),
        dailyReturn: parseFloat(apiData.gszzl),
        updateTime: apiData.gztime
      };

      // 更新缓存
      this.cache.set(fundCode, { data, timestamp: Date.now() });

      return data;
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
