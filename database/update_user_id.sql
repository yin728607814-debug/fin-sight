-- ============================================================================
-- 更新用户ID脚本
-- 将已导入的数据更新为系统固定的用户ID
-- ============================================================================

-- 系统固定的用户ID（与 services/userService.ts 中的 FIXED_USER_ID 一致）
-- 目标用户ID
DO $$
DECLARE
  v_fixed_user_id VARCHAR(255) := 'ffbce643-c892-4f7d-b4e1-736bdc60b816';
  v_your_user_id VARCHAR(255) := 'YOUR_OLD_USER_ID';  -- ⚠️ 请替换为你之前使用的用户ID
  v_fund_count INT;
  v_position_count INT;
BEGIN

-- ============================================================================
-- 第一步：更新 fund_configs 表
-- ============================================================================

-- 更新基金配置的 user_id
UPDATE fund_configs
SET user_id = v_fixed_user_id
WHERE user_id = v_your_user_id;

GET DIAGNOSTICS v_fund_count = ROW_COUNT;
RAISE NOTICE '✓ 已更新 % 条基金配置记录', v_fund_count;

-- ============================================================================
-- 第二步：更新 positions 表
-- ============================================================================

-- 更新持仓的 user_id
UPDATE positions
SET user_id = v_fixed_user_id
WHERE user_id = v_your_user_id;

GET DIAGNOSTICS v_position_count = ROW_COUNT;
RAISE NOTICE '✓ 已更新 % 条持仓记录', v_position_count;

-- ============================================================================
-- 第三步：验证更新结果
-- ============================================================================

RAISE NOTICE '--- 更新完成，验证结果 ---';

-- 验证基金配置
RAISE NOTICE '基金配置统计：';
PERFORM fund_type || ': ' || COUNT(*) || ' 个'
FROM fund_configs
WHERE user_id = v_fixed_user_id
GROUP BY fund_type;

-- 验证持仓
RAISE NOTICE '持仓统计：';
PERFORM asset_type || ': ' || COUNT(*) || ' 个'
FROM positions
WHERE user_id = v_fixed_user_id
GROUP BY asset_type;

END $$;

-- ============================================================================
-- 查询验证（可选）
-- ============================================================================

-- 查看更新后的基金配置
SELECT 
  fund_type as "类型",
  COUNT(*) as "数量",
  user_id as "用户ID"
FROM fund_configs
WHERE user_id = 'ffbce643-c892-4f7d-b4e1-736bdc60b816'
GROUP BY fund_type, user_id
ORDER BY fund_type;

-- 查看更新后的持仓
SELECT 
  asset_type as "资产类型",
  COUNT(*) as "持仓数",
  ROUND(SUM(investment_amount), 2) as "总投资",
  ROUND(SUM(profit_loss), 2) as "总盈亏",
  user_id as "用户ID"
FROM positions
WHERE user_id = 'ffbce643-c892-4f7d-b4e1-736bdc60b816'
GROUP BY asset_type, user_id
ORDER BY asset_type;

-- 完成！
-- 更新完成后，刷新页面即可看到数据
