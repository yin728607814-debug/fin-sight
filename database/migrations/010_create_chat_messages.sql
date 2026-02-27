-- 创建聊天消息表
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id character varying NOT NULL,
  asset_type character varying NOT NULL CHECK (asset_type IN ('nasdaq', 'gold', 'astock')),
  role character varying NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  context jsonb,
  created_at timestamp with time zone DEFAULT timezone('Asia/Shanghai'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('Asia/Shanghai'::text, now()),
  CONSTRAINT chat_messages_pkey PRIMARY KEY (id)
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_asset ON public.chat_messages(user_id, asset_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at DESC);

-- 启用 RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略：用户只能查看自己的聊天记录
CREATE POLICY "Users can view own chat messages"
  ON public.chat_messages
  FOR SELECT
  USING (auth.uid()::text = user_id);

-- 创建 RLS 策略：用户只能插入自己的聊天记录
CREATE POLICY "Users can insert own chat messages"
  ON public.chat_messages
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

-- 创建 RLS 策略：用户只能删除自己的聊天记录
CREATE POLICY "Users can delete own chat messages"
  ON public.chat_messages
  FOR DELETE
  USING (auth.uid()::text = user_id);

-- 添加注释
COMMENT ON TABLE public.chat_messages IS 'AI聊天消息记录表';
COMMENT ON COLUMN public.chat_messages.user_id IS '用户ID';
COMMENT ON COLUMN public.chat_messages.asset_type IS '资产类型：nasdaq/gold/astock';
COMMENT ON COLUMN public.chat_messages.role IS '消息角色：user/assistant';
COMMENT ON COLUMN public.chat_messages.content IS '消息内容';
COMMENT ON COLUMN public.chat_messages.context IS '消息上下文（JSON格式）';
