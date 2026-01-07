-- 检查定投数据
-- 查看哪些基金有定投设置

SELECT 
  fund_name as "基金名称",
  asset_type as "类型",
  auto_invest_enabled as "定投启用",
  auto_invest_amount as "定投金额",
  auto_invest_frequency as "定投频率",
  auto_invest_next_date as "下次定投日期"
FROM positions
WHERE auto_invest_enabled = true
ORDER BY asset_type, fund_name;

-- 统计
SELECT 
  COUNT(*) as "总持仓数",
  COUNT(CASE WHEN auto_invest_enabled = true THEN 1 END) as "启用定投的数量"
FROM positions;
