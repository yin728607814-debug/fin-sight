-- ============================================================================
-- 简单版：清除重复的持仓数据
-- 保留每个基金最新的一条记录
-- ============================================================================

-- 查看重复情况
SELECT 
  fund_name as "基金名称",
  asset_type as "资产类型",
  COUNT(*) as "重复次数"
FROM positions
WHERE user_id = 'ffbce643-c892-4f7d-b4e1-736bdc60b816'
  AND fund_name IS NOT NULL
GROUP BY fund_name, asset_type
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC;

-- 删除重复的持仓，只保留最新的一条
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
    WHERE user_id = 'ffbce643-c892-4f7d-b4e1-736bdc60b816'
      AND fund_name IS NOT NULL
  ) t
  WHERE rn > 1
);

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

-- 完成！刷新页面查看结果
