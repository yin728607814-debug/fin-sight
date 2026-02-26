-- ============================================================================
-- 创建演示用户的推荐方法
-- ============================================================================

-- 方法1：使用 Supabase Dashboard（推荐）
-- ============================================
-- 1. 登录 Supabase Dashboard: https://app.supabase.com
-- 2. 选择你的项目
-- 3. 进入 Authentication > Users
-- 4. 点击 "Add user" > "Create new user"
-- 5. 填写信息：
--    Email: demo@finsight.com
--    Password: Demo123456!
--    Auto Confirm User: ✅ (勾选这个，用户可以直接登录)
-- 6. 点击 "Create user"
-- 7. 复制新创建用户的 UUID（在用户列表中显示）
-- 8. 将 UUID 粘贴到下面的脚本中替换 'PASTE_UUID_HERE'

-- ============================================================================
-- 创建演示用户后，执行以下脚本创建持仓数据
-- ============================================================================

-- 设置演示用户的 UUID（从 Dashboard 复制）
DO $$
DECLARE
  demo_user_id TEXT := 'PASTE_UUID_HERE'; -- 👈 替换为实际的 UUID
BEGIN

  -- 验证 UUID 格式
  IF demo_user_id = 'PASTE_UUID_HERE' THEN
    RAISE EXCEPTION '请先将 demo_user_id 替换为实际的 UUID！';
  END IF;

  RAISE NOTICE '开始为用户 % 创建演示数据...', demo_user_id;

  -- ============================================================================
  -- 纳斯达克持仓（80万）
  -- ============================================================================
  
  RAISE NOTICE '创建纳斯达克持仓...';
  
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
  
  RAISE NOTICE '创建黄金持仓...';
  
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
  
  RAISE NOTICE '创建A股持仓...';
  
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
  
  RAISE NOTICE '创建基金配置...';
  
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
  
  RAISE NOTICE '创建定投计划...';
  
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

  RAISE NOTICE '✅ 演示账号数据创建完成！';
  RAISE NOTICE '总资产配置：';
  RAISE NOTICE '  - 纳斯达克：80万';
  RAISE NOTICE '  - 黄金：60万';
  RAISE NOTICE '  - A股：10万';
  RAISE NOTICE '  - 总计：150万';
  RAISE NOTICE '';
  RAISE NOTICE '现在可以使用以下账号登录：';
  RAISE NOTICE '  Email: demo@finsight.com';
  RAISE NOTICE '  Password: Demo123456!';

END $$;
