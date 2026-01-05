-- ============================================================================
-- 清除所有纳斯达克持仓数据（用于重新导入）
-- ============================================================================

-- 系统固定用户ID
DO $$
DECLARE
  v_user_id VARCHAR(255) := 'ffbce643-c892-4f7d-b4e1-736bdc60b816';
  v_deleted_count INT;
BEGIN

RAISE NOTICE '=== 当前数据统计 ===';

-- 显示删除前的统计
FOR rec IN
  SELECT 
    asset_type,
    COUNT(*) as count,
    ROUND(SUM(investment_amount), 2) as total_investment
  FROM positions
  WHERE user_id = v_user_id
  GROUP BY asset_type
  ORDER BY asset_type
LOOP
  RAISE NOTICE '  %: % 个, 投资: ¥%', 
    rec.asset_type, rec.count, rec.total_investment;
END LOOP;

RAISE NOTICE '';
RAISE NOTICE '=== 删除所有纳斯达克持仓 ===';

-- 删除所有纳斯达克持仓
DELETE FROM positions
WHERE user_id = v_user_id
  AND asset_type = 'nasdaq';

GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
RAISE NOTICE '✓ 已删除 % 条纳斯达克持仓记录', v_deleted_count;

RAISE NOTICE '';
RAISE NOTICE '=== 删除后的数据统计 ===';

END $$;

-- 查看删除后的结果
SELECT 
  asset_type as "资产类型",
  COUNT(*) as "持仓数",
  ROUND(SUM(investment_amount), 2) as "总投资(元)",
  ROUND(SUM(profit_loss), 2) as "总盈亏(元)"
FROM positions
WHERE user_id = 'ffbce643-c892-4f7d-b4e1-736bdc60b816'
GROUP BY asset_type
ORDER BY asset_type;

-- 提示：删除后可以重新执行导入脚本
-- 执行 database/import_funds_data.sql 重新导入纳斯达克数据
