/**
 * 纳斯达克基金数据服务
 * 从Netlify Function代理获取QDII基金的实时数据
 */

/**
 * 基金实时数据接口
 */
export interface NasdaqFundRealtimeData {
  fundCode: string;        // 基金代码
  fundName: string;        // 基金名称
  netValue: number;        // 当日净值（上一交易日）
  estimatedValue: number;  // 估算净值（当前交易日）
  dailyReturn: number;     // 当日收益率(%)
  updateTime: string;      // 更新时间
}

/**
 * 纳斯达克基金数据服务类
 */
class NasdaqFundService {
  private static instance: NasdaqFundService;
  private readonly PROXY_URL = '/.netlify/functions/fund-proxy'; // Netlify Function代理
  private cache: Map<string, { data: NasdaqFundRealtimeData; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 缓存5分钟（QDII基金更新较慢）

  private constructor() {}

  public static getInstance(): NasdaqFundService {
    if (!NasdaqFundService.instance) {
      NasdaqFundService.instance = new NasdaqFundService();
    }
    return NasdaqFundService.instance;
  }

  /**
   * 根据基金名称获取基金代码
   * 这个映射需要根据实际的基金名称来配置
   */
  private getFundCodeByName(fundName: string): string | null {
    // 基金名称到代码的映射（用户持有的18支纳斯达克基金）
    const fundCodeMap: Record<string, string> = {
      // 摩根系列
      '摩根纳斯达克100指数(QDII)人民币A': '019172',
      
      // 建信系列
      '建信纳斯达克100指数QDII A': '539001',
      
      // 南方系列
      '南方纳斯达克100指数发起(QDII) A': '016452',
      '南方纳斯达克100指数发起(QDII) C': '016453',
      '南方纳斯达克100指数发起(QDII) I': '021000',
      
      // 易方达系列
      '易方达全球成长精选混合人民币A类': '012920',
      '易方达全球成长精选混合人民币C类': '012922',
      
      // 华安系列
      '华安纳斯达克100ETF联接(QDII) A': '040046',
      '华安纳斯达克100ETF联接(QDII) C': '014978',
      
      // 嘉实系列
      '嘉实纳斯达克100联接(QDII)C人民币': '016533',
      
      // 广发系列
      '广发纳斯达克100ETF联接(QDII) A': '270042',
      
      // 大成系列
      '大成纳斯达克100ETF联接(QDII)A': '000834',
      
      // 华宝系列
      '华宝纳斯达克精选股票发起式(QDII) A': '017436',
      
      // 景顺长城系列
      '景顺长城纳斯达克科技ETF联接A': '017091',
      '景顺长城纳斯达克科技ETF联接E': '019118',
      '景顺长城纳斯达克科技ETF联接C': '017093',
      
      // 博时系列
      '博时标普500ETF联接(QDII)A': '050025',
      '博时纳斯达克100A人名币': '016055',
    };

    return fundCodeMap[fundName] || null;
  }

  /**
   * 获取单个基金的实时数据
   */
  public async getFundData(fundName: string): Promise<NasdaqFundRealtimeData | null> {
    try {
      // 获取基金代码
      const fundCode = this.getFundCodeByName(fundName);
      if (!fundCode) {
        console.warn(`未找到基金代码: ${fundName}`);
        return null;
      }

      // 检查缓存
      const cached = this.cache.get(fundCode);
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        console.log(`使用缓存数据: ${fundName}`);
        return cached.data;
      }

      // 通过Netlify Function代理获取数据
      const url = `${this.PROXY_URL}?code=${fundCode}`;
      console.log(`请求代理: ${url}`);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`获取到数据:`, data);

      // 转换为标准格式
      const fundData: NasdaqFundRealtimeData = {
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
  public async getBatchFundData(fundNames: string[]): Promise<Map<string, NasdaqFundRealtimeData>> {
    const results = new Map<string, NasdaqFundRealtimeData>();

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
    const fundCode = this.getFundCodeByName(fundName);
    if (fundCode) {
      this.cache.delete(fundCode);
    }
  }
}

export const nasdaqFundService = NasdaqFundService.getInstance();
