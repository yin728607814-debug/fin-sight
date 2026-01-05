-- ============================================================================
-- 基金配置表创建脚本
-- 在 Supabase SQL Editor 中执行此脚本
-- ============================================================================

-- 1. 创建 fund_configs 表
CREATE TABLE IF NOT EXISTS fund_configs (
  -- 主键
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 用户标识
  user_id VARCHAR(255) NOT NULL,
  
  -- 基金信息
  name VARCHAR(255) NOT NULL,
  
  -- 元数据
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 创建索引
CREATE INDEX IF NOT EXISTS idx_fund_configs_user_id ON fund_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_fund_configs_name ON fund_configs(name);
CREATE INDEX IF NOT EXISTS idx_fund_configs_created_at ON fund_configs(created_at DESC);

-- 3. 创建自动更新 updated_at 的触发器
DROP TRIGGER IF EXISTS update_fund_configs_updated_at ON fund_configs;
CREATE TRIGGER update_fund_configs_updated_at 
  BEFORE UPDATE ON fund_configs 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 4. 启用 Row Level Security (RLS)
ALTER TABLE fund_configs ENABLE ROW LEVEL SECURITY;

-- 5. 创建 RLS 策略
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON fund_configs;
CREATE POLICY "Enable all operations for authenticated users"
  ON fund_configs
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 6. 添加表注释
COMMENT ON TABLE fund_configs IS '基金配置表';
COMMENT ON COLUMN fund_configs.id IS '基金配置唯一标识';
COMMENT ON COLUMN fund_configs.user_id IS '用户标识（UUID）';
COMMENT ON COLUMN fund_configs.name IS '基金名称';
COMMENT ON COLUMN fund_configs.created_at IS '创建时间';
COMMENT ON COLUMN fund_configs.updated_at IS '更新时间';

-- 7. 验证表结构
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'fund_configs'
ORDER BY ordinal_position;

-- 完成！
