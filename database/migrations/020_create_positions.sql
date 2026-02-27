-- 创建持仓表
CREATE TABLE IF NOT EXISTS public.positions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id character varying NOT NULL,
  asset_type character varying NOT NULL CHECK (asset_type IN ('nasdaq', 'gold', 'astock')),
  fund_name character varying,
  quantity numeric,
  average_buy_price numeric,
  investment_amount numeric NOT NULL,
  profit_loss numeric NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('Asia/Shanghai'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('Asia/Shanghai'::text, now()),
  auto_invest_enabled boolean DEFAULT false,
  auto_invest_amount numeric,
  auto_invest_frequency character varying,
  auto_invest_start_date timestamp with time zone,
  auto_invest_next_date timestamp with time zone,
  auto_invest_last_executed_date timestamp with time zone,
  daily_profit_loss numeric,
  daily_change numeric,
  manual_daily_return numeric,
  fund_code text,
  profit_loss_percent numeric DEFAULT 0,
  CONSTRAINT positions_pkey PRIMARY KEY (id)
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_positions_user_id ON public.positions(user_id);
CREATE INDEX IF NOT EXISTS idx_positions_user_asset ON public.positions(user_id, asset_type);
CREATE INDEX IF NOT EXISTS idx_positions_created_at ON public.positions(created_at DESC);

-- 启用 RLS
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略：用户只能查看自己的持仓
CREATE POLICY "Users can view own positions"
  ON public.positions
  FOR SELECT
  USING (auth.uid()::text = user_id);

-- 创建 RLS 策略：用户只能插入自己的持仓
CREATE POLICY "Users can insert own positions"
  ON public.positions
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

-- 创建 RLS 策略：用户只能更新自己的持仓
CREATE POLICY "Users can update own positions"
  ON public.positions
  FOR UPDATE
  USING (auth.uid()::text = user_id);

-- 创建 RLS 策略：用户只能删除自己的持仓
CREATE POLICY "Users can delete own positions"
  ON public.positions
  FOR DELETE
  USING (auth.uid()::text = user_id);

-- 添加注释
COMMENT ON TABLE public.positions IS '投资组合持仓表';
COMMENT ON COLUMN public.positions.user_id IS '用户ID';
COMMENT ON COLUMN public.positions.asset_type IS '资产类型：nasdaq/gold/astock';
COMMENT ON COLUMN public.positions.fund_name IS '基金名称';
COMMENT ON COLUMN public.positions.quantity IS '持仓数量';
COMMENT ON COLUMN public.positions.average_buy_price IS '平均买入价格';
COMMENT ON COLUMN public.positions.investment_amount IS '投资金额';
COMMENT ON COLUMN public.positions.profit_loss IS '盈亏金额';
COMMENT ON COLUMN public.positions.daily_profit_loss IS '当日盈亏';
COMMENT ON COLUMN public.positions.daily_change IS '当日涨跌幅';
COMMENT ON COLUMN public.positions.profit_loss_percent IS '盈亏百分比';
