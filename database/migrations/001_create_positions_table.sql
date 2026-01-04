-- ============================================================================
-- 投资组合持仓表创建脚本
-- 在 Supabase SQL Editor 中执行此脚本
-- ============================================================================

-- 1. 创建 positions 表
CREATE TABLE IF NOT EXISTS positions (
  -- 主键
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 用户标识
  user_id VARCHAR(255) NOT NULL,
  
  -- 资产类型
  asset_type VARCHAR(20) NOT NULL CHECK (asset_type IN ('nasdaq', 'gold')),
  
  -- 基金信息（纳斯达克）
  fund_name VARCHAR(255),
  
  -- 黄金信息
  quantity DECIMAL(10, 3),  -- 黄金克数
  average_buy_price DECIMAL(10, 2),  -- 黄金均价（元/克）
  
  -- 通用信息
  investment_amount DECIMAL(12, 2) NOT NULL,  -- 持仓金额（元）
  profit_loss DECIMAL(12, 2) NOT NULL,  -- 持仓收益（元）
  
  -- 元数据
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 创建索引
CREATE INDEX IF NOT EXISTS idx_positions_user_id ON positions(user_id);
CREATE INDEX IF NOT EXISTS idx_positions_asset_type ON positions(asset_type);
CREATE INDEX IF NOT EXISTS idx_positions_created_at ON positions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_positions_user_asset ON positions(user_id, asset_type);

-- 3. 创建自动更新 updated_at 的触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 4. 创建触发器
DROP TRIGGER IF EXISTS update_positions_updated_at ON positions;
CREATE TRIGGER update_positions_updated_at 
  BEFORE UPDATE ON positions 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 5. 启用 Row Level Security (RLS)
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;

-- 6. 创建 RLS 策略
-- 注意：由于我们使用自定义的 user_id 系统，这里的策略比较简单
-- 在实际应用中，user_id 会通过 API 层验证

-- 删除旧策略（如果存在）
DROP POLICY IF EXISTS "Users can view their own positions" ON positions;
DROP POLICY IF EXISTS "Users can insert their own positions" ON positions;
DROP POLICY IF EXISTS "Users can update their own positions" ON positions;
DROP POLICY IF EXISTS "Users can delete their own positions" ON positions;

-- 允许所有操作（因为我们在应用层控制权限）
-- 在生产环境中，应该配合 Supabase Auth 使用更严格的策略
CREATE POLICY "Enable all operations for authenticated users"
  ON positions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 7. 添加表注释
COMMENT ON TABLE positions IS '投资组合持仓表';
COMMENT ON COLUMN positions.id IS '持仓唯一标识';
COMMENT ON COLUMN positions.user_id IS '用户标识（UUID）';
COMMENT ON COLUMN positions.asset_type IS '资产类型：nasdaq（纳斯达克）或 gold（黄金）';
COMMENT ON COLUMN positions.fund_name IS '基金名称（仅纳斯达克）';
COMMENT ON COLUMN positions.quantity IS '黄金克数（仅黄金）';
COMMENT ON COLUMN positions.average_buy_price IS '黄金均价，单位：元/克（仅黄金）';
COMMENT ON COLUMN positions.investment_amount IS '持仓金额，单位：元';
COMMENT ON COLUMN positions.profit_loss IS '持仓收益，单位：元';
COMMENT ON COLUMN positions.created_at IS '创建时间';
COMMENT ON COLUMN positions.updated_at IS '更新时间';

-- 8. 验证表结构
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'positions'
ORDER BY ordinal_position;

-- 完成！
-- 执行此脚本后，positions 表已创建完成
-- 可以开始使用 Supabase 客户端进行 CRUD 操作
