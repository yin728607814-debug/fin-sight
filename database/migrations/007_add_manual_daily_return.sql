-- 添加手动当日收益率字段
-- 用于校准不准确的API数据

-- 添加 daily_profit_loss 字段（当日收益，元）
ALTER TABLE positions
ADD COLUMN IF NOT EXISTS daily_profit_loss NUMERIC(15, 2);

-- 添加 daily_change 字段（当日涨跌幅，%）
ALTER TABLE positions
ADD COLUMN IF NOT EXISTS daily_change NUMERIC(10, 4);

-- 添加 manual_daily_return 字段（手动输入的当日收益率，%）
ALTER TABLE positions
ADD COLUMN IF NOT EXISTS manual_daily_return NUMERIC(10, 4);

-- 添加注释
COMMENT ON COLUMN positions.daily_profit_loss IS '当日收益（元）';
COMMENT ON COLUMN positions.daily_change IS '当日涨跌幅（%）';
COMMENT ON COLUMN positions.manual_daily_return IS '手动输入的当日收益率（%）- 用于校准不准确的API数据';
