-- 添加基金代码字段到 fund_configs 表
ALTER TABLE fund_configs 
ADD COLUMN IF NOT EXISTS fund_code TEXT;

-- 添加基金代码字段到 positions 表
ALTER TABLE positions 
ADD COLUMN IF NOT EXISTS fund_code TEXT;

-- 添加注释
COMMENT ON COLUMN fund_configs.fund_code IS '基金代码，用于获取基金收益率数据';
COMMENT ON COLUMN positions.fund_code IS '基金代码，用于获取基金收益率数据';
