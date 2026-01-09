-- 添加 profit_loss_percent 字段到 positions 表
-- 用于存储持仓收益率（从支付宝截图中提取）
-- 执行时间：2026-01-09

-- 添加字段
ALTER TABLE positions 
ADD COLUMN IF NOT EXISTS profit_loss_percent NUMERIC(10, 4) DEFAULT 0;

-- 添加注释
COMMENT ON COLUMN positions.profit_loss_percent IS '持仓收益率（百分比，如 9.77 表示 +9.77%）';

-- 为现有数据计算并填充收益率（基于 profit_loss / investment_amount * 100）
UPDATE positions 
SET profit_loss_percent = CASE 
  WHEN investment_amount > 0 THEN (profit_loss / investment_amount) * 100
  ELSE 0
END
WHERE profit_loss_percent = 0 OR profit_loss_percent IS NULL;

-- 验证结果
SELECT id, fund_name, investment_amount, profit_loss, profit_loss_percent
FROM positions 
WHERE asset_type = 'astock'
ORDER BY fund_name;
