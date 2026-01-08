-- ============================================
-- 手动执行定投计划 SQL 脚本
-- ============================================

-- 第一步：检查当前定投计划状态
-- ============================================

-- 1.1 查看所有启用的定投计划（从 positions 表）
SELECT 
  id,
  fund_name as "基金名称",
  asset_type as "类型",
  investment_amount as "当前持仓金额",
  auto_invest_enabled as "定投启用",
  auto_invest_amount as "定投金额",
  auto_invest_frequency as "定投频率",
  auto_invest_next_date as "下次定投日期",
  auto_invest_last_executed_date as "上次执行日期",
  CASE 
    WHEN auto_invest_next_date <= CURRENT_DATE THEN '需要执行'
    ELSE '未到期'
  END as "状态"
FROM positions
WHERE auto_invest_enabled = true
ORDER BY auto_invest_next_date;

-- 1.2 查看 auto_invest_plans 表（如果存在）
SELECT 
  id,
  fund_name as "基金名称",
  asset_type as "类型",
  invest_amount as "定投金额",
  frequency as "频率",
  is_enabled as "启用",
  next_execution_date as "下次执行日期",
  last_execution_date as "上次执行日期",
  CASE 
    WHEN next_execution_date <= CURRENT_DATE THEN '需要执行'
    ELSE '未到期'
  END as "状态"
FROM auto_invest_plans
WHERE is_enabled = true
ORDER BY next_execution_date;


-- 第二步：手动执行定投（更新持仓金额）
-- ============================================
-- 注意：请根据实际情况修改以下参数：
-- - {position_id}: 持仓ID
-- - {auto_invest_amount}: 定投金额

-- 2.1 执行单个定投（示例）
-- 请将 {position_id} 替换为实际的持仓ID
/*
DO $$
DECLARE
  v_position_id UUID := '{position_id}'; -- 替换为实际ID
  v_auto_invest_amount NUMERIC;
  v_current_investment NUMERIC;
  v_current_value NUMERIC;
  v_new_investment NUMERIC;
  v_new_value NUMERIC;
  v_frequency TEXT;
  v_next_date DATE;
BEGIN
  -- 获取当前持仓信息
  SELECT 
    investment_amount,
    current_value,
    auto_invest_amount,
    auto_invest_frequency
  INTO 
    v_current_investment,
    v_current_value,
    v_auto_invest_amount,
    v_frequency
  FROM positions
  WHERE id = v_position_id AND auto_invest_enabled = true;

  -- 检查是否找到记录
  IF NOT FOUND THEN
    RAISE NOTICE '未找到启用定投的持仓记录';
    RETURN;
  END IF;

  -- 计算新的金额
  v_new_investment := v_current_investment + v_auto_invest_amount;
  v_new_value := COALESCE(v_current_value, v_current_investment) + v_auto_invest_amount;

  -- 计算下次执行日期
  CASE v_frequency
    WHEN 'daily' THEN
      v_next_date := CURRENT_DATE + INTERVAL '1 day';
    WHEN 'weekly' THEN
      v_next_date := CURRENT_DATE + INTERVAL '7 days';
    WHEN 'monthly' THEN
      v_next_date := CURRENT_DATE + INTERVAL '1 month';
    WHEN 'quarterly' THEN
      v_next_date := CURRENT_DATE + INTERVAL '3 months';
    ELSE
      v_next_date := CURRENT_DATE + INTERVAL '1 month';
  END CASE;

  -- 更新持仓
  UPDATE positions
  SET 
    investment_amount = v_new_investment,
    current_value = v_new_value,
    auto_invest_last_executed_date = CURRENT_DATE,
    auto_invest_next_date = v_next_date,
    updated_at = NOW()
  WHERE id = v_position_id;

  RAISE NOTICE '定投执行成功！';
  RAISE NOTICE '原持仓金额: %, 定投金额: %, 新持仓金额: %', 
    v_current_investment, v_auto_invest_amount, v_new_investment;
  RAISE NOTICE '下次执行日期: %', v_next_date;
END $$;
*/


-- 第三步：批量执行所有到期的定投
-- ============================================

