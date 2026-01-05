-- 将旧的固定用户ID数据迁移到新用户
-- 
-- 使用方法：
-- 1. 在 Supabase 控制台 Authentication → Users 找到你的用户
-- 2. 复制你的 User ID (UUID)
-- 3. 将下面的 'YOUR_NEW_USER_ID' 替换为你的实际 User ID
-- 4. 执行此脚本

-- ============================================
-- 配置区域：替换为你的新用户ID
-- ============================================
DO $$
DECLARE
  old_user_id TEXT := 'ffbce643-c892-4f7d-b4e1-736bdc60b816';  -- 旧的固定ID
  new_user_id TEXT := 'YOUR_NEW_USER_ID';  -- 替换为你的新用户ID
BEGIN
  -- 检查新用户ID是否有效
  IF new_user_id = 'YOUR_NEW_USER_ID' THEN
    RAISE EXCEPTION '请先将 new_user_id 替换为你的实际用户ID！';
  END IF;

  -- 显示迁移信息
  RAISE NOTICE '开始迁移数据...';
  RAISE NOTICE '旧用户ID: %', old_user_id;
  RAISE NOTICE '新用户ID: %', new_user_id;

  -- 更新 positions 表
  UPDATE positions 
  SET user_id = new_user_id
  WHERE user_id = old_user_id;
  
  RAISE NOTICE '已更新 % 条 positions 记录', (SELECT COUNT(*) FROM positions WHERE user_id = new_user_id);

  -- 更新 fund_configs 表
  UPDATE fund_configs 
  SET user_id = new_user_id
  WHERE user_id = old_user_id;
  
  RAISE NOTICE '已更新 % 条 fund_configs 记录', (SELECT COUNT(*) FROM fund_configs WHERE user_id = new_user_id);

  RAISE NOTICE '迁移完成！';
END $$;

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
