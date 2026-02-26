-- ============================================================================
-- 更新演示账号的收益率（profit_loss_percent）
-- 基于 profit_loss 和 investment_amount 计算
-- ============================================================================

-- 演示账号 UUID: 29113055-18d5-4094-8786-5e603b04c876

DO $$
DECLARE
  demo_user_id TEXT := '29113055-18d5-4094-8786-5e603b04c876';
  updated_count INT;
BEGIN

  RAISE NOTICE '开始更新演示账号的收益率...';
  RAISE NOTICE '用户 ID: %', demo_user_id;

  -- 更新所有持仓的收益率
  -- 收益率 = (profit_loss / investment_amount) * 100
  UPDATE positions
  SET profit_loss_percent = CASE 
    WHEN investment_amount > 0 THEN 
      ROUND((profit_loss / investment_amount * 100)::numeric, 2)
    ELSE 
      0
  END
  WHERE user_id = demo_user_id;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RAISE NOTICE '✅ 已更新 % 条持仓记录的收益率', updated_count;
  RAISE NOTICE '';

END $$;

-- ============================================================================
-- 验证更新结果
-- ============================================================================

-- 查看所有持仓的收益情况
SELECT 
  asset_type AS "资产类型",
  fund_name AS "基金名称",
  investment_amount AS "持仓金额",
  profit_loss AS "持仓收益",
  profit_loss_percent AS "收益率(%)",
  CASE 
    WHEN profit_loss_percent > 0 THEN '盈利'
    WHEN profit_loss_percent < 0 THEN '亏损'
    ELSE '持平'
  END AS "状态"
FROM positions
WHERE user_id = '29113055-18d5-4094-8786-5e603b04c876'
ORDER BY asset_type, investment_amount DESC;

-- 查看各资产类型的汇总收益
SELECT 
  asset_type AS "资产类型",
  COUNT(*) AS "持仓数量",
  SUM(investment_amount) AS "总投资金额",
  SUM(profit_loss) AS "总收益",
  CASE 
    WHEN SUM(investment_amount) > 0 THEN 
      ROUND((SUM(profit_loss) / SUM(investment_amount) * 100)::numeric, 2)
    ELSE 
      0
  END AS "平均收益率(%)"
FROM positions
WHERE user_id = '29113055-18d5-4094-8786-5e603b04c876'
GROUP BY asset_type
ORDER BY asset_type;

-- 完成！
