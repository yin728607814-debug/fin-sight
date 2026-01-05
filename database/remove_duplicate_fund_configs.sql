-- 清理 fund_configs 表中的重复数据
-- 保留每个 name 最早创建的记录

-- 1. 先查看重复数据
SELECT 
  name,
  COUNT(*) as count,
  MIN(created_at) as earliest,
  MAX(created_at) as latest
FROM fund_configs
WHERE user_id = 'ffbce643-c892-4f7d-b4e1-736bdc60b816'
GROUP BY name
HAVING COUNT(*) > 1
ORDER BY name;

-- 2. 删除重复数据，保留最早的记录
DELETE FROM fund_configs
WHERE id IN (
  SELECT id
  FROM (
    SELECT 
      id,
      ROW_NUMBER() OVER (
        PARTITION BY name, user_id 
        ORDER BY created_at ASC
      ) as rn
    FROM fund_configs
    WHERE user_id = 'ffbce643-c892-4f7d-b4e1-736bdc60b816'
  ) t
  WHERE rn > 1
);

-- 3. 验证清理结果
SELECT 
  COUNT(*) as total_count,
  COUNT(DISTINCT name) as unique_funds
FROM fund_configs
WHERE user_id = 'ffbce643-c892-4f7d-b4e1-736bdc60b816';

-- 4. 查看所有基金配置
SELECT 
  id,
  name,
  created_at,
  updated_at
FROM fund_configs
WHERE user_id = 'ffbce643-c892-4f7d-b4e1-736bdc60b816'
ORDER BY name;