-- 3.1 批量执行所有到期的定投计划
DO $$
DECLARE
  v_record RECORD;
  v_new_investment NUMERIC;
  v_new_value NUMERIC;
  v_next_date DATE;
  v_count INTEGER := 0;
BEGIN
  -- 遍历所有到期的定投计划
  FOR v_record IN 
    SELECT 
      id,
      fund_name,
      investment_amount,
      current_value,
      auto_invest_amount,
      auto_invest_frequency
    FROM positions
    WHERE auto_invest_enabled = true
      AND auto_invest_next_date <= CURRENT_DATE
  LOOP
    -- 计算新的金额
    v_new_investment := v_record.investment_amount + v_record.auto_invest_amount;
    v_new_value := COALESCE(v_record.current_value, v_record.investment_amount) + v_record.auto_invest_amount;

    -- 计算下次执行日期
    CASE v_record.auto_invest_frequency
      WHEN 'daily' THEN
        v_next_date := CURRENT_DATE + INTERVAL '1 day';
      WHEN 'weekly' THEN
        v_next_date := CURRENT_DATE + INTERVAL '7 days';
      WHEN 'monthly' THEN
        v_next_date := CURRENT_DATE + INTERVAL '1 month';
      WHEN 'quarterly' THEN
        v_next_date := CURRENT_DATE + INTERVAL '3 months';
      ELSE
        v_next_date := CURRENT_DATE + INTERVAL '1 month';
    END CASE;

    -- 更新持仓
    UPDATE positions
    SET 
      investment_amount = v_new_investment,
      current_value = v_new_value,
      auto_invest_last_executed_date = CURRENT_DATE,
      auto_invest_next_date = v_next_date,
      updated_at = NOW()
    WHERE id = v_record.id;

    v_count := v_count + 1;
    
    RAISE NOTICE '执行定投: % - 原金额: %, 定投: %, 新金额: %, 下次: %',
      v_record.fund_name,
      v_record.investment_amount,
      v_record.auto_invest_amount,
      v_new_investment,
      v_next_date;
  END LOOP;

  IF v_count = 0 THEN
    RAISE NOTICE '没有需要执行的定投计划';
  ELSE
    RAISE NOTICE '共执行了 % 个定投计划', v_count;
  END IF;
END $$;


-- 第四步：验证执行结果
-- ============================================

-- 4.1 查看更新后的定投状态
SELECT 
  fund_name as "基金名称",
  asset_type as "类型",
  investment_amount as "持仓金额",
  auto_invest_amount as "定投金额",
  auto_invest_last_executed_date as "上次执行",
  auto_invest_next_date as "下次执行",
  CASE 
    WHEN auto_invest_next_date <= CURRENT_DATE THEN '需要执行'
    ELSE '未到期'
  END as "状态"
FROM positions
WHERE auto_invest_enabled = true
ORDER BY auto_invest_next_date;


-- 第五步：手动设置下次执行日期（如果需要）
-- ============================================

-- 5.1 将所有定投计划的下次执行日期设置为明天
/*
UPDATE positions
SET 
  auto_invest_next_date = CURRENT_DATE + INTERVAL '1 day',
  updated_at = NOW()
WHERE auto_invest_enabled = true;
*/

-- 5.2 将特定持仓的下次执行日期设置为指定日期
/*
UPDATE positions
SET 
  auto_invest_next_date = '2026-01-09', -- 替换为实际日期
  updated_at = NOW()
WHERE id = '{position_id}'; -- 替换为实际ID
*/


-- ============================================
-- 问题排查
-- ============================================

-- 检查是否有定投计划但下次执行日期为空
SELECT 
  id,
  fund_name,
  auto_invest_enabled,
  auto_invest_amount,
  auto_invest_next_date
FROM positions
WHERE auto_invest_enabled = true
  AND auto_invest_next_date IS NULL;

-- 检查定投频率分布
SELECT 
  auto_invest_frequency as "定投频率",
  COUNT(*) as "数量"
FROM positions
WHERE auto_invest_enabled = true
GROUP BY auto_invest_frequency;
