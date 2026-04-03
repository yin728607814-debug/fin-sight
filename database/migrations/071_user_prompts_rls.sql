-- 启用 user_prompts 表的行级安全
ALTER TABLE user_prompts ENABLE ROW LEVEL SECURITY;

-- 策略1：用户可以查看自己的 Prompt
CREATE POLICY "Users can view their own prompts"
ON user_prompts
FOR SELECT
USING (auth.uid()::text = user_id);

-- 策略2：用户可以插入自己的 Prompt
CREATE POLICY "Users can insert their own prompts"
ON user_prompts
FOR INSERT
WITH CHECK (auth.uid()::text = user_id);

-- 策略3：用户可以更新自己的 Prompt
CREATE POLICY "Users can update their own prompts"
ON user_prompts
FOR UPDATE
USING (auth.uid()::text = user_id)
WITH CHECK (auth.uid()::text = user_id);

-- 策略4：用户可以删除自己的 Prompt
CREATE POLICY "Users can delete their own prompts"
ON user_prompts
FOR DELETE
USING (auth.uid()::text = user_id);
