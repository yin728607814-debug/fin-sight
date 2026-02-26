-- ============================================================================
-- 为 sentiment_history 表添加行级安全策略 (RLS)
-- 确保用户只能访问自己的情绪历史数据
-- ============================================================================

-- 1. 启用 RLS
ALTER TABLE sentiment_history ENABLE ROW LEVEL SECURITY;

-- 2. 删除可能存在的旧策略
DROP POLICY IF EXISTS "用户只能查看自己的情绪历史" ON sentiment_history;
DROP POLICY IF EXISTS "用户只能插入自己的情绪历史" ON sentiment_history;
DROP POLICY IF EXISTS "用户只能更新自己的情绪历史" ON sentiment_history;
DROP POLICY IF EXISTS "用户只能删除自己的情绪历史" ON sentiment_history;

-- 3. 创建新的安全策略

-- 用户只能查看自己的情绪历史
CREATE POLICY "用户只能查看自己的情绪历史"
  ON sentiment_history
  FOR SELECT
  USING (auth.uid() = user_id);

-- 用户只能插入自己的情绪历史
CREATE POLICY "用户只能插入自己的情绪历史"
  ON sentiment_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 用户只能更新自己的情绪历史
CREATE POLICY "用户只能更新自己的情绪历史"
  ON sentiment_history
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 用户只能删除自己的情绪历史
CREATE POLICY "用户只能删除自己的情绪历史"
  ON sentiment_history
  FOR DELETE
  USING (auth.uid() = user_id);

-- 4. 验证策略
SELECT 
  schemaname AS "Schema",
  tablename AS "Table",
  policyname AS "Policy Name",
  permissive AS "Permissive",
  roles AS "Roles",
  cmd AS "Command",
  qual AS "USING Expression",
  with_check AS "WITH CHECK Expression"
FROM pg_policies
WHERE tablename = 'sentiment_history'
ORDER BY policyname;

-- 5. 测试策略（可选）
-- 注意：这些测试需要在有实际用户登录的情况下运行

-- 测试查询（应该只返回当前用户的数据）
-- SELECT COUNT(*) FROM sentiment_history;

-- 测试插入（应该只能插入当前用户的数据）
-- INSERT INTO sentiment_history (user_id, asset_type, date, score, level, distribution, key_factors, news_count)
-- VALUES (auth.uid(), 'gold', CURRENT_DATE, 50, 'neutral', '{"positive": 0, "neutral": 0, "negative": 0}'::jsonb, ARRAY[]::text[], 0);

-- 完成！
RAISE NOTICE '✅ sentiment_history 表的 RLS 策略已创建';
RAISE NOTICE '用户现在只能访问自己的情绪历史数据';
