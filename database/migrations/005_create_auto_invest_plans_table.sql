-- ============================================================================
-- 定投计划表创建脚本
-- 在 Supabase SQL Editor 中执行此脚本
-- ============================================================================

-- 1. 创建 auto_invest_plans 表
CREATE TABLE IF NOT EXISTS auto_invest_plans (
  -- 主键
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 用户标识
  user_id VARCHAR(255) NOT NULL,
  
  -- 资产类型（nasdaq/astock，不包括gold）
  asset_type VARCHAR(20) NOT NULL CHECK (asset_type IN ('nasdaq', 'astock')),
  
  -- 基金名称
  fund_name VARCHAR(255) NOT NULL,
  
  -- 定投金额（人民币）
  invest_amount DECIMAL(12,2) NOT NULL CHECK (invest_amount > 0),
  
  -- 定投频率（daily/weekly/monthly）
  frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  
  -- 定投日期设置
  -- 对于weekly: 1-7 (周一到周日)
  -- 对于monthly: 1-28 (每月几号)
  -- 对于daily: NULL
  invest_day INTEGER CHECK (invest_day IS NULL OR (invest_day >= 1 AND invest_day <= 28)),
  
  -- 是否启用
  is_enabled BOOLEAN DEFAULT true,
  
  -- 下次执行时间
  next_execution_date DATE,
  
  -- 最后执行时间
  last_execution_date DATE,
  
  -- 元数据
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 创建索引
CREATE INDEX IF NOT EXISTS idx_auto_invest_user_id ON auto_invest_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_auto_invest_asset_type ON auto_invest_plans(asset_type);
CREATE INDEX IF NOT EXISTS idx_auto_invest_enabled ON auto_invest_plans(is_enabled);
CREATE INDEX IF NOT EXISTS idx_auto_invest_next_execution ON auto_invest_plans(next_execution_date) WHERE is_enabled = true;
CREATE INDEX IF NOT EXISTS idx_auto_invest_user_asset ON auto_invest_plans(user_id, asset_type);

-- 3. 创建自动更新 updated_at 的触发器
DROP TRIGGER IF EXISTS update_auto_invest_plans_updated_at ON auto_invest_plans;
CREATE TRIGGER update_auto_invest_plans_updated_at 
  BEFORE UPDATE ON auto_invest_plans 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 4. 启用 Row Level Security (RLS)
ALTER TABLE auto_invest_plans ENABLE ROW LEVEL SECURITY;

-- 5. 创建 RLS 策略
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON auto_invest_plans;
CREATE POLICY "Enable all operations for authenticated users"
  ON auto_invest_plans
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 6. 添加表注释
COMMENT ON TABLE auto_invest_plans IS '定投计划表';
COMMENT ON COLUMN auto_invest_plans.id IS '定投计划唯一标识';
COMMENT ON COLUMN auto_invest_plans.user_id IS '用户标识';
COMMENT ON COLUMN auto_invest_plans.asset_type IS '资产类型（nasdaq/astock）';
COMMENT ON COLUMN auto_invest_plans.fund_name IS '基金名称';
COMMENT ON COLUMN auto_invest_plans.invest_amount IS '定投金额（人民币）';
COMMENT ON COLUMN auto_invest_plans.frequency IS '定投频率（daily/weekly/monthly）';
COMMENT ON COLUMN auto_invest_plans.invest_day IS '定投日期（weekly: 1-7, monthly: 1-28, daily: NULL）';
COMMENT ON COLUMN auto_invest_plans.is_enabled IS '是否启用';
COMMENT ON COLUMN auto_invest_plans.next_execution_date IS '下次执行时间';
COMMENT ON COLUMN auto_invest_plans.last_execution_date IS '最后执行时间';
COMMENT ON COLUMN auto_invest_plans.created_at IS '创建时间';
COMMENT ON COLUMN auto_invest_plans.updated_at IS '更新时间';

-- 7. 验证表结构
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'auto_invest_plans'
ORDER BY ordinal_position;

-- 完成！
