/**
 * A股基金配置
 * 包含所有A股基金的代码和名称映射
 */

export interface AStockFundInfo {
  code: string;
  name: string;
  category?: string;
}

/**
 * A股基金代码和名称映射表
 */
export const ASTOCK_FUNDS: Record<string, AStockFundInfo> = {
  // 混合型基金
  '前海开源嘉鑫灵活配置混合C': {
    code: '001770',
    name: '前海开源嘉鑫灵活配置混合C',
    category: '混合型'
  },
  '长城久嘉创新成长灵活配置混合C': {
    code: '010052',
    name: '长城久嘉创新成长灵活配置混合C',
    category: '混合型'
  },
  '永赢高端设备智选混合C': {
    code: '015790',
    name: '永赢高端设备智选混合C',
    category: '混合型'
  },
  '永赢科技智选混合C': {
    code: '022365',
    name: '永赢科技智选混合C',
    category: '混合型'
  },
  '永赢半导体产业智选混合C': {
    code: '015968',
    name: '永赢半导体产业智选混合C',
    category: '混合型'
  },
  
  // ETF联接基金
  '汇添富中证电池主题ETF联接C': {
    code: '012863',
    name: '汇添富中证电池主题ETF联接C',
    category: 'ETF联接'
  },
  '华夏有色金属ETF联接C': {
    code: '016708',
    name: '华夏有色金属ETF联接C',
    category: 'ETF联接'
  },
  '华安黄金ETF联接C': {
    code: '000217',
    name: '华安黄金ETF联接C',
    category: 'ETF联接'
  },
  
  // 指数型基金
  '天弘中证光伏产业指数C': {
    code: '011103',
    name: '天弘中证光伏产业指数C',
    category: '指数型'
  },
  
  // LOF基金
  '国投瑞银白银期货(LOF)C': {
    code: '019005',
    name: '国投瑞银白银期货(LOF)C',
    category: 'LOF'
  }
};

/**
 * 根据基金名称获取基金代码
 */
export function getFundCode(fundName: string): string | null {
  const fund = ASTOCK_FUNDS[fundName];
  return fund ? fund.code : null;
}

/**
 * 根据基金代码获取基金名称
 */
export function getFundName(fundCode: string): string | null {
  const entry = Object.entries(ASTOCK_FUNDS).find(([_, info]) => info.code === fundCode);
  return entry ? entry[1].name : null;
}

/**
 * 获取所有基金列表
 */
export function getAllFunds(): AStockFundInfo[] {
  return Object.values(ASTOCK_FUNDS);
}

/**
 * 按类别获取基金列表
 */
export function getFundsByCategory(category: string): AStockFundInfo[] {
  return Object.values(ASTOCK_FUNDS).filter(fund => fund.category === category);
}

/**
 * 检查基金名称是否存在
 */
export function isFundExists(fundName: string): boolean {
  return fundName in ASTOCK_FUNDS;
}
