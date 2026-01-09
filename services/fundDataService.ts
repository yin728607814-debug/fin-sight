/**
 * 基金产品数据服务
 * 提供纳斯达克100基金产品信息和搜索功能
 */

import { FundProduct } from '../types';

/**
 * 纳斯达克100基金产品列表
 */
export const NASDAQ_FUNDS: FundProduct[] = [
  {
    code: '270042',
    name: '广发纳斯达克100ETF联接(QDII)A人民币',
    shortName: '广发纳指ETF联接A',
    type: 'nasdaq',
    company: '广发基金',
    trackingIndex: '纳斯达克100指数'
  },
  {
    code: '006479',
    name: '广发纳斯达克100ETF联接(QDII)C人民币',
    shortName: '广发纳指ETF联接C',
    type: 'nasdaq',
    company: '广发基金',
    trackingIndex: '纳斯达克100指数'
  },
  {
    code: '040046',
    name: '华安纳斯达克100指数(QDII)',
    shortName: '华安纳指',
    type: 'nasdaq',
    company: '华安基金',
    trackingIndex: '纳斯达克100指数'
  },
  {
    code: '513300',
    name: '纳斯达克100ETF',
    shortName: '纳指ETF',
    type: 'nasdaq',
    company: '国泰基金',
    trackingIndex: '纳斯达克100指数'
  },
  {
    code: '160213',
    name: '国泰纳斯达克100指数(QDII)',
    shortName: '国泰纳指',
    type: 'nasdaq',
    company: '国泰基金',
    trackingIndex: '纳斯达克100指数'
  },
  {
    code: '000834',
    name: '大成纳斯达克100指数(QDII)',
    shortName: '大成纳指',
    type: 'nasdaq',
    company: '大成基金',
    trackingIndex: '纳斯达克100指数'
  },
  {
    code: '050025',
    name: '博时标普500ETF联接A',
    shortName: '博时标普500',
    type: 'nasdaq',
    company: '博时基金',
    trackingIndex: '标普500指数'
  },
  {
    code: '161130',
    name: '易方达纳斯达克100指数(QDII-LOF)A人民币',
    shortName: '易方达纳指A',
    type: 'nasdaq',
    company: '易方达基金',
    trackingIndex: '纳斯达克100指数'
  },
  {
    code: '012861',
    name: '易方达纳斯达克100指数(QDII-LOF)C',
    shortName: '易方达纳指C',
    type: 'nasdaq',
    company: '易方达基金',
    trackingIndex: '纳斯达克100指数'
  },
  {
    code: '110032',
    name: '易方达恒生科技ETF联接(QDII)A人民币',
    shortName: '易方达恒生科技',
    type: 'nasdaq',
    company: '易方达基金',
    trackingIndex: '恒生科技指数'
  },
  {
    code: '159941',
    name: '广发纳斯达克100ETF',
    shortName: '纳指ETF',
    type: 'nasdaq',
    company: '广发基金',
    trackingIndex: '纳斯达克100指数'
  },
  {
    code: '513100',
    name: '国泰纳斯达克100ETF',
    shortName: '纳指100',
    type: 'nasdaq',
    company: '国泰基金',
    trackingIndex: '纳斯达克100指数'
  },
  {
    code: '160139',
    name: '南方纳斯达克100指数发起 (QDII) A',
    shortName: '南方纳指A',
    type: 'nasdaq',
    company: '南方基金',
    trackingIndex: '纳斯达克100指数'
  },
  {
    code: '017092',
    name: '南方纳斯达克100指数发起 (QDII) C',
    shortName: '南方纳指C',
    type: 'nasdaq',
    company: '南方基金',
    trackingIndex: '纳斯达克100指数'
  },
  {
    code: '017093',
    name: '南方纳斯达克100指数发起 (QDII) I',
    shortName: '南方纳指I',
    type: 'nasdaq',
    company: '南方基金',
    trackingIndex: '纳斯达克100指数'
  },
  {
    code: '050025',
    name: '博时纳斯达克100A人民币',
    shortName: '博时纳指A',
    type: 'nasdaq',
    company: '博时基金',
    trackingIndex: '纳斯达克100指数'
  },
  {
    code: '270042',
    name: '广发纳斯达克100ETF联接(QDII)A',
    shortName: '广发纳指联接A',
    type: 'nasdaq',
    company: '广发基金',
    trackingIndex: '纳斯达克100指数'
  },
  {
    code: '015093',
    name: '华宝纳斯达克精选股票发起式(QDII)A',
    shortName: '华宝纳指精选A',
    type: 'nasdaq',
    company: '华宝基金',
    trackingIndex: '纳斯达克精选股票'
  }
];

/**
 * 基金数据服务类
 */
export class FundDataService {
  private static instance: FundDataService;

  /**
   * 获取单例实例
   */
  public static getInstance(): FundDataService {
    if (!FundDataService.instance) {
      FundDataService.instance = new FundDataService();
    }
    return FundDataService.instance;
  }

  /**
   * 私有构造函数
   */
  private constructor() {}

  /**
   * 获取所有纳斯达克基金
   */
  public getAllNasdaqFunds(): FundProduct[] {
    return NASDAQ_FUNDS;
  }

  /**
   * 根据代码获取基金
   */
  public getFundByCode(code: string): FundProduct | undefined {
    return NASDAQ_FUNDS.find(fund => fund.code === code);
  }

  /**
   * 搜索基金（按名称或代码）
   */
  public searchFunds(query: string): FundProduct[] {
    if (!query || query.trim() === '') {
      return NASDAQ_FUNDS;
    }

    const lowerQuery = query.toLowerCase().trim();

    return NASDAQ_FUNDS.filter(fund => {
      return (
        fund.code.toLowerCase().includes(lowerQuery) ||
        fund.name.toLowerCase().includes(lowerQuery) ||
        fund.shortName.toLowerCase().includes(lowerQuery) ||
        fund.company.toLowerCase().includes(lowerQuery)
      );
    });
  }

  /**
   * 按公司筛选基金
   */
  public filterByCompany(company: string): FundProduct[] {
    return NASDAQ_FUNDS.filter(fund => fund.company === company);
  }

  /**
   * 获取所有基金公司列表
   */
  public getAllCompanies(): string[] {
    const companies = new Set(NASDAQ_FUNDS.map(fund => fund.company));
    return Array.from(companies).sort();
  }

  /**
   * 按跟踪指数筛选基金
   */
  public filterByIndex(index: string): FundProduct[] {
    return NASDAQ_FUNDS.filter(fund => fund.trackingIndex === index);
  }

  /**
   * 获取所有跟踪指数列表
   */
  public getAllIndices(): string[] {
    const indices = new Set(NASDAQ_FUNDS.map(fund => fund.trackingIndex));
    return Array.from(indices).sort();
  }
}

/**
 * 导出单例实例
 */
export const fundDataService = FundDataService.getInstance();
