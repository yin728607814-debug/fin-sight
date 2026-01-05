-- 启用行级安全策略 (Row Level Security)
-- 确保用户只能访问自己的数据

-- ============================================
-- 1. 启用 RLS
-- ============================================

-- 为 positions 表启用 RLS
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;

-- 为 fund_configs 表启用 RLS
ALTER TABLE fund_configs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. 创建 positions 表的策略
-- ============================================

-- 用户只能查看自己的持仓
CREATE POLICY "用户只能查看自己的持仓"
ON positions
FOR SELECT
USING (auth.uid()::text = user_id);

-- 用户只能插入自己的持仓
CREATE POLICY "用户只能插入自己的持仓"
ON positions
FOR INSERT
WITH CHECK (auth.uid()::text = user_id);

-- 用户只能更新自己的持仓
CREATE POLICY "用户只能更新自己的持仓"
ON positions
FOR UPDATE
USING (auth.uid()::text = user_id)
WITH CHECK (auth.uid()::text = user_id);

-- 用户只能删除自己的持仓
CREATE POLICY "用户只能删除自己的持仓"
ON positions
FOR DELETE
USING (auth.uid()::text = user_id);

-- ============================================
-- 3. 创建 fund_configs 表的策略
-- ============================================

-- 用户只能查看自己的基金配置
CREATE POLICY "用户只能查看自己的基金配置"
ON fund_configs
FOR SELECT
USING (auth.uid()::text = user_id);

-- 用户只能插入自己的基金配置
CREATE POLICY "用户只能插入自己的基金配置"
ON fund_configs
FOR INSERT
WITH CHECK (auth.uid()::text = user_id);

-- 用户只能更新自己的基金配置
CREATE POLICY "用户只能更新自己的基金配置"
ON fund_configs
FOR UPDATE
USING (auth.uid()::text = user_id)
WITH CHECK (auth.uid()::text = user_id);

-- 用户只能删除自己的基金配置
CREATE POLICY "用户只能删除自己的基金配置"
ON fund_configs
FOR DELETE
USING (auth.uid()::text = user_id);

-- ============================================
-- 4. 验证策略
-- ============================================

-- 查看 positions 表的策略
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'positions';

-- 查看 fund_configs 表的策略
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'fund_configs';
