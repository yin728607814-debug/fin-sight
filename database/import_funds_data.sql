-- ============================================================================
-- 基金数据导入脚本
-- 在 Supabase SQL Editor 中执行此脚本
-- ============================================================================

-- 重要提示：请将下面的 'YOUR_USER_ID' 替换为你的实际用户ID
-- 获取方法：在浏览器控制台运行 localStorage.getItem('userId')

-- 设置用户ID变量（请修改这里）
DO $$
DECLARE
  v_user_id VARCHAR(255) := 'YOUR_USER_ID';  -- ⚠️ 请替换为你的实际用户ID
BEGIN

-- ============================================================================
-- 第一步：插入基金配置数据
-- ============================================================================

-- 插入纳斯达克基金配置（20个）
INSERT INTO fund_configs (user_id, name, fund_type)
VALUES
  (v_user_id, '摩根纳斯达克100指数(QDII)人民币A', 'nasdaq'),
  (v_user_id, '建信纳斯达克100指数QDII A', 'nasdaq'),
  (v_user_id, '南方纳斯达克100指数发起(QDII) A', 'nasdaq'),
  (v_user_id, '易方达全球成长精选混合人民币A类', 'nasdaq'),
  (v_user_id, '易方达全球成长精选混合人民币C类', 'nasdaq'),
  (v_user_id, '华安纳斯达克100ETF联接(QDII) A', 'nasdaq'),
  (v_user_id, '华安纳斯达克100ETF联接(QDII) C', 'nasdaq'),
  (v_user_id, '嘉实纳斯达克100联接(QDII)C人民币', 'nasdaq'),
  (v_user_id, '广发纳斯达克100ETF联接(QDII) A', 'nasdaq'),
  (v_user_id, '南方纳斯达克100指数发起(QDII) C', 'nasdaq'),
  (v_user_id, '大成纳斯达克100ETF联接(QDII)A', 'nasdaq'),
  (v_user_id, '华宝纳斯达克精选股票发起式(QDII) A', 'nasdaq'),
  (v_user_id, '景顺长城纳斯达克科技ETF联接A', 'nasdaq'),
  (v_user_id, '景顺长城纳斯达克科技ETF联接E', 'nasdaq'),
  (v_user_id, '景顺长城纳斯达克科技ETF联接C', 'nasdaq'),
  (v_user_id, '博时标普500ETF联接(QDII)A', 'nasdaq'),
  (v_user_id, '博时纳斯达克100A人名币', 'nasdaq'),
  (v_user_id, '华泰博瑞纳斯达克100ETF联接基金(QDII) A', 'nasdaq'),
  (v_user_id, '华宝纳斯达克精选股票发起式(QDII) C', 'nasdaq'),
  (v_user_id, '南方纳斯达克100指数发起(QDII) I', 'nasdaq')
ON CONFLICT DO NOTHING;

-- 插入A股基金配置（10个）
INSERT INTO fund_configs (user_id, name, fund_type)
VALUES
  (v_user_id, '前海开源嘉鑫灵活配置混合C', 'astock'),
  (v_user_id, '长城久嘉创新成长灵活配置混合C', 'astock'),
  (v_user_id, '汇添富中证电池主题ETF联接C', 'astock'),
  (v_user_id, '国投瑞银白银期货(LOF)C', 'astock'),
  (v_user_id, '永赢高端设备智选混合C', 'astock'),
  (v_user_id, '华夏有色金属ETF联接C', 'astock'),
  (v_user_id, '永赢科技智选混合C', 'astock'),
  (v_user_id, '华安黄金ETF联接C', 'astock'),
  (v_user_id, '永赢半导体产业智选混合C', 'astock'),
  (v_user_id, '天弘中证光伏产业指数C', 'astock')
ON CONFLICT DO NOTHING;

RAISE NOTICE '✓ 基金配置导入完成：纳斯达克 20 个，A股 10 个';

-- ============================================================================
-- 第二步：插入投资组合持仓数据
-- ============================================================================

