-- ============================================================================
-- 创建演示账号并配置假数据
-- 执行前请确保已登录 Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- 第一部分：修复 auto_invest_plans 表的 RLS 策略（安全加固）
-- ============================================================================

-- 删除不安全的策略
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON auto_invest_plans;

-- 创建正确的 RLS 策略
CREATE POLICY "用户只能查看自己的定投计划"
ON auto_invest_plans
FOR SELECT
USING (auth.uid()::text = user_id);

CREATE POLICY "用户只能插入自己的定投计划"
ON auto_invest_plans
FOR INSERT
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "用户只能更新自己的定投计划"
ON auto_invest_plans
FOR UPDATE
USING (auth.uid()::text = user_id)
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "用户只能删除自己的定投计划"
ON auto_invest_plans
FOR DELETE
USING (auth.uid()::text = user_id);

-- ============================================================================
-- 第二部分：创建演示账号
-- ============================================================================

-- 注意：这里需要手动在 Supabase Auth 中创建用户
-- 邮箱：demo@finsight.com
-- 密码：Demo123456!
-- 创建后，用户的 UUID 会自动生成

-- 假设新创建的演示账号 UUID 为：demo-user-uuid-here
-- 请在创建用户后，将下面的 'demo-user-uuid-here' 替换为实际的 UUID

-- ============================================================================
-- 第三部分：为演示账号创建持仓数据
-- ============================================================================

-- 设置演示账号的 user_id（请替换为实际的 UUID）
DO $$
DECLARE
  demo_user_id TEXT := 'demo-user-uuid-here'; -- 替换为实际的演示账号 UUID
