-- 用户自定义分析策略 Prompt 表
CREATE TABLE IF NOT EXISTS user_prompts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  asset_type TEXT NOT NULL CHECK(asset_type IN ('gold', 'nasdaq', 'astock')),
  prompt_content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, asset_type)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_prompts_user_asset ON user_prompts(user_id, asset_type);
