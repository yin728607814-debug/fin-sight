-- ============================================================================
-- 清除重复的持仓数据
-- ============================================================================

-- 系统固定用户ID
DO $$
DECLARE
  v_user_id VARCHAR(255) := 'ffbce643-c892-4f7d-b4e1-736bdc60b816';
  rec RECORD;
BEGIN

RAISE NOTICE '=== 查看当前重复情况 ===';

-- 查看每个基金名称的重复次数
FOR rec IN
  SELECT 
    fund_name,
    asset_type,
    COUNT(*) as duplicate_count
  FROM positions
  WHERE user_id = v_user_id
    AND fund_name IS NOT NULL
  GROUP BY fund_name, asset_type
  HAVING COUNT(*) > 1
  ORDER BY COUNT(*) DESC
LOOP
  RAISE NOTICE '重复基金: % (类型: %, 重复: % 次)', 
    rec.fund_name, rec.asset_type, rec.duplicate_count;
END LOOP;

RAISE NOTICE '';
RAISE NOTICE '=== 开始清理重复数据 ===';

-- 删除重复的持仓，只保留最新的一条（根据 created_at）
DELETE FROM positions
WHERE id IN (
  SELECT id
  FROM (
    SELECT 
      id,
      ROW_NUMBER() OVER (
        PARTITION BY user_id, fund_name, asset_type 
        ORDER BY created_at DESC
      ) as rn
    FROM positions
    WHERE user_id = v_user_id
      AND fund_name IS NOT NULL
  ) t
  WHERE rn > 1
);

RAISE NOTICE '✓ 重复数据已清除';

END $$;

-- 查看清理后的结果
SELECT 
  asset_type as "资产类型",
  COUNT(*) as "持仓数",
  ROUND(SUM(investment_amount), 2) as "总投资(元)",
  ROUND(SUM(profit_loss), 2) as "总盈亏(元)"
FROM positions
WHERE user_id = 'ffbce643-c892-4f7d-b4e1-736bdc60b816'
GROUP BY asset_type
ORDER BY 
  CASE asset_type
    WHEN 'nasdaq' THEN 1
    WHEN 'astock' THEN 2
    WHEN 'gold' THEN 3
  END;

-- 列出所有持仓（按类型和名称排序）
SELECT 
  asset_type as "类型",
  fund_name as "基金名称",
  ROUND(investment_amount, 2) as "投资金额",
  ROUND(profit_loss, 2) as "盈亏",
  created_at as "创建时间"
FROM positions
WHERE user_id = 'ffbce643-c892-4f7d-b4e1-736bdc60b816'
ORDER BY asset_type, fund_name;

-- 完成！刷新页面查看结果
