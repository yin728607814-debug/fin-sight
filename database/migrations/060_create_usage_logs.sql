-- 创建使用日志表
CREATE TABLE IF NOT EXISTS public.usage_logs (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id text NOT NULL,
  action text,
  model_used text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  card_data jsonb,
  CONSTRAINT usage_logs_pkey PRIMARY KEY (id)
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON public.usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON public.usage_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_logs_action ON public.usage_logs(action);

-- 启用 RLS
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略：用户只能查看自己的使用日志
CREATE POLICY "Users can view own usage logs"
  ON public.usage_logs
  FOR SELECT
  USING (auth.uid()::text = user_id);

-- 创建 RLS 策略：用户只能插入自己的使用日志
CREATE POLICY "Users can insert own usage logs"
  ON public.usage_logs
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

-- 添加注释
COMMENT ON TABLE public.usage_logs IS '用户使用日志表';
COMMENT ON COLUMN public.usage_logs.user_id IS '用户ID';
COMMENT ON COLUMN public.usage_logs.action IS '操作类型';
COMMENT ON COLUMN public.usage_logs.model_used IS '使用的模型';
COMMENT ON COLUMN public.usage_logs.card_data IS '卡片数据（JSON格式）';
