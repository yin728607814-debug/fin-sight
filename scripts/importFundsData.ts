/**
 * 导入基金数据脚本
 * 将 NEW_TZZH.txt 中的数据导入到基金配置和投资组合
 */

// 纳斯达克基金数据
export const nasdaqFunds = [
  { name: '摩根纳斯达克100指数(QDII)人民币A', amount: 51114.10, profit: -335.90 },
  { name: '建信纳斯达克100指数QDII A', amount: 35763.94, profit: -536.06 },
  { name: '南方纳斯达克100指数发起(QDII) A', amount: 31602.65, profit: 252.65 },
  { name: '易方达全球成长精选混合人民币A类', amount: 21387.06, profit: 387.06 },
  { name: '易方达全球成长精选混合人民币C类', amount: 20374.38, profit: 374.38 },
  { name: '华安纳斯达克100ETF联接(QDII) A', amount: 13822.91, profit: -7.09 },
  { name: '华安纳斯达克100ETF联接(QDII) C', amount: 12195.99, profit: -64.01 },
  { name: '嘉实纳斯达克100联接(QDII)C人民币', amount: 11538.04, profit: -261.96 },
  { name: '广发纳斯达克100ETF联接(QDII) A', amount: 10065.86, profit: 245.86 },
  { name: '南方纳斯达克100指数发起(QDII) C', amount: 10062.90, profit: -87.10 },
  { name: '大成纳斯达克100ETF联接(QDII)A', amount: 4045.87, profit: 45.87 },
  { name: '华宝纳斯达克精选股票发起式(QDII) A', amount: 3667.90, profit: -82.10 },
  { name: '景顺长城纳斯达克科技ETF联接A', amount: 3487.57, profit: -12.43 },
  { name: '景顺长城纳斯达克科技ETF联接E', amount: 3096.49, profit: -3.51 },
  { name: '景顺长城纳斯达克科技ETF联接C', amount: 2407.31, profit: 7.31 },
  { name: '博时标普500ETF联接(QDII)A', amount: 1958.57, profit: 58.57 },
  { name: '博时纳斯达克100A人名币', amount: 1660.16, profit: 60.16 },
  { name: '华泰博瑞纳斯达克100ETF联接基金(QDII) A', amount: 1620.34, profit: 20.34 },
  { name: '华宝纳斯达克精选股票发起式(QDII) C', amount: 1296.62, profit: -3.38 },
  { name: '南方纳斯达克100指数发起(QDII) I', amount: 30034.16, profit: 34.15 }
];

// A股基金数据
export const astockFunds = [
  { name: '前海开源嘉鑫灵活配置混合C', amount: 7228.14, profit: 628.14 },
  { name: '长城久嘉创新成长灵活配置混合C', amount: 4099.07, profit: 399.07 },
  { name: '汇添富中证电池主题ETF联接C', amount: 3864.75, profit: 64.75 },
  { name: '国投瑞银白银期货(LOF)C', amount: 621.01, profit: 21.01 },
  { name: '永赢高端设备智选混合C', amount: 3100, profit: 0 },
  { name: '华夏有色金属ETF联接C', amount: 600, profit: 0 },
  { name: '永赢科技智选混合C', amount: 3792.30, profit: -7.70 },
  { name: '华安黄金ETF联接C', amount: 785.06, profit: -15.34 },
  { name: '永赢半导体产业智选混合C', amount: 3774.73, profit: -25.27 },
  { name: '天弘中证光伏产业指数C', amount: 3038.97, profit: -61.03 }
];

/**
 * 生成导入SQL语句（用于基金配置）
 */
export function generateFundConfigSQL(userId: string): string {
  const nasdaqInserts = nasdaqFunds.map(fund => 
    `('${userId}', '${fund.name.replace(/'/g, "''")}', 'nasdaq')`
  ).join(',\n  ');

  const astockInserts = astockFunds.map(fund => 
    `('${userId}', '${fund.name.replace(/'/g, "''")}', 'astock')`
  ).join(',\n  ');

  return `
-- 导入基金配置数据
-- 请将 YOUR_USER_ID 替换为你的实际用户ID

-- 插入纳斯达克基金配置
INSERT INTO fund_configs (user_id, name, fund_type)
VALUES
  ${nasdaqInserts};

-- 插入A股基金配置
INSERT INTO fund_configs (user_id, name, fund_type)
VALUES
  ${astockInserts};
`;
}

/**
 * 生成导入SQL语句（用于投资组合持仓）
 */
export function generatePositionsSQL(userId: string): string {
  const nasdaqInserts = nasdaqFunds.map(fund => {
    const investmentAmount = fund.amount - fund.profit;
    return `('${userId}', 'nasdaq', '${fund.name.replace(/'/g, "''")}', ${investmentAmount.toFixed(2)}, ${fund.profit.toFixed(2)})`;
  }).join(',\n  ');

  const astockInserts = astockFunds.map(fund => {
    const investmentAmount = fund.amount - fund.profit;
    return `('${userId}', 'astock', '${fund.name.replace(/'/g, "''")}', ${investmentAmount.toFixed(2)}, ${fund.profit.toFixed(2)})`;
  }).join(',\n  ');

  return `
-- 导入投资组合持仓数据
-- 请将 YOUR_USER_ID 替换为你的实际用户ID

-- 插入纳斯达克持仓
INSERT INTO positions (user_id, asset_type, fund_name, investment_amount, profit_loss)
VALUES
  ${nasdaqInserts};

-- 插入A股持仓
INSERT INTO positions (user_id, asset_type, fund_name, investment_amount, profit_loss)
VALUES
  ${astockInserts};
`;
}

/**
 * 生成完整的导入脚本
 */
export function generateFullImportSQL(userId: string): string {
  return `
-- ============================================================================
-- 基金数据导入脚本
-- 在 Supabase SQL Editor 中执行此脚本
-- ============================================================================

-- 用户ID: ${userId}

${generateFundConfigSQL(userId)}

${generatePositionsSQL(userId)}

-- 验证导入结果
SELECT 'fund_configs' as table_name, fund_type, COUNT(*) as count
FROM fund_configs
WHERE user_id = '${userId}'
GROUP BY fund_type

UNION ALL

SELECT 'positions' as table_name, asset_type, COUNT(*) as count
FROM positions
WHERE user_id = '${userId}'
GROUP BY asset_type;

-- 完成！
`;
}

// 如果直接运行此脚本
if (require.main === module) {
  const userId = process.argv[2] || 'YOUR_USER_ID';
  console.log(generateFullImportSQL(userId));
}
