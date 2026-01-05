-- 将旧数据迁移到用户: yin728607814@gmail.com
-- User ID: 99d79780-9ddd-4f60-82c6-3e42fa800bef
-- 
-- 直接在 Supabase SQL Editor 中执行此脚本

-- 更新 positions 表
UPDATE positions 
SET user_id = '99d79780-9ddd-4f60-82c6-3e42fa800bef'
WHERE user_id = 'ffbce643-c892-4f7d-b4e1-736bdc60b816';

-- 更新 fund_configs 表
UPDATE fund_configs 
SET user_id = '99d79780-9ddd-4f60-82c6-3e42fa800bef'
WHERE user_id = 'ffbce643-c892-4f7d-b4e1-736bdc60b816';

-- 验证迁移结果
SELECT 
  'positions' as table_name, 
  user_id, 
  COUNT(*) as count
FROM positions
GROUP BY user_id
UNION ALL
SELECT 
  'fund_configs' as table_name, 
  user_id, 
  COUNT(*) as count
FROM fund_configs
GROUP BY user_id
ORDER BY table_name, user_id;

-- 查看迁移后的数据详情
SELECT 
  'positions' as source,
  COUNT(*) as total_records,
  COUNT(DISTINCT asset_type) as asset_types,
  SUM(investment_amount) as total_investment
FROM positions
WHERE user_id = '99d79780-9ddd-4f60-82c6-3e42fa800bef'
UNION ALL
SELECT 
  'fund_configs' as source,
  COUNT(*) as total_records,
  COUNT(DISTINCT name) as unique_funds,
  0 as total_investment
FROM fund_configs
WHERE user_id = '99d79780-9ddd-4f60-82c6-3e42fa800bef';
