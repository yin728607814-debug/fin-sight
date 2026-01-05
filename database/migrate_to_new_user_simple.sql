-- 简单版本：将旧数据迁移到新用户
-- 
-- 使用方法：
-- 1. 将下面第一行的 'YOUR_USER_ID_HERE' 替换为你的实际用户ID
-- 2. 执行整个脚本

-- ⚠️ 修改这里：将 YOUR_USER_ID_HERE 替换为你的用户ID
UPDATE positions 
SET user_id = 'YOUR_USER_ID_HERE'
WHERE user_id = 'ffbce643-c892-4f7d-b4e1-736bdc60b816';

UPDATE fund_configs 
SET user_id = 'YOUR_USER_ID_HERE'
WHERE user_id = 'ffbce643-c892-4f7d-b4e1-736bdc60b816';

-- 验证结果
SELECT 'positions' as table_name, user_id, COUNT(*) as count
FROM positions
GROUP BY user_id
UNION ALL
SELECT 'fund_configs' as table_name, user_id, COUNT(*) as count
FROM fund_configs
GROUP BY user_id;
