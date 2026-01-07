-- 对比A股和纳斯达克的数据类型
-- 用于调试：查看为什么A股能显示而纳斯达克不能

-- 查看A股数据
SELECT 
  'A股' as "类型",
  fund_name as "基金名称",
  daily_change as "当日收益率",
  pg_typeof(daily_change) as "收益率数据类型",
  daily_profit_loss as "当日收益",
  pg_typeof(daily_profit_loss) as "收益数据类型"
FROM positions
WHERE asset_type = 'astock'
  AND daily_change IS NOT NULL
LIMIT 2;

-- 查看纳斯达克数据
SELECT 
  '纳斯达克' as "类型",
  fund_name as "基金名称",
  daily_change as "当日收益率",
  pg_typeof(daily_change) as "收益率数据类型",
  daily_profit_loss as "当日收益",
  pg_typeof(daily_profit_loss) as "收益数据类型"
FROM positions
WHERE asset_type = 'nasdaq'
  AND daily_change IS NOT NULL
LIMIT 2;
