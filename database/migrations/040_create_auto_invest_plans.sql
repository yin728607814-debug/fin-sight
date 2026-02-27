-- 创建定投计划表
CREATE TABLE IF NOT EXISTS public.auto_invest_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id character varying NOT NULL,
  asset_type character varying NOT NULL CHECK (asset_type IN ('nasdaq', 'astock')),
  fund_name character varying NOT NULL,
  invest_amount numeric NOT NULL CHECK (invest_amount > 0),
  frequency character varying NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  invest_day integer CHECK (invest_day IS NULL OR (invest_day >= 1 AND invest_day <= 28)),
  is_enabled boolean DEFAULT true,
  next_execution_date date,
  last_execution_date date,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT auto_invest_plans_pkey PRIMARY KEY (id)
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_auto_invest_plans_user_id ON public.auto_invest_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_auto_invest_plans_user_asset ON public.auto_invest_plans(user_id, asset_type);
CREATE INDEX IF NOT EXISTS idx_auto_invest_plans_enabled ON public.auto_invest_plans(is_enabled, next_execution_date);
CREATE INDEX IF NOT EXISTS idx_auto_invest_plans_created_at ON public.auto_invest_plans(created_at DESC);

-- 启用 RLS
ALTER TABLE public.auto_invest_plans ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略：用户只能查看自己的定投计划
CREATE POLICY "Users can view own auto invest plans"
  ON public.auto_invest_plans
  FOR SELECT
  USING (auth.uid()::text = user_id);

-- 创建 RLS 策略：用户只能插入自己的定投计划
CREATE POLICY "Users can insert own auto invest plans"
  ON public.auto_invest_plans
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

-- 创建 RLS 策略：用户只能更新自己的定投计划
CREATE POLICY "Users can update own auto invest plans"
  ON public.auto_invest_plans
  FOR UPDATE
  USING (auth.uid()::text = user_id);

-- 创建 RLS 策略：用户只能删除自己的定投计划
CREATE POLICY "Users can delete own auto invest plans"
  ON public.auto_invest_plans
  FOR DELETE
  USING (auth.uid()::text = user_id);

-- 添加注释
COMMENT ON TABLE public.auto_invest_plans IS '定投计划表';
COMMENT ON COLUMN public.auto_invest_plans.user_id IS '用户ID';
COMMENT ON COLUMN public.auto_invest_plans.asset_type IS '资产类型：nasdaq/astock';
COMMENT ON COLUMN public.auto_invest_plans.fund_name IS '基金名称';
COMMENT ON COLUMN public.auto_invest_plans.invest_amount IS '定投金额';
COMMENT ON COLUMN public.auto_invest_plans.frequency IS '定投频率：daily/weekly/monthly';
COMMENT ON COLUMN public.auto_invest_plans.invest_day IS '定投日期（周几或几号）';
COMMENT ON COLUMN public.auto_invest_plans.is_enabled IS '是否启用';
COMMENT ON COLUMN public.auto_invest_plans.next_execution_date IS '下次执行日期';
COMMENT ON COLUMN public.auto_invest_plans.last_execution_date IS '上次执行日期';
