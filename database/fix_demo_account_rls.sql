-- ============================================================================
-- 修复 auto_invest_plans 表的 RLS 策略（安全加固）
-- 确保用户只能访问自己的定投计划
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '开始修复 auto_invest_plans 表的 RLS 策略...';

  -- 删除不安全的策略
  DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON auto_invest_plans;
  RAISE NOTICE '✓ 已删除不安全的策略';

  -- 创建正确的 RLS 策略
  CREATE POLICY "用户只能查看自己的定投计划"
    ON auto_invest_plans
    FOR SELECT
    USING (auth.uid()::text = user_id);

  CREATE POLICY "用户只能插入自己的定投计划"
    ON auto_invest_plans
    FOR INSERT
    WITH CHECK (auth.uid()::text = user_id);

  CREATE POLICY "用户只能更新自己的定投计划"
    ON auto_invest_plans
    FOR UPDATE
    USING (auth.uid()::text = user_id)
    WITH CHECK (auth.uid()::text = user_id);

  CREATE POLICY "用户只能删除自己的定投计划"
    ON auto_invest_plans
    FOR DELETE
    USING (auth.uid()::text = user_id);

  RAISE NOTICE '✅ auto_invest_plans 表的 RLS 策略已修复';
  RAISE NOTICE '用户现在只能访问自己的定投计划';
END $$;

-- 验证策略
SELECT 
  schemaname AS "Schema",
  tablename AS "Table",
  policyname AS "Policy Name",
  cmd AS "Command"
FROM pg_policies
WHERE tablename = 'auto_invest_plans'
ORDER BY policyname;

-- 完成！
