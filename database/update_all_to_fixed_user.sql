-- ============================================================================
-- 将所有数据更新为系统固定用户ID
-- 适用于：不记得之前用的是什么用户ID的情况
-- ============================================================================

-- 系统固定的用户ID
DO $$
DECLARE
  v_fixed_user_id VARCHAR(255) := 'ffbce643-c892-4f7d-b4e1-736bdc60b816';
  v_fund_count INT;
  v_position_count INT;
BEGIN

RAISE NOTICE '开始更新所有数据到固定用户ID...';

-- ============================================================================
-- 更新所有基金配置
-- ============================================================================

UPDATE fund_configs
SET user_id = v_fixed_user_id
WHERE user_id != v_fixed_user_id;

GET DIAGNOSTICS v_fund_count = ROW_COUNT;
RAISE NOTICE '✓ 已更新 % 条基金配置记录', v_fund_count;

-- ============================================================================
-- 更新所有持仓
-- ============================================================================

UPDATE positions
SET user_id = v_fixed_user_id
WHERE user_id != v_fixed_user_id;

GET DIAGNOSTICS v_position_count = ROW_COUNT;
RAISE NOTICE '✓ 已更新 % 条持仓记录', v_position_count;

-- ============================================================================
-- 验证结果
-- ============================================================================

RAISE NOTICE '--- 更新完成 ---';
RAISE NOTICE '固定用户ID: %', v_fixed_user_id;

END $$;

-- 查看最终结果
SELECT 
  '基金配置' as "表名",
  fund_type as "类型",
  COUNT(*) as "数量"
FROM fund_configs
WHERE user_id = 'ffbce643-c892-4f7d-b4e1-736bdc60b816'
GROUP BY fund_type

UNION ALL

SELECT 
  '持仓' as "表名",
  asset_type as "类型",
  COUNT(*) as "数量"
FROM positions
WHERE user_id = 'ffbce643-c892-4f7d-b4e1-736bdc60b816'
GROUP BY asset_type

ORDER BY "表名", "类型";

-- 完成！刷新页面即可看到数据
