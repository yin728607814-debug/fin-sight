/**
 * 纳斯达克基金数据服务
 * 从天天基金网获取QDII基金的实时数据
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
 * 纳斯达克基金数据服务类
 */
class NasdaqFundService {
  private static instance: NasdaqFundService;
  private readonly API_BASE_URL = 'http://fundgz.1234567.com.cn/js';
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
    // 基金名称到代码的映射
    const fundCodeMap: Record<string, string> = {
      // 广发系列
      '广发纳斯达克100ETF联接(QDII)A人民币': '270042',
      '广发纳斯达克100ETF联接(QDII)C人民币': '006479',
      '广发纳斯达克100ETF': '159941',
      
      // 华安系列
      '华安纳斯达克100指数(QDII)': '040046',
      '华安纳斯达克100ETF联接(QDII) A': '040046',
      '华安纳斯达克100ETF联接(QDII) C': '040047',
      
      // 国泰系列
      '纳斯达克100ETF': '513300',
      '国泰纳斯达克100指数(QDII)': '160213',
      '国泰纳斯达克100ETF': '513100',
      
      // 大成系列
      '大成纳斯达克100指数(QDII)': '000834',
      
      // 博时系列
      '博时标普500ETF联接A': '050025',
      
      // 易方达系列
      '易方达纳斯达克100指数(QDII-LOF)A人民币': '161130',
      '易方达纳斯达克100指数(QDII-LOF)C': '012861',
      '易方达恒生科技ETF联接(QDII)A人民币': '110032',
      '易方达全球成长精选混合人民币A类': '010198',
      '易方达全球成长精选混合人民币C类': '010199',
      
      // 建信系列
      '建信纳斯达克100指数QDII A': '539003',
      
      // 摩根系列
      '摩根纳斯达克100指数(QDII)人民币A': '008975',
      
      // 南方系列
      '南方纳斯达克100指数发起(QDII) A': '012842',
      
      // 嘉实系列
      '嘉实纳斯达克100联接(QDII)C人民币': '017546',
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
      const data: NasdaqFundRealtimeData = {
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
