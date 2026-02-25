-- 创建情绪历史表
CREATE TABLE IF NOT EXISTS sentiment_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('gold', 'nasdaq', 'astock')),
  date DATE NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  level TEXT NOT NULL CHECK (level IN ('bearish', 'neutral', 'bullish')),
  distribution JSONB,
  key_factors TEXT[],
  news_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, asset_type, date)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_sentiment_history_user_asset 
  ON sentiment_history(user_id, asset_type);

CREATE INDEX IF NOT EXISTS idx_sentiment_history_date 
  ON sentiment_history(date DESC);

-- 启用 RLS
ALTER TABLE sentiment_history ENABLE ROW LEVEL SECURITY;

-- RLS 策略：用户只能访问自己的数据
CREATE POLICY "Users can view their own sentiment history"
  ON sentiment_history
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sentiment history"
  ON sentiment_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sentiment history"
  ON sentiment_history
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sentiment history"
  ON sentiment_history
  FOR DELETE
  USING (auth.uid() = user_id);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_sentiment_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sentiment_history_updated_at
  BEFORE UPDATE ON sentiment_history
  FOR EACH ROW
  EXECUTE FUNCTION update_sentiment_history_updated_at();

-- 添加注释
COMMENT ON TABLE sentiment_history IS '市场情绪历史记录表';
COMMENT ON COLUMN sentiment_history.asset_type IS '资产类型：gold, nasdaq, astock';
COMMENT ON COLUMN sentiment_history.date IS '记录日期';
COMMENT ON COLUMN sentiment_history.score IS '情绪分数 (0-100)';
COMMENT ON COLUMN sentiment_history.level IS '情绪等级：bearish, neutral, bullish';
COMMENT ON COLUMN sentiment_history.distribution IS '情绪分布 {positive, neutral, negative}';
COMMENT ON COLUMN sentiment_history.key_factors IS '关键影响因素';
COMMENT ON COLUMN sentiment_history.news_count IS '分析的新闻数量';
