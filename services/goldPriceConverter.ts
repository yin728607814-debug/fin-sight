/**
 * 黄金价格转换服务
 * 负责美元/盎司和人民币/克之间的价格转换
 */

/**
 * 黄金价格转换常量
 */
export const GOLD_CONVERSION = {
  OZ_TO_GRAM: 31.1035,        // 1盎司 = 31.1035克
  USD_TO_CNY: 7.0,            // 美元兑人民币汇率（默认值，可配置）
};

/**
 * 黄金价格转换服务类
 */
export class GoldPriceConverter {
  private static instance: GoldPriceConverter;
  private exchangeRate: number;

  /**
   * 获取单例实例
   */
  public static getInstance(): GoldPriceConverter {
    if (!GoldPriceConverter.instance) {
      GoldPriceConverter.instance = new GoldPriceConverter();
    }
    return GoldPriceConverter.instance;
  }

  /**
   * 私有构造函数
   */
  private constructor() {
    this.exchangeRate = GOLD_CONVERSION.USD_TO_CNY;
  }

  /**
   * 设置汇率
   */
  public setExchangeRate(rate: number): void {
    if (rate <= 0) {
      console.warn('汇率必须大于0，使用默认汇率');
      return;
    }
    this.exchangeRate = rate;
  }

  /**
   * 获取当前汇率
   */
  public getCurrentExchangeRate(): number {
    return this.exchangeRate;
  }

  /**
   * 美元/盎司 转 人民币/克
   * @param usdPerOz 美元/盎司价格
   * @returns 人民币/克价格
   */
  public convertUsdPerOzToCnyPerGram(usdPerOz: number): number {
    if (usdPerOz <= 0) {
      console.warn('价格必须大于0');
      return 0;
    }

    // 美元/盎司 * 汇率 / 克数 = 人民币/克
    const cnyPerGram = (usdPerOz * this.exchangeRate) / GOLD_CONVERSION.OZ_TO_GRAM;
    
    // 保留两位小数
    return Math.round(cnyPerGram * 100) / 100;
  }

  /**
   * 人民币/克 转 美元/盎司
   * @param cnyPerGram 人民币/克价格
   * @returns 美元/盎司价格
   */
  public convertCnyPerGramToUsdPerOz(cnyPerGram: number): number {
    if (cnyPerGram <= 0) {
      console.warn('价格必须大于0');
      return 0;
    }

    // 人民币/克 * 克数 / 汇率 = 美元/盎司
    const usdPerOz = (cnyPerGram * GOLD_CONVERSION.OZ_TO_GRAM) / this.exchangeRate;
    
    // 保留两位小数
    return Math.round(usdPerOz * 100) / 100;
  }

  /**
   * 格式化人民币/克价格显示
   */
  public formatCnyPerGram(price: number): string {
    return `¥${price.toFixed(2)}/克`;
  }

  /**
   * 格式化美元/盎司价格显示
   */
  public formatUsdPerOz(price: number): string {
    return `$${price.toFixed(2)}/oz`;
  }

  /**
   * 批量转换价格（美元/盎司 到 人民币/克）
   */
  public batchConvertUsdToCny(prices: number[]): number[] {
    return prices.map(price => this.convertUsdPerOzToCnyPerGram(price));
  }

  /**
   * 批量转换价格（人民币/克 到 美元/盎司）
   */
  public batchConvertCnyToUsd(prices: number[]): number[] {
    return prices.map(price => this.convertCnyPerGramToUsdPerOz(price));
  }

  /**
   * 获取转换信息（用于显示）
   */
  public getConversionInfo(): {
    ozToGram: number;
    usdToCny: number;
    description: string;
  } {
    return {
      ozToGram: GOLD_CONVERSION.OZ_TO_GRAM,
      usdToCny: this.exchangeRate,
      description: `1盎司 = ${GOLD_CONVERSION.OZ_TO_GRAM}克，汇率 = ${this.exchangeRate}`
    };
  }
}

/**
 * 导出单例实例
 */
export const goldPriceConverter = GoldPriceConverter.getInstance();
