-- ============================================================================
-- 检查并修复资产类型错误
-- ============================================================================

-- 系统固定用户ID
DO $$
DECLARE
  v_user_id VARCHAR(255) := 'ffbce643-c892-4f7d-b4e1-736bdc60b816';
BEGIN

RAISE NOTICE '=== 检查当前数据 ===';

-- 查看所有持仓的资产类型分布
RAISE NOTICE '持仓资产类型分布：';
FOR rec IN 
  SELECT asset_type, COUNT(*) as count, 
         ROUND(SUM(investment_amount), 2) as total_investment,
         ROUND(SUM(profit_loss), 2) as total_profit
  FROM positions
  WHERE user_id = v_user_id
  GROUP BY asset_type
  ORDER BY asset_type
LOOP
  RAISE NOTICE '  %: % 个, 投资: ¥%, 盈亏: ¥%', 
    rec.asset_type, rec.count, rec.total_investment, rec.total_profit;
END LOOP;

-- 查看基金配置的类型分布
RAISE NOTICE '基金配置类型分布：';
FOR rec IN 
  SELECT fund_type, COUNT(*) as count
  FROM fund_configs
  WHERE user_id = v_user_id
  GROUP BY fund_type
  ORDER BY fund_type
LOOP
  RAISE NOTICE '  %: % 个', rec.fund_type, rec.count;
END LOOP;

RAISE NOTICE '';
RAISE NOTICE '=== 检查可能的错误数据 ===';

-- 检查是否有A股基金被标记为nasdaq
RAISE NOTICE '检查纳斯达克持仓中是否包含A股基金...';
FOR rec IN
  SELECT id, fund_name, asset_type, investment_amount, profit_loss
  FROM positions
  WHERE user_id = v_user_id
    AND asset_type = 'nasdaq'
    AND (
      fund_name LIKE '%前海开源%'
      OR fund_name LIKE '%长城久嘉%'
      OR fund_name LIKE '%汇添富中证电池%'
      OR fund_name LIKE '%国投瑞银白银%'
      OR fund_name LIKE '%永赢%'
      OR fund_name LIKE '%华夏有色%'
      OR fund_name LIKE '%华安黄金%'
      OR fund_name LIKE '%天弘中证光伏%'
    )
LOOP
  RAISE NOTICE '  ⚠️ 发现错误: % (当前类型: %, 应该是: astock)', 
    rec.fund_name, rec.asset_type;
END LOOP;

END $$;

-- ============================================================================
-- 修复脚本（如果发现错误，取消下面的注释并执行）
-- ============================================================================

/*
-- 修复：将A股基金从nasdaq改为astock
UPDATE positions
SET asset_type = 'astock'
WHERE user_id = 'ffbce643-c892-4f7d-b4e1-736bdc60b816'
  AND asset_type = 'nasdaq'
  AND (
    fund_name LIKE '%前海开源%'
    OR fund_name LIKE '%长城久嘉%'
    OR fund_name LIKE '%汇添富中证电池%'
    OR fund_name LIKE '%国投瑞银白银%'
    OR fund_name LIKE '%永赢%'
    OR fund_name LIKE '%华夏有色%'
    OR fund_name LIKE '%华安黄金%'
    OR fund_name LIKE '%天弘中证光伏%'
  );

-- 验证修复结果
SELECT 
  asset_type as "资产类型",
  COUNT(*) as "持仓数",
  ROUND(SUM(investment_amount), 2) as "总投资",
  ROUND(SUM(profit_loss), 2) as "总盈亏"
FROM positions
WHERE user_id = 'ffbce643-c892-4f7d-b4e1-736bdc60b816'
GROUP BY asset_type
ORDER BY asset_type;
*/
