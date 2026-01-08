-- ============================================
-- 立即执行定投 - 简化版
-- 直接复制粘贴到 Supabase SQL Editor 运行
-- ============================================

-- 第一步：查看需要执行的定投计划
SELECT 
  fund_name as "基金名称",
  investment_amount as "当前持仓金额",
  auto_invest_amount as "定投金额",
  auto_invest_frequency as "频率",
  auto_invest_next_date as "下次执行日期",
  CASE 
    WHEN auto_invest_next_date <= CURRENT_DATE THEN '✅ 需要执行'
    ELSE '⏰ 未到期'
  END as "状态"
FROM positions
WHERE auto_invest_enabled = true
ORDER BY auto_invest_next_date;

-- 第二步：执行所有到期的定投
DO $$
DECLARE
  v_record RECORD;
  v_new_investment NUMERIC;
  v_next_date DATE;
  v_count INTEGER := 0;
BEGIN
  FOR v_record IN 
    SELECT 
      id,
      fund_name,
      investment_amount,
      auto_invest_amount,
      auto_invest_frequency
    FROM positions
    WHERE auto_invest_enabled = true
      AND auto_invest_next_date <= CURRENT_DATE
  LOOP
    -- 计算新的持仓金额
    v_new_investment := v_record.investment_amount + v_record.auto_invest_amount;

    -- 计算下次执行日期
    CASE v_record.auto_invest_frequency
      WHEN 'daily' THEN v_next_date := CURRENT_DATE + INTERVAL '1 day';
      WHEN 'weekly' THEN v_next_date := CURRENT_DATE + INTERVAL '7 days';
      WHEN 'monthly' THEN v_next_date := CURRENT_DATE + INTERVAL '1 month';
      WHEN 'quarterly' THEN v_next_date := CURRENT_DATE + INTERVAL '3 months';
      ELSE v_next_date := CURRENT_DATE + INTERVAL '1 month';
    END CASE;

    -- 更新持仓
    UPDATE positions
    SET 
      investment_amount = v_new_investment,
      auto_invest_last_executed_date = CURRENT_DATE,
      auto_invest_next_date = v_next_date,
      updated_at = NOW()
    WHERE id = v_record.id;

    v_count := v_count + 1;
    
    RAISE NOTICE '✅ %: ¥% + ¥% = ¥% (下次: %)',
      v_record.fund_name,
      v_record.investment_amount,
      v_record.auto_invest_amount,
      v_new_investment,
      v_next_date;
  END LOOP;

  IF v_count = 0 THEN
    RAISE NOTICE '⏰ 没有需要执行的定投计划';
  ELSE
    RAISE NOTICE '🎉 共执行了 % 个定投计划', v_count;
  END IF;
END $$;

-- 第三步：验证执行结果
SELECT 
  fund_name as "基金名称",
  investment_amount as "持仓金额",
  auto_invest_amount as "定投金额",
  auto_invest_last_executed_date as "上次执行",
  auto_invest_next_date as "下次执行",
  CASE 
    WHEN auto_invest_next_date <= CURRENT_DATE THEN '✅ 需要执行'
    ELSE '⏰ 未到期'
  END as "状态"
FROM positions
WHERE auto_invest_enabled = true
ORDER BY auto_invest_next_date;
