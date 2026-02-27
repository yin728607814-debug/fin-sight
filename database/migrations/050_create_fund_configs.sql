-- 创建基金配置表
CREATE TABLE IF NOT EXISTS public.fund_configs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id character varying NOT NULL,
  name character varying NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('Asia/Shanghai'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('Asia/Shanghai'::text, now()),
  fund_type character varying DEFAULT 'nasdaq' CHECK (fund_type IN ('nasdaq', 'astock')),
  fund_code text,
  CONSTRAINT fund_configs_pkey PRIMARY KEY (id)
);

-- 创建唯一约束：每个用户的基金名称唯一
CREATE UNIQUE INDEX IF NOT EXISTS idx_fund_configs_user_name 
  ON public.fund_configs(user_id, name);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_fund_configs_user_id ON public.fund_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_fund_configs_fund_type ON public.fund_configs(fund_type);
CREATE INDEX IF NOT EXISTS idx_fund_configs_created_at ON public.fund_configs(created_at DESC);

-- 启用 RLS
ALTER TABLE public.fund_configs ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略：用户只能查看自己的基金配置
CREATE POLICY "Users can view own fund configs"
  ON public.fund_configs
  FOR SELECT
  USING (auth.uid()::text = user_id);

-- 创建 RLS 策略：用户只能插入自己的基金配置
CREATE POLICY "Users can insert own fund configs"
  ON public.fund_configs
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

-- 创建 RLS 策略：用户只能更新自己的基金配置
CREATE POLICY "Users can update own fund configs"
  ON public.fund_configs
  FOR UPDATE
  USING (auth.uid()::text = user_id);

-- 创建 RLS 策略：用户只能删除自己的基金配置
CREATE POLICY "Users can delete own fund configs"
  ON public.fund_configs
  FOR DELETE
  USING (auth.uid()::text = user_id);

-- 添加注释
COMMENT ON TABLE public.fund_configs IS '基金配置表';
COMMENT ON COLUMN public.fund_configs.user_id IS '用户ID';
COMMENT ON COLUMN public.fund_configs.name IS '基金名称';
COMMENT ON COLUMN public.fund_configs.fund_type IS '基金类型：nasdaq/astock';
COMMENT ON COLUMN public.fund_configs.fund_code IS '基金代码';
