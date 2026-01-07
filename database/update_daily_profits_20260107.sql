-- 更新基金当日收益数据
-- 日期: 2026-01-07
-- 数据来源：支付宝基金截图

-- ============================================================================
-- 纳斯达克基金
-- ============================================================================

-- 景顺长城纳斯达克科技ETF联接A
UPDATE positions
SET daily_change = 0.72,
    daily_profit_loss = 14.34,
    updated_at = NOW()
WHERE fund_name = '景顺长城纳斯达克科技ETF联接A'
  AND asset_type = 'nasdaq';

-- 景顺长城纳斯达克科技ETF联接E  
UPDATE positions
SET daily_change = 0.72,
    daily_profit_loss = 20.65,
    updated_at = NOW()
WHERE fund_name = '景顺长城纳斯达克科技ETF联接E'
  AND asset_type = 'nasdaq';

-- 景顺长城纳斯达克科技ETF联接C
UPDATE positions
SET daily_change = 0.80,
    daily_profit_loss = 24.60,
    updated_at = NOW()
WHERE fund_name = '景顺长城纳斯达克科技ETF联接C'
  AND asset_type = 'nasdaq';

-- 华安纳斯达克100ETF联接(QDII) A
UPDATE positions
SET daily_change = 0.86,
    daily_profit_loss = 104.71,
    updated_at = NOW()
WHERE fund_name = '华安纳斯达克100ETF联接(QDII) A'
  AND asset_type = 'nasdaq';

-- 华安纳斯达克100ETF联接(QDII) C
UPDATE positions
SET daily_change = 0.86,
    daily_profit_loss = 119.77,
    updated_at = NOW()
WHERE fund_name = '华安纳斯达克100ETF联接(QDII) C'
  AND asset_type = 'nasdaq';

-- 南方纳斯达克100指数发起(QDII) A
UPDATE positions
SET daily_change = 0.81,
    daily_profit_loss = 256.60,
    updated_at = NOW()
WHERE fund_name = '南方纳斯达克100指数发起(QDII) A'
  AND asset_type = 'nasdaq';

-- 南方纳斯达克100指数发起(QDII) C
UPDATE positions
SET daily_change = 0.81,
    daily_profit_loss = 241.28,
    updated_at = NOW()
WHERE fund_name = '南方纳斯达克100指数发起(QDII) C'
  AND asset_type = 'nasdaq';

-- 南方纳斯达克100指数发起(QDII) I
UPDATE positions
SET daily_change = 0.86,
    daily_profit_loss = 87.49,
    updated_at = NOW()
WHERE fund_name = '南方纳斯达克100指数发起(QDII) I'
  AND asset_type = 'nasdaq';

-- 华宝纳斯达克精选股票发起式(QDII) A
UPDATE positions
SET daily_change = -0.36,
    daily_profit_loss = -13.29,
    updated_at = NOW()
WHERE fund_name = '华宝纳斯达克精选股票发起式(QDII) A'
  AND asset_type = 'nasdaq';

-- 摩根纳斯达克100指数(QDII)人民币A
UPDATE positions
SET daily_change = 0.80,
    daily_profit_loss = 406.93,
    updated_at = NOW()
WHERE fund_name = '摩根纳斯达克100指数(QDII)人民币A'
  AND asset_type = 'nasdaq';

-- 嘉实纳斯达克100联接(QDII)C人民币
UPDATE positions
SET daily_change = 0.82,
    daily_profit_loss = 90.43,
    updated_at = NOW()
WHERE fund_name = '嘉实纳斯达克100联接(QDII)C人民币'
  AND asset_type = 'nasdaq';

-- 建信纳斯达克100指数QDII A
UPDATE positions
SET daily_change = 0.61,
    daily_profit_loss = 215.86,
    updated_at = NOW()
WHERE fund_name = '建信纳斯达克100指数QDII A'
  AND asset_type = 'nasdaq';

-- 广发纳斯达克100ETF联接(QDII) A
UPDATE positions
SET daily_change = 0.84,
    daily_profit_loss = 84.68,
    updated_at = NOW()
WHERE fund_name = '广发纳斯达克100ETF联接(QDII) A'
  AND asset_type = 'nasdaq';

