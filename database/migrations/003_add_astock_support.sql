-- ============================================================================
-- 添加 A股 支持的数据库迁移脚本
-- 在 Supabase SQL Editor 中执行此脚本
-- ============================================================================

-- 1. 修改 positions 表的 asset_type 约束，添加 'astock' 类型
ALTER TABLE positions 
  DROP CONSTRAINT IF EXISTS positions_asset_type_check;

ALTER TABLE positions 
  ADD CONSTRAINT positions_asset_type_check 
  CHECK (asset_type IN ('nasdaq', 'gold', 'astock'));

-- 2. 更新表注释
COMMENT ON COLUMN positions.asset_type IS '资产类型：nasdaq（纳斯达克）、gold（黄金）或 astock（A股）';
COMMENT ON COLUMN positions.fund_name IS '基金名称（纳斯达克和A股）';

-- 3. 修改 fund_configs 表的约束（如果需要区分基金类型）
-- 注意：fund_configs 表可能需要添加 fund_type 字段来区分纳斯达克和A股基金
ALTER TABLE fund_configs 
  ADD COLUMN IF NOT EXISTS fund_type VARCHAR(20) DEFAULT 'nasdaq' CHECK (fund_type IN ('nasdaq', 'astock'));

-- 4. 为新字段添加索引
CREATE INDEX IF NOT EXISTS idx_fund_configs_fund_type ON fund_configs(fund_type);
CREATE INDEX IF NOT EXISTS idx_fund_configs_user_type ON fund_configs(user_id, fund_type);

-- 5. 添加注释
COMMENT ON COLUMN fund_configs.fund_type IS '基金类型：nasdaq（纳斯达克）或 astock（A股）';

-- 6. 验证更新
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name IN ('positions', 'fund_configs')
ORDER BY table_name, ordinal_position;

-- 完成！
-- A股支持已添加到数据库
