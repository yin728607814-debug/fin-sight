-- ============================================================================
-- 修复A股基金的资产类型
-- 将错误标记为 nasdaq 的A股基金改为 astock
-- ============================================================================

-- 系统固定用户ID
DO $$
DECLARE
  v_user_id VARCHAR(255) := 'ffbce643-c892-4f7d-b4e1-736bdc60b816';
  v_updated_count INT;
BEGIN

RAISE NOTICE '开始修复A股基金的资产类型...';

-- 修复持仓表中的A股基金
UPDATE positions
SET asset_type = 'astock'
WHERE user_id = v_user_id
  AND (
    -- A股基金列表
    fund_name = '前海开源嘉鑫灵活配置混合C'
    OR fund_name = '长城久嘉创新成长灵活配置混合C'
    OR fund_name = '汇添富中证电池主题ETF联接C'
    OR fund_name = '国投瑞银白银期货(LOF)C'
    OR fund_name = '永赢高端设备智选混合C'
    OR fund_name = '华夏有色金属ETF联接C'
    OR fund_name = '永赢科技智选混合C'
    OR fund_name = '华安黄金ETF联接C'
    OR fund_name = '永赢半导体产业智选混合C'
    OR fund_name = '天弘中证光伏产业指数C'
  );

GET DIAGNOSTICS v_updated_count = ROW_COUNT;
RAISE NOTICE '✓ 已修复 % 条持仓记录', v_updated_count;

-- 显示修复后的统计
RAISE NOTICE '';
RAISE NOTICE '=== 修复后的数据统计 ===';

END $$;

-- 查看修复结果
SELECT 
  asset_type as "资产类型",
  COUNT(*) as "持仓数",
  ROUND(SUM(investment_amount), 2) as "总投资(元)",
  ROUND(SUM(profit_loss), 2) as "总盈亏(元)",
  ROUND(SUM(profit_loss) / NULLIF(SUM(investment_amount), 0) * 100, 2) as "收益率(%)"
FROM positions
WHERE user_id = 'ffbce643-c892-4f7d-b4e1-736bdc60b816'
GROUP BY asset_type
ORDER BY 
  CASE asset_type
    WHEN 'nasdaq' THEN 1
    WHEN 'astock' THEN 2
    WHEN 'gold' THEN 3
  END;

-- 列出所有持仓以便验证
SELECT 
  asset_type as "类型",
  fund_name as "基金名称",
  investment_amount as "投资金额",
  profit_loss as "盈亏"
FROM positions
WHERE user_id = 'ffbce643-c892-4f7d-b4e1-736bdc60b816'
ORDER BY asset_type, fund_name;

-- 完成！刷新页面即可看到正确的数据
