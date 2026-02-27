-- 创建情绪历史表
CREATE TABLE IF NOT EXISTS public.sentiment_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  asset_type text NOT NULL CHECK (asset_type IN ('gold', 'nasdaq', 'astock')),
  date date NOT NULL,
  score integer NOT NULL CHECK (score >= 0 AND score <= 100),
  level text NOT NULL CHECK (level IN ('bearish', 'neutral', 'bullish')),
  distribution jsonb,
  key_factors text[],
  news_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT sentiment_history_pkey PRIMARY KEY (id),
  CONSTRAINT sentiment_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 创建唯一约束：每个用户每天每个资产类型只能有一条记录
CREATE UNIQUE INDEX IF NOT EXISTS idx_sentiment_history_unique 
  ON public.sentiment_history(user_id, asset_type, date);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_sentiment_history_user_asset ON public.sentiment_history(user_id, asset_type, date DESC);
CREATE INDEX IF NOT EXISTS idx_sentiment_history_date ON public.sentiment_history(date DESC);

-- 启用 RLS
ALTER TABLE public.sentiment_history ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略：用户只能查看自己的情绪历史
CREATE POLICY "Users can view own sentiment history"
  ON public.sentiment_history
  FOR SELECT
  USING (auth.uid() = user_id);

-- 创建 RLS 策略：用户只能插入自己的情绪历史
CREATE POLICY "Users can insert own sentiment history"
  ON public.sentiment_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 创建 RLS 策略：用户只能更新自己的情绪历史
CREATE POLICY "Users can update own sentiment history"
  ON public.sentiment_history
  FOR UPDATE
  USING (auth.uid() = user_id);

-- 创建 RLS 策略：用户只能删除自己的情绪历史
CREATE POLICY "Users can delete own sentiment history"
  ON public.sentiment_history
  FOR DELETE
  USING (auth.uid() = user_id);

-- 添加注释
COMMENT ON TABLE public.sentiment_history IS '市场情绪历史记录表';
COMMENT ON COLUMN public.sentiment_history.user_id IS '用户ID';
COMMENT ON COLUMN public.sentiment_history.asset_type IS '资产类型：gold/nasdaq/astock';
COMMENT ON COLUMN public.sentiment_history.date IS '日期';
COMMENT ON COLUMN public.sentiment_history.score IS '情绪分数（0-100）';
COMMENT ON COLUMN public.sentiment_history.level IS '情绪等级：bearish/neutral/bullish';
COMMENT ON COLUMN public.sentiment_history.distribution IS '情绪分布（JSON格式）';
COMMENT ON COLUMN public.sentiment_history.key_factors IS '关键因素列表';
COMMENT ON COLUMN public.sentiment_history.news_count IS '新闻数量';