BEGIN

  -- ============================================================================
  -- 纳斯达克持仓（80万）
  -- ============================================================================
  
  -- QQQ - 纳斯达克100 ETF (40万)
  INSERT INTO positions (user_id, asset_type, fund_code, fund_name, shares, cost_basis, current_price, purchase_date)
  VALUES (
    demo_user_id,
    'nasdaq',
    'QQQ',
    'Invesco QQQ Trust',
    2000.00,
    200.00,
    210.50,
    '2024-01-15'
  );

  -- TQQQ - 纳斯达克100三倍做多 ETF (20万)
  INSERT INTO positions (user_id, asset_type, fund_code, fund_name, shares, cost_basis, current_price, purchase_date)
  VALUES (
    demo_user_id,
    'nasdaq',
    'TQQQ',
    'ProShares UltraPro QQQ',
    3500.00,
    57.14,
    60.20,
    '2024-02-20'
  );

  -- QQQM - 纳斯达克100 ETF (小额版) (20万)
  INSERT INTO positions (user_id, asset_type, fund_code, fund_name, shares, cost_basis, current_price, purchase_date)
  VALUES (
    demo_user_id,
    'nasdaq',
    'QQQM',
    'Invesco NASDAQ 100 ETF',
    1200.00,
    166.67,
    175.30,
    '2024-03-10'
  );

  -- ============================================================================
  -- 黄金持仓（60万）
  -- ============================================================================
  
  -- GLD - SPDR黄金ETF (30万)
  INSERT INTO positions (user_id, asset_type, fund_code, fund_name, shares, cost_basis, current_price, purchase_date)
  VALUES (
    demo_user_id,
    'gold',
    'GLD',
    'SPDR Gold Shares',
    1500.00,
    200.00,
    208.50,
    '2023-11-20'
  );

  -- IAU - iShares黄金ETF (20万)
  INSERT INTO positions (user_id, asset_type, fund_code, fund_name, shares, cost_basis, current_price, purchase_date)
  VALUES (
    demo_user_id,
    'gold',
    'IAU',
    'iShares Gold Trust',
    4000.00,
    50.00,
    52.30,
    '2023-12-05'
  );

  -- GLDM - SPDR黄金迷你ETF (10万)
  INSERT INTO positions (user_id, asset_type, fund_code, fund_name, shares, cost_basis, current_price, purchase_date)
  VALUES (
    demo_user_id,
    'gold',
    'GLDM',
    'SPDR Gold MiniShares Trust',
    2000.00,
    50.00,
    52.10,
    '2024-01-08'
  );

  -- ============================================================================
  -- A股持仓（10万）
  -- ============================================================================
  
  -- 510300 - 沪深300ETF (5万)
  INSERT INTO positions (user_id, asset_type, fund_code, fund_name, shares, cost_basis, current_price, purchase_date)
  VALUES (
    demo_user_id,
    'astock',
    '510300',
    '华泰柏瑞沪深300ETF',
    12000.00,
    4.17,
    4.35,
    '2024-02-01'
  );

  -- 159915 - 创业板ETF (3万)
  INSERT INTO positions (user_id, asset_type, fund_code, fund_name, shares, cost_basis, current_price, purchase_date)
  VALUES (
    demo_user_id,
    'astock',
    '159915',
    '易方达创业板ETF',
    15000.00,
    2.00,
    2.08,
    '2024-02-15'
  );

  -- 510500 - 中证500ETF (2万)
  INSERT INTO positions (user_id, asset_type, fund_code, fund_name, shares, cost_basis, current_price, purchase_date)
  VALUES (
    demo_user_id,
    'astock',
    '510500',
    '南方中证500ETF',
    3000.00,
    6.67,
    6.95,
    '2024-03-01'
  );

  -- ============================================================================
  -- 基金配置数据
  -- ============================================================================
  
  -- 纳斯达克基金配置
  INSERT INTO fund_configs (user_id, asset_type, fund_code, fund_name, is_active)
  VALUES 
    (demo_user_id, 'nasdaq', 'QQQ', 'Invesco QQQ Trust', true),
    (demo_user_id, 'nasdaq', 'TQQQ', 'ProShares UltraPro QQQ', true),
    (demo_user_id, 'nasdaq', 'QQQM', 'Invesco NASDAQ 100 ETF', true);

  -- 黄金基金配置
  INSERT INTO fund_configs (user_id, asset_type, fund_code, fund_name, is_active)
  VALUES 
    (demo_user_id, 'gold', 'GLD', 'SPDR Gold Shares', true),
    (demo_user_id, 'gold', 'IAU', 'iShares Gold Trust', true),
    (demo_user_id, 'gold', 'GLDM', 'SPDR Gold MiniShares Trust', true);

  -- A股基金配置
  INSERT INTO fund_configs (user_id, asset_type, fund_code, fund_name, is_active)
  VALUES 
    (demo_user_id, 'astock', '510300', '华泰柏瑞沪深300ETF', true),
    (demo_user_id, 'astock', '159915', '易方达创业板ETF', true),
    (demo_user_id, 'astock', '510500', '南方中证500ETF', true);

  -- ============================================================================
  -- 定投计划（可选）
  -- ============================================================================
  
  -- 纳斯达克定投计划 - 每月1号投入5000元
  INSERT INTO auto_invest_plans (
    user_id, asset_type, fund_name, invest_amount, 
    frequency, invest_day, is_enabled, next_execution_date
  )
  VALUES (
    demo_user_id,
    'nasdaq',
    'Invesco QQQ Trust',
    5000.00,
    'monthly',
    1,
    true,
    '2026-03-01'
  );

  -- A股定投计划 - 每月15号投入2000元
  INSERT INTO auto_invest_plans (
    user_id, asset_type, fund_name, invest_amount, 
    frequency, invest_day, is_enabled, next_execution_date
  )
  VALUES (
    demo_user_id,
    'astock',
    '华泰柏瑞沪深300ETF',
    2000.00,
    'monthly',
    15,
    true,
    '2026-03-15'
  );

  RAISE NOTICE '演示账号数据创建完成！';
  RAISE NOTICE '总资产配置：';
  RAISE NOTICE '  - 纳斯达克：80万';
  RAISE NOTICE '  - 黄金：60万';
  RAISE NOTICE '  - A股：10万';
  RAISE NOTICE '  - 总计：150万';

END $$;

-- ============================================================================
-- 第四部分：验证数据
-- ============================================================================

-- 查询演示账号的持仓汇总
SELECT 
  asset_type,
  COUNT(*) as position_count,
  SUM(shares * current_price) as total_value
FROM positions
WHERE user_id = 'demo-user-uuid-here' -- 替换为实际的演示账号 UUID
GROUP BY asset_type
ORDER BY asset_type;

-- 查询演示账号的所有持仓明细
SELECT 
  asset_type,
  fund_code,
  fund_name,
  shares,
  cost_basis,
  current_price,
  (shares * current_price) as market_value,
  ((current_price - cost_basis) / cost_basis * 100) as return_pct,
  purchase_date
FROM positions
WHERE user_id = 'demo-user-uuid-here' -- 替换为实际的演示账号 UUID
ORDER BY asset_type, fund_code;

-- 完成！