-- 插入纳斯达克持仓（20个）
-- 格式：当前金额 | 盈亏 → 投资金额 = 当前金额 - 盈亏
INSERT INTO positions (user_id, asset_type, fund_name, investment_amount, profit_loss)
VALUES
  (v_user_id, 'nasdaq', '摩根纳斯达克100指数(QDII)人民币A', 51450.00, -335.90),
  (v_user_id, 'nasdaq', '建信纳斯达克100指数QDII A', 36300.00, -536.06),
  (v_user_id, 'nasdaq', '南方纳斯达克100指数发起(QDII) A', 31350.00, 252.65),
  (v_user_id, 'nasdaq', '易方达全球成长精选混合人民币A类', 21000.00, 387.06),
  (v_user_id, 'nasdaq', '易方达全球成长精选混合人民币C类', 20000.00, 374.38),
  (v_user_id, 'nasdaq', '华安纳斯达克100ETF联接(QDII) A', 13830.00, -7.09),
  (v_user_id, 'nasdaq', '华安纳斯达克100ETF联接(QDII) C', 12260.00, -64.01),
  (v_user_id, 'nasdaq', '嘉实纳斯达克100联接(QDII)C人民币', 11800.00, -261.96),
  (v_user_id, 'nasdaq', '广发纳斯达克100ETF联接(QDII) A', 9820.00, 245.86),
  (v_user_id, 'nasdaq', '南方纳斯达克100指数发起(QDII) C', 10150.00, -87.10),
  (v_user_id, 'nasdaq', '大成纳斯达克100ETF联接(QDII)A', 4000.00, 45.87),
  (v_user_id, 'nasdaq', '华宝纳斯达克精选股票发起式(QDII) A', 3750.00, -82.10),
  (v_user_id, 'nasdaq', '景顺长城纳斯达克科技ETF联接A', 3500.00, -12.43),
  (v_user_id, 'nasdaq', '景顺长城纳斯达克科技ETF联接E', 3100.00, -3.51),
  (v_user_id, 'nasdaq', '景顺长城纳斯达克科技ETF联接C', 2400.00, 7.31),
  (v_user_id, 'nasdaq', '博时标普500ETF联接(QDII)A', 1900.00, 58.57),
  (v_user_id, 'nasdaq', '博时纳斯达克100A人名币', 1600.00, 60.16),
  (v_user_id, 'nasdaq', '华泰博瑞纳斯达克100ETF联接基金(QDII) A', 1600.00, 20.34),
  (v_user_id, 'nasdaq', '华宝纳斯达克精选股票发起式(QDII) C', 1300.00, -3.38),
  (v_user_id, 'nasdaq', '南方纳斯达克100指数发起(QDII) I', 30000.00, 34.15)
ON CONFLICT DO NOTHING;

-- 插入A股持仓（10个）
INSERT INTO positions (user_id, asset_type, fund_name, investment_amount, profit_loss)
VALUES
  (v_user_id, 'astock', '前海开源嘉鑫灵活配置混合C', 6600.00, 628.14),
  (v_user_id, 'astock', '长城久嘉创新成长灵活配置混合C', 3700.00, 399.07),
  (v_user_id, 'astock', '汇添富中证电池主题ETF联接C', 3800.00, 64.75),
  (v_user_id, 'astock', '国投瑞银白银期货(LOF)C', 600.00, 21.01),
  (v_user_id, 'astock', '永赢高端设备智选混合C', 3100.00, 0.00),
  (v_user_id, 'astock', '华夏有色金属ETF联接C', 600.00, 0.00),
  (v_user_id, 'astock', '永赢科技智选混合C', 3800.00, -7.70),
  (v_user_id, 'astock', '华安黄金ETF联接C', 800.40, -15.34),
  (v_user_id, 'astock', '永赢半导体产业智选混合C', 3800.00, -25.27),
  (v_user_id, 'astock', '天弘中证光伏产业指数C', 3100.00, -61.03)
ON CONFLICT DO NOTHING;

RAISE NOTICE '✓ 持仓数据导入完成：纳斯达克 20 个，A股 10 个';

-- ============================================================================
-- 第三步：验证导入结果
-- ============================================================================

-- 查看基金配置统计
RAISE NOTICE '--- 基金配置统计 ---';
PERFORM 
  CASE 
    WHEN fund_type = 'nasdaq' THEN '纳斯达克'
    WHEN fund_type = 'astock' THEN 'A股'
  END || ': ' || COUNT(*) || ' 个'
FROM fund_configs
WHERE user_id = v_user_id
GROUP BY fund_type;

-- 查看持仓统计
RAISE NOTICE '--- 持仓统计 ---';
PERFORM 
  CASE 
    WHEN asset_type = 'nasdaq' THEN '纳斯达克'
    WHEN asset_type = 'astock' THEN 'A股'
  END || ': ' || COUNT(*) || ' 个, 投资: ¥' || 
  ROUND(SUM(investment_amount), 2) || ', 盈亏: ¥' || 
  ROUND(SUM(profit_loss), 2)
FROM positions
WHERE user_id = v_user_id
GROUP BY asset_type;

END $$;

-- ============================================================================
-- 查询验证（可选）
-- ============================================================================

-- 查看导入的基金配置
SELECT 
  fund_type as "类型",
  COUNT(*) as "数量"
FROM fund_configs
WHERE user_id = 'YOUR_USER_ID'  -- ⚠️ 请替换
GROUP BY fund_type
ORDER BY fund_type;

-- 查看导入的持仓
SELECT 
  asset_type as "资产类型",
  COUNT(*) as "持仓数",
  ROUND(SUM(investment_amount), 2) as "总投资",
  ROUND(SUM(profit_loss), 2) as "总盈亏",
  ROUND(SUM(profit_loss) / SUM(investment_amount) * 100, 2) as "收益率%"
FROM positions
WHERE user_id = 'YOUR_USER_ID'  -- ⚠️ 请替换
GROUP BY asset_type
ORDER BY asset_type;

-- 完成！
-- 导入完成后，请访问以下页面验证：
-- 1. /fund-config - 查看基金配置
-- 2. /portfolio - 查看投资组合
