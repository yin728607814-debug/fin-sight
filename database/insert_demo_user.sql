-- ============================================================================
-- 创建演示账号数据
-- 基于真实基金配置，按照150万总资产分配
-- ============================================================================

-- 演示账号 UUID: 29113055-18d5-4094-8786-5e603b04c876
-- Email: demo@finsight.com
-- Password: Demo123456!

DO $$
DECLARE
  demo_user_id TEXT := '29113055-18d5-4094-8786-5e603b04c876';
BEGIN

  RAISE NOTICE '开始为演示账号创建数据...';
  RAISE NOTICE '用户 ID: %', demo_user_id;

  -- ============================================================================
  -- 纳斯达克持仓（80万）- 基于真实基金配置
  -- ============================================================================
  
  RAISE NOTICE '创建纳斯达克持仓（80万）...';
  
  -- 摩根纳斯达克100指数(QDII)人民币A (15万)
  INSERT INTO positions (user_id, asset_type, fund_name, shares, cost_basis, current_price, purchase_date)
  VALUES (
    demo_user_id,
    'nasdaq',
    '摩根纳斯达克100指数(QDII)人民币A',
    10000.00,
    14.50,
    15.00,
    '2024-01-15'
  );

  -- 建信纳斯达克100指数QDII A (12万)
  INSERT INTO positions (user_id, asset_type, fund_name, shares, cost_basis, current_price, purchase_date)
  VALUES (
    demo_user_id,
    'nasdaq',
    '建信纳斯达克100指数QDII A',
    8000.00,
    14.80,
    15.00,
    '2024-01-20'
  );

  -- 南方纳斯达克100指数发起(QDII) A (10万)
  INSERT INTO positions (user_id, asset_type, fund_name, shares, cost_basis, current_price, purchase_date)
  VALUES (
    demo_user_id,
    'nasdaq',
    '南方纳斯达克100指数发起(QDII) A',
    6500.00,
    15.20,
    15.38,
    '2024-02-01'
  );

  -- 易方达全球成长精选混合人民币A类 (8万)
  INSERT INTO positions (user_id, asset_type, fund_name, shares, cost_basis, current_price, purchase_date)
  VALUES (
    demo_user_id,
    'nasdaq',
    '易方达全球成长精选混合人民币A类',
    5000.00,
    15.80,
    16.00,
    '2024-02-10'
  );

  -- 易方达全球成长精选混合人民币C类 (7万)
  INSERT INTO positions (user_id, asset_type, fund_name, shares, cost_basis, current_price, purchase_date)
  VALUES (
    demo_user_id,
    'nasdaq',
    '易方达全球成长精选混合人民币C类',
    4400.00,
    15.70,
    15.91,
    '2024-02-15'
  );

  -- 华安纳斯达克100ETF联接(QDII) A (6万)
  INSERT INTO positions (user_id, asset_type, fund_name, shares, cost_basis, current_price, purchase_date)
  VALUES (
    demo_user_id,
    'nasdaq',
    '华安纳斯达克100ETF联接(QDII) A',
    4000.00,
    14.90,
    15.00,
    '2024-02-20'
  );

  -- 华安纳斯达克100ETF联接(QDII) C (5万)
  INSERT INTO positions (user_id, asset_type, fund_name, shares, cost_basis, current_price, purchase_date)
  VALUES (
    demo_user_id,
    'nasdaq',
    '华安纳斯达克100ETF联接(QDII) C',
    3300.00,
    15.00,
    15.15,
    '2024-02-25'
  );

  -- 嘉实纳斯达克100联接(QDII)C人民币 (4万)
  INSERT INTO positions (user_id, asset_type, fund_name, shares, cost_basis, current_price, purchase_date)
  VALUES (
    demo_user_id,
    'nasdaq',
    '嘉实纳斯达克100联接(QDII)C人民币',
    2700.00,
    14.60,
    14.81,
    '2024-03-01'
  );

  -- 广发纳斯达克100ETF联接(QDII) A (4万)
  INSERT INTO positions (user_id, asset_type, fund_name, shares, cost_basis, current_price, purchase_date)
  VALUES (
    demo_user_id,
    'nasdaq',
    '广发纳斯达克100ETF联接(QDII) A',
    2600.00,
    15.20,
    15.38,
    '2024-03-05'
  );

  -- 南方纳斯达克100指数发起(QDII) C (3万)
  INSERT INTO positions (user_id, asset_type, fund_name, shares, cost_basis, current_price, purchase_date)
  VALUES (
    demo_user_id,
    'nasdaq',
    '南方纳斯达克100指数发起(QDII) C',
    2000.00,
    14.90,
    15.00,
    '2024-03-10'
  );

  -- 大成纳斯达克100ETF联接(QDII)A (2万)
  INSERT INTO positions (user_id, asset_type, fund_name, shares, cost_basis, current_price, purchase_date)
  VALUES (
    demo_user_id,
    'nasdaq',
    '大成纳斯达克100ETF联接(QDII)A',
    1300.00,
    15.20,
    15.38,
    '2024-03-15'
  );

  -- 华宝纳斯达克精选股票发起式(QDII) A (2万)
  INSERT INTO positions (user_id, asset_type, fund_name, shares, cost_basis, current_price, purchase_date)
  VALUES (
    demo_user_id,
    'nasdaq',
    '华宝纳斯达克精选股票发起式(QDII) A',
    1400.00,
    14.10,
    14.29,
    '2024-03-20'
  );

  -- 景顺长城纳斯达克科技ETF联接A (2万)
  INSERT INTO positions (user_id, asset_type, fund_name, shares, cost_basis, current_price, purchase_date)
  VALUES (
    demo_user_id,
    'nasdaq',
    '景顺长城纳斯达克科技ETF联接A',
    1300.00,
    15.20,
    15.38,
    '2024-03-25'
  );

  -- ============================================================================
  -- 黄金持仓（60万）- 现货黄金（按克计算）
  -- ============================================================================
  
  RAISE NOTICE '创建黄金持仓（60万）...';
  
  -- 现货黄金 (60万 ÷ 979.31元/克 ≈ 612.7克)
  -- 模拟持仓金额: 600,000元
  -- 持仓克数: 612.7660克
  -- 持仓均价: 979.31元/克
  INSERT INTO positions (user_id, asset_type, fund_name, shares, cost_basis, current_price, purchase_date)
  VALUES (
    demo_user_id,
    'gold',
    '现货黄金',
    612.7660,
    979.31,
    979.31,
    '2023-11-20'
  );

  -- ============================================================================
  -- A股持仓（10万）- 基于真实基金配置
  -- ============================================================================
  
  RAISE NOTICE '创建A股持仓（10万）...';
  
  -- 前海开源嘉鑫灵活配置混合C (2.5万)
  INSERT INTO positions (user_id, asset_type, fund_name, shares, cost_basis, current_price, purchase_date)
  VALUES (
    demo_user_id,
    'astock',
    '前海开源嘉鑫灵活配置混合C',
    20000.00,
    1.22,
    1.25,
    '2024-01-10'
  );

  -- 长城久嘉创新成长灵活配置混合C (1.5万)
  INSERT INTO positions (user_id, asset_type, fund_name, shares, cost_basis, current_price, purchase_date)
  VALUES (
    demo_user_id,
    'astock',
    '长城久嘉创新成长灵活配置混合C',
    12000.00,
    1.23,
    1.25,
    '2024-01-15'
  );

  -- 汇添富中证电池主题ETF联接C (1.5万)
  INSERT INTO positions (user_id, asset_type, fund_name, shares, cost_basis, current_price, purchase_date)
  VALUES (
    demo_user_id,
    'astock',
    '汇添富中证电池主题ETF联接C',
    15000.00,
    0.98,
    1.00,
    '2024-01-20'
  );

  -- 永赢高端设备智选混合C (1.2万)
  INSERT INTO positions (user_id, asset_type, fund_name, shares, cost_basis, current_price, purchase_date)
  VALUES (
    demo_user_id,
    'astock',
    '永赢高端设备智选混合C',
    10000.00,
    1.18,
    1.20,
    '2024-02-01'
  );

  -- 永赢科技智选混合C (1万)
  INSERT INTO positions (user_id, asset_type, fund_name, shares, cost_basis, current_price, purchase_date)
  VALUES (
    demo_user_id,
    'astock',
    '永赢科技智选混合C',
    8500.00,
    1.16,
    1.18,
    '2024-02-05'
  );

  -- 永赢半导体产业智选混合C (1万)
  INSERT INTO positions (user_id, asset_type, fund_name, shares, cost_basis, current_price, purchase_date)
  VALUES (
    demo_user_id,
    'astock',
    '永赢半导体产业智选混合C',
    8300.00,
    1.19,
    1.20,
    '2024-02-10'
  );

  -- 天弘中证光伏产业指数C (8000)
  INSERT INTO positions (user_id, asset_type, fund_name, shares, cost_basis, current_price, purchase_date)
  VALUES (
    demo_user_id,
    'astock',
    '天弘中证光伏产业指数C',
    10000.00,
    0.78,
    0.80,
    '2024-02-15'
  );

  -- 华夏有色金属ETF联接C (5000)
  INSERT INTO positions (user_id, asset_type, fund_name, shares, cost_basis, current_price, purchase_date)
  VALUES (
    demo_user_id,
    'astock',
    '华夏有色金属ETF联接C',
    5000.00,
    0.98,
    1.00,
    '2024-02-20'
  );

  -- 国投瑞银白银期货(LOF)C (3000)
  INSERT INTO positions (user_id, asset_type, fund_name, shares, cost_basis, current_price, purchase_date)
  VALUES (
    demo_user_id,
    'astock',
    '国投瑞银白银期货(LOF)C',
    3000.00,
    0.98,
    1.00,
    '2024-02-25'
  );

  -- ============================================================================
  -- 基金配置数据
  -- ============================================================================
  
  RAISE NOTICE '创建基金配置...';
  
  -- 纳斯达克基金配置
  INSERT INTO fund_configs (user_id, asset_type, fund_name, is_active)
  VALUES 
    (demo_user_id, 'nasdaq', '摩根纳斯达克100指数(QDII)人民币A', true),
    (demo_user_id, 'nasdaq', '建信纳斯达克100指数QDII A', true),
    (demo_user_id, 'nasdaq', '南方纳斯达克100指数发起(QDII) A', true),
    (demo_user_id, 'nasdaq', '易方达全球成长精选混合人民币A类', true),
    (demo_user_id, 'nasdaq', '易方达全球成长精选混合人民币C类', true),
    (demo_user_id, 'nasdaq', '华安纳斯达克100ETF联接(QDII) A', true),
    (demo_user_id, 'nasdaq', '华安纳斯达克100ETF联接(QDII) C', true),
    (demo_user_id, 'nasdaq', '嘉实纳斯达克100联接(QDII)C人民币', true),
    (demo_user_id, 'nasdaq', '广发纳斯达克100ETF联接(QDII) A', true),
    (demo_user_id, 'nasdaq', '南方纳斯达克100指数发起(QDII) C', true),
    (demo_user_id, 'nasdaq', '大成纳斯达克100ETF联接(QDII)A', true),
    (demo_user_id, 'nasdaq', '华宝纳斯达克精选股票发起式(QDII) A', true),
    (demo_user_id, 'nasdaq', '景顺长城纳斯达克科技ETF联接A', true);

  -- 黄金基金配置（现货黄金不需要fund_configs）
  -- 现货黄金直接在positions表中记录

  -- A股基金配置
  INSERT INTO fund_configs (user_id, asset_type, fund_name, is_active)
  VALUES 
    (demo_user_id, 'astock', '前海开源嘉鑫灵活配置混合C', true),
    (demo_user_id, 'astock', '长城久嘉创新成长灵活配置混合C', true),
    (demo_user_id, 'astock', '汇添富中证电池主题ETF联接C', true),
    (demo_user_id, 'astock', '永赢高端设备智选混合C', true),
    (demo_user_id, 'astock', '永赢科技智选混合C', true),
    (demo_user_id, 'astock', '永赢半导体产业智选混合C', true),
    (demo_user_id, 'astock', '天弘中证光伏产业指数C', true),
    (demo_user_id, 'astock', '华夏有色金属ETF联接C', true),
    (demo_user_id, 'astock', '国投瑞银白银期货(LOF)C', true);

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
    '南方纳斯达克100指数发起(QDIQ) A',
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
    '前海开源嘉鑫灵活配置混合C',
    2000.00,
    'monthly',
    15,
    true,
    '2026-03-15'
  );

  RAISE NOTICE '✅ 演示账号数据创建完成！';
  RAISE NOTICE '';
  RAISE NOTICE '总资产配置：';
  RAISE NOTICE '  - 纳斯达克：80万（13个基金）';
  RAISE NOTICE '  - 黄金：60万（现货黄金 612.77克）';
  RAISE NOTICE '  - A股：10万（9个基金）';
  RAISE NOTICE '  - 总计：150万';
  RAISE NOTICE '';
  RAISE NOTICE '登录信息：';
  RAISE NOTICE '  Email: demo@finsight.com';
  RAISE NOTICE '  Password: Demo123456!';

END $$;

-- ============================================================================
-- 验证数据
-- ============================================================================

-- 查询演示账号的持仓汇总
SELECT 
  asset_type,
  COUNT(*) as position_count,
  SUM(shares * current_price) as total_value
FROM positions
WHERE user_id = '29113055-18d5-4094-8786-5e603b04c876'
GROUP BY asset_type
ORDER BY asset_type;

-- 查询演示账号的所有持仓明细
SELECT 
  asset_type,
  fund_name,
  shares,
  cost_basis,
  current_price,
  (shares * current_price) as market_value,
  ((current_price - cost_basis) / cost_basis * 100) as return_pct,
  purchase_date
FROM positions
WHERE user_id = '29113055-18d5-4094-8786-5e603b04c876'
ORDER BY asset_type, (shares * current_price) DESC;

-- 完成！
