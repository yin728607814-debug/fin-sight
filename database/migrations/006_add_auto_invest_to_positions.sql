-- 添加定投字段到 positions 表
-- Migration: 006_add_auto_invest_to_positions

-- 添加定投相关字段
ALTER TABLE positions
ADD COLUMN IF NOT EXISTS auto_invest_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS auto_invest_amount DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS auto_invest_frequency VARCHAR(20),
ADD COLUMN IF NOT EXISTS auto_invest_start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS auto_invest_next_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS auto_invest_last_executed_date TIMESTAMP WITH TIME ZONE;

-- 添加注释
COMMENT ON COLUMN positions.auto_invest_enabled IS '是否启用定投';
COMMENT ON COLUMN positions.auto_invest_amount IS '定投金额（元）';
COMMENT ON COLUMN positions.auto_invest_frequency IS '定投周期：daily, weekly, monthly, quarterly';
COMMENT ON COLUMN positions.auto_invest_start_date IS '首次扣款日期';
COMMENT ON COLUMN positions.auto_invest_next_date IS '下次扣款日期';
COMMENT ON COLUMN positions.auto_invest_last_executed_date IS '上次执行日期';

-- 添加约束：如果启用定投，必须有金额和周期
ALTER TABLE positions
ADD CONSTRAINT check_auto_invest_fields
CHECK (
  (auto_invest_enabled = FALSE) OR
  (auto_invest_enabled = TRUE AND auto_invest_amount IS NOT NULL AND auto_invest_frequency IS NOT NULL)
);

-- 添加索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_positions_auto_invest_enabled ON positions(auto_invest_enabled) WHERE auto_invest_enabled = TRUE;
CREATE INDEX IF NOT EXISTS idx_positions_auto_invest_next_date ON positions(auto_invest_next_date) WHERE auto_invest_enabled = TRUE;
