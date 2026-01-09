-- 更新和插入A股基金数据
-- 执行前请备份数据！
-- 执行时间：2026-01-09
-- User ID: 99d79780-9ddd-4f60-82c6-3e42fa800bef

-- 说明：
-- 1. 所有A股基金的 fund_code 统一为 'ASTOCK'
-- 2. asset_type 统一为 'astock'
-- 3. 华安黄金ETF联接C 归类为 astock（虽然名称中有"黄金"，但它是ETF联接基金）

-- ============================================
-- 第一部分：更新现有基金名称
-- ============================================

-- 1. 更新"永赢高端设备智选混合C"为"永赢高端装备智选混合C"
UPDATE positions 
SET fund_name = '永赢高端装备智选混合C',
    fund_code = 'ASTOCK',
    updated_at = NOW()
WHERE fund_name = '永赢高端设备智选混合C' 
  AND user_id = '99d79780-9ddd-4f60-82c6-3e42fa800bef';

-- 2. 确保所有A股基金的 fund_code 都是 'ASTOCK'
UPDATE positions 
SET fund_code = 'ASTOCK',
    updated_at = NOW()
WHERE asset_type = 'astock' 
  AND user_id = '99d79780-9ddd-4f60-82c6-3e42fa800bef'
  AND (fund_code IS NULL OR fund_code != 'ASTOCK');

-- ============================================
-- 第二部分：插入新基金
-- ============================================

-- 插入5个新基金（从截图中识别出的，数据库中不存在的）
INSERT INTO positions (
  user_id,
  asset_type,
  fund_name,
  fund_code,
  investment_amount,
  profit_loss,
  daily_profit_loss,
  daily_change,
  current_value,
  auto_invest_enabled,
  auto_invest_amount,
  auto_invest_frequency,
  auto_invest_start_date,
  auto_invest_next_date,
  created_at,
  updated_at
) VALUES
-- 1. 华夏上证科创板半导体材料设备主题ETF联接C
('99d79780-9ddd-4f60-82c6-3e42fa800bef', 'astock', '华夏上证科创板半导体材料设备主题ETF联接C', 'ASTOCK', 
 600.00, 0.00, 0.00, 0, 600.00, 
 true, 100.00, 'daily', '2026-01-09', '2026-01-10', NOW(), NOW()),

-- 2. 富国新兴产业股票C
('99d79780-9ddd-4f60-82c6-3e42fa800bef', 'astock', '富国新兴产业股票C', 'ASTOCK', 
 600.00, 0.00, 0.00, 0, 600.00, 
 true, 100.00, 'daily', '2026-01-09', '2026-01-10', NOW(), NOW()),

-- 3. 汇添富中证科创业50指数增强C
('99d79780-9ddd-4f60-82c6-3e42fa800bef', 'astock', '汇添富中证科创业50指数增强C', 'ASTOCK', 
 600.00, 0.00, 0.00, 0, 600.00, 
 true, 100.00, 'daily', '2026-01-09', '2026-01-10', NOW(), NOW()),

-- 4. 富国中证细分化工产业主题ETF联接C
('99d79780-9ddd-4f60-82c6-3e42fa800bef', 'astock', '富国中证细分化工产业主题ETF联接C', 'ASTOCK', 
 600.00, 0.00, 0.00, 0, 600.00, 
 true, 100.00, 'daily', '2026-01-09', '2026-01-10', NOW(), NOW()),

-- 5. 天弘工业有色金属指数C
('99d79780-9ddd-4f60-82c6-3e42fa800bef', 'astock', '天弘工业有色金属指数C', 'ASTOCK', 
 600.00, 0.00, 0.00, 0, 600.00, 
 true, 100.00, 'daily', '2026-01-09', '2026-01-10', NOW(), NOW());

-- ============================================
-- 验证结果
-- ============================================
SELECT id, fund_name, fund_code, asset_type, investment_amount, profit_loss, daily_profit_loss, user_id
FROM positions 
WHERE asset_type = 'astock' AND user_id = '99d79780-9ddd-4f60-82c6-3e42fa800bef'
ORDER BY fund_name;
