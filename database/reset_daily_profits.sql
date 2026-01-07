-- 每日清零当日收益数据
-- 在新的一天开始时执行此脚本，清零所有当日收益相关字段
-- 执行时间：每天开盘前

-- 清零A股和纳斯达克基金的当日收益
UPDATE positions
SET 
  daily_change = NULL,
  daily_profit_loss = NULL,
  updated_at = NOW()
WHERE asset_type IN ('astock', 'nasdaq');

-- 验证清零结果
SELECT 
  asset_type as "资产类型",
  COUNT(*) as "持仓数量",
  COUNT(daily_change) as "有当日收益率的数量",
  COUNT(daily_profit_loss) as "有当日收益的数量"
FROM positions
WHERE asset_type IN ('astock', 'nasdaq')
GROUP BY asset_type;

-- 显示清零后的持仓列表
SELECT 
  fund_name as "基金名称",
  asset_type as "类型",
  investment_amount as "投资金额",
  profit_loss as "累计盈亏",
  daily_change as "当日收益率",
  daily_profit_loss as "当日收益"
FROM positions
WHERE asset_type IN ('astock', 'nasdaq')
ORDER BY asset_type, fund_name;