-- 博时纳斯达克100A人名币
UPDATE positions
SET daily_change = 0.82,
    daily_profit_loss = 13.49,
    updated_at = NOW()
WHERE fund_name = '博时纳斯达克100A人名币'
  AND asset_type = 'nasdaq';

-- 博时标普500ETF联接(QDII)A
UPDATE positions
SET daily_change = 0.51,
    daily_profit_loss = 10.06,
    updated_at = NOW()
WHERE fund_name = '博时标普500ETF联接(QDII)A'
  AND asset_type = 'nasdaq';

-- 大成纳斯达克100ETF联接(QDII)A
UPDATE positions
SET daily_change = 0.87,
    daily_profit_loss = 34.84,
    updated_at = NOW()
WHERE fund_name = '大成纳斯达克100ETF联接(QDII)A'
  AND asset_type = 'nasdaq';

-- ============================================================================
-- A股基金
-- ============================================================================

-- 前海开源嘉鑫混合C
UPDATE positions
SET daily_change = 0.12,
    daily_profit_loss = 8.93,
    updated_at = NOW()
WHERE fund_name LIKE '%前海开源嘉鑫混合C%'
  AND asset_type = 'astock';

-- 长城久嘉创新成长
UPDATE positions
SET daily_change = -0.15,
    daily_profit_loss = -6.61,
    updated_at = NOW()
WHERE fund_name LIKE '%长城久嘉创新成长%'
  AND asset_type = 'astock';

-- 永赢半导体产业智选
UPDATE positions
SET daily_change = 1.30,
    daily_profit_loss = 53.56,
    updated_at = NOW()
WHERE fund_name LIKE '%永赢半导体产业智选%'
  AND asset_type = 'astock';

-- 汇添富中证电池主
UPDATE positions
SET daily_change = -0.12,
    daily_profit_loss = -4.91,
    updated_at = NOW()
WHERE fund_name LIKE '%汇添富中证电池主%'
  AND asset_type = 'astock';

-- 永赢高端装备智选
UPDATE positions
SET daily_change = -0.51,
    daily_profit_loss = -17.13,
    updated_at = NOW()
WHERE fund_name LIKE '%永赢高端装备智选%'
  AND asset_type = 'astock';

-- 天弘中证光伏C
UPDATE positions
SET daily_change = 0.60,
    daily_profit_loss = 19.64,
    updated_at = NOW()
WHERE fund_name LIKE '%天弘中证光伏C%'
  AND asset_type = 'astock';

-- 国投瑞银白银期货
UPDATE positions
SET daily_change = 3.65,
    daily_profit_loss = 23.80,
    updated_at = NOW()
WHERE fund_name LIKE '%国投瑞银白银期货%'
  AND asset_type = 'astock';

-- 永赢科技智选混合
UPDATE positions
SET daily_change = 0.97,
    daily_profit_loss = 37.95,
    updated_at = NOW()
WHERE fund_name LIKE '%永赢科技智选混合%'
  AND asset_type = 'astock';

-- 华夏中证细分有色
UPDATE positions
SET daily_change = 0.36,
    daily_profit_loss = 9.91,
    updated_at = NOW()
WHERE fund_name LIKE '%华夏中证细分有色%'
  AND asset_type = 'astock';

-- 华安黄金易ETF联
UPDATE positions
SET daily_change = -0.30,
    daily_profit_loss = -2.69,
    updated_at = NOW()
WHERE fund_name LIKE '%华安黄金易ETF联%'
  AND asset_type = 'astock';

-- ============================================================================
-- 验证更新结果
-- ============================================================================

SELECT 
  asset_type as "资产类型",
  COUNT(*) as "总数",
  COUNT(daily_change) as "已更新收益率",
  ROUND(SUM(daily_profit_loss), 2) as "当日总收益"
FROM positions
WHERE asset_type IN ('astock', 'nasdaq')
GROUP BY asset_type;

-- 显示更新后的详细数据
SELECT 
  fund_name as "基金名称",
  asset_type as "类型",
  daily_change as "当日收益率(%)",
  daily_profit_loss as "当日收益(元)",
  updated_at as "更新时间"
FROM positions
WHERE asset_type IN ('astock', 'nasdaq')
  AND daily_change IS NOT NULL
ORDER BY asset_type, fund_name;
