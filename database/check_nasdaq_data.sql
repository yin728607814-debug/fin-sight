-- 检查纳斯达克基金的当日收益数据
-- 用于调试：验证数据是否正确写入数据库

SELECT 
  id,
  fund_name as "基金名称",
  asset_type as "类型",
  investment_amount as "持仓金额",
  daily_change as "当日收益率(%)",
  daily_profit_loss as "当日收益(元)",
  profit_loss as "总收益",
  updated_at as "更新时间"
FROM positions
WHERE asset_type = 'nasdaq'
  AND fund_name IN (
    '景顺长城纳斯达克科技ETF联接A',
    '南方纳斯达克100指数发起(QDII) A'
  )
ORDER BY fund_name;

-- 检查所有纳斯达克基金
SELECT 
  COUNT(*) as "纳斯达克基金总数",
  COUNT(daily_change) as "有收益率的数量",
  COUNT(daily_profit_loss) as "有当日收益的数量"
FROM positions
WHERE asset_type = 'nasdaq';
