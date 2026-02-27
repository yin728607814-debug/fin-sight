# 数据库迁移指南

本文件夹包含 FinSight AI 的所有数据库迁移脚本。

## 迁移文件列表

按执行顺序排列：

1. **010_create_chat_messages.sql** - AI 聊天消息表
2. **020_create_positions.sql** - 投资组合持仓表
3. **030_create_sentiment_history.sql** - 市场情绪历史表
4. **040_create_auto_invest_plans.sql** - 定投计划表
5. **050_create_fund_configs.sql** - 基金配置表
6. **060_create_usage_logs.sql** - 使用日志表

## 表结构说明

### 1. chat_messages（聊天消息表）
存储用户与 AI 的聊天记录。

**字段：**
- `id` - 主键（UUID）
- `user_id` - 用户ID
- `asset_type` - 资产类型（nasdaq/gold/astock）
- `role` - 消息角色（user/assistant）
- `content` - 消息内容
- `context` - 消息上下文（JSON）
- `created_at` - 创建时间
- `updated_at` - 更新时间

**索引：**
- `idx_chat_messages_user_asset` - 用户和资产类型复合索引
- `idx_chat_messages_created_at` - 创建时间索引

### 2. positions（持仓表）
存储用户的投资组合持仓信息。

**字段：**
- `id` - 主键（UUID）
- `user_id` - 用户ID
- `asset_type` - 资产类型（nasdaq/gold/astock）
- `fund_name` - 基金名称
- `quantity` - 持仓数量
- `average_buy_price` - 平均买入价格
- `investment_amount` - 投资金额
- `profit_loss` - 盈亏金额
- `profit_loss_percent` - 盈亏百分比
- `daily_profit_loss` - 当日盈亏
- `daily_change` - 当日涨跌幅
- `fund_code` - 基金代码
- `created_at` - 创建时间
- `updated_at` - 更新时间

**索引：**
- `idx_positions_user_id` - 用户ID索引
- `idx_positions_user_asset` - 用户和资产类型复合索引
- `idx_positions_created_at` - 创建时间索引

### 3. sentiment_history（情绪历史表）
存储市场情绪分析的历史数据。

**字段：**
- `id` - 主键（UUID）
- `user_id` - 用户ID（UUID，外键关联 auth.users）
- `asset_type` - 资产类型（gold/nasdaq/astock）
- `date` - 日期
- `score` - 情绪分数（0-100）
- `level` - 情绪等级（bearish/neutral/bullish）
- `distribution` - 情绪分布（JSON）
- `key_factors` - 关键因素（数组）
- `news_count` - 新闻数量
- `created_at` - 创建时间
- `updated_at` - 更新时间

**唯一约束：**
- 每个用户每天每个资产类型只能有一条记录

**索引：**
- `idx_sentiment_history_unique` - 唯一索引
- `idx_sentiment_history_user_asset` - 用户和资产类型复合索引
- `idx_sentiment_history_date` - 日期索引

### 4. auto_invest_plans（定投计划表）
存储用户的定投计划配置。

**字段：**
- `id` - 主键（UUID）
- `user_id` - 用户ID
- `asset_type` - 资产类型（nasdaq/astock）
- `fund_name` - 基金名称
- `invest_amount` - 定投金额
- `frequency` - 定投频率（daily/weekly/monthly）
- `invest_day` - 定投日期（1-28）
- `is_enabled` - 是否启用
- `next_execution_date` - 下次执行日期
- `last_execution_date` - 上次执行日期
- `created_at` - 创建时间
- `updated_at` - 更新时间

**索引：**
- `idx_auto_invest_plans_user_id` - 用户ID索引
- `idx_auto_invest_plans_user_asset` - 用户和资产类型复合索引
- `idx_auto_invest_plans_enabled` - 启用状态和执行日期复合索引
- `idx_auto_invest_plans_created_at` - 创建时间索引

### 5. fund_configs（基金配置表）
存储用户自定义的基金配置。

**字段：**
- `id` - 主键（UUID）
- `user_id` - 用户ID
- `name` - 基金名称
- `fund_type` - 基金类型（nasdaq/astock）
- `fund_code` - 基金代码
- `created_at` - 创建时间
- `updated_at` - 更新时间

**唯一约束：**
- 每个用户的基金名称唯一

**索引：**
- `idx_fund_configs_user_name` - 用户和名称唯一索引
- `idx_fund_configs_user_id` - 用户ID索引
- `idx_fund_configs_fund_type` - 基金类型索引
- `idx_fund_configs_created_at` - 创建时间索引

### 6. usage_logs（使用日志表）
记录用户的操作日志。

**字段：**
- `id` - 主键（自增）
- `user_id` - 用户ID
- `action` - 操作类型
- `model_used` - 使用的模型
- `card_data` - 卡片数据（JSON）
- `created_at` - 创建时间

**索引：**
- `idx_usage_logs_user_id` - 用户ID索引
- `idx_usage_logs_created_at` - 创建时间索引
- `idx_usage_logs_action` - 操作类型索引

## 执行迁移

### 在 Supabase Dashboard 中执行

1. 登录 [Supabase Dashboard](https://supabase.com/)
2. 选择你的项目
3. 进入 **SQL Editor**
4. 点击 **New Query**
5. 按顺序执行每个迁移文件的内容

### 执行顺序

```sql
-- 1. 聊天消息表
\i database/migrations/010_create_chat_messages.sql

-- 2. 持仓表
\i database/migrations/020_create_positions.sql

-- 3. 情绪历史表
\i database/migrations/030_create_sentiment_history.sql

-- 4. 定投计划表
\i database/migrations/040_create_auto_invest_plans.sql

-- 5. 基金配置表
\i database/migrations/050_create_fund_configs.sql

-- 6. 使用日志表
\i database/migrations/060_create_usage_logs.sql
```

### 验证迁移

执行以下 SQL 验证所有表已创建：

```sql
-- 查看所有表
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 验证 RLS 策略
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 查看所有索引
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

## Row Level Security (RLS)

所有表都启用了 RLS 策略，确保：

- ✅ 用户只能访问自己的数据
- ✅ 数据库层面强制隔离
- ✅ 防止未授权访问

### RLS 策略类型

每个表都有以下策略：

1. **SELECT** - 用户只能查看自己的记录
2. **INSERT** - 用户只能插入自己的记录
3. **UPDATE** - 用户只能更新自己的记录
4. **DELETE** - 用户只能删除自己的记录

## 数据迁移

如果需要从 localStorage 迁移数据到 Supabase，应用会自动处理：

- 聊天记录自动迁移
- 情绪历史自动迁移
- 持仓数据需要手动导入

## 备份和恢复

### 备份数据

```sql
-- 导出所有表数据
COPY (SELECT * FROM chat_messages) TO '/tmp/chat_messages.csv' CSV HEADER;
COPY (SELECT * FROM positions) TO '/tmp/positions.csv' CSV HEADER;
COPY (SELECT * FROM sentiment_history) TO '/tmp/sentiment_history.csv' CSV HEADER;
COPY (SELECT * FROM auto_invest_plans) TO '/tmp/auto_invest_plans.csv' CSV HEADER;
COPY (SELECT * FROM fund_configs) TO '/tmp/fund_configs.csv' CSV HEADER;
COPY (SELECT * FROM usage_logs) TO '/tmp/usage_logs.csv' CSV HEADER;
```

### 恢复数据

```sql
-- 导入表数据
COPY chat_messages FROM '/tmp/chat_messages.csv' CSV HEADER;
COPY positions FROM '/tmp/positions.csv' CSV HEADER;
COPY sentiment_history FROM '/tmp/sentiment_history.csv' CSV HEADER;
COPY auto_invest_plans FROM '/tmp/auto_invest_plans.csv' CSV HEADER;
COPY fund_configs FROM '/tmp/fund_configs.csv' CSV HEADER;
COPY usage_logs FROM '/tmp/usage_logs.csv' CSV HEADER;
```

## 故障排除

### 问题：表已存在

如果表已存在，可以先删除：

```sql
DROP TABLE IF EXISTS usage_logs CASCADE;
DROP TABLE IF EXISTS fund_configs CASCADE;
DROP TABLE IF EXISTS auto_invest_plans CASCADE;
DROP TABLE IF EXISTS sentiment_history CASCADE;
DROP TABLE IF EXISTS positions CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
```

### 问题：RLS 策略冲突

删除现有策略：

```sql
DROP POLICY IF EXISTS "Users can view own chat messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can insert own chat messages" ON chat_messages;
-- ... 其他策略
```

### 问题：外键约束失败

确保 `auth.users` 表存在（Supabase 自动创建）。

## 相关文档

- [Supabase 文档](https://supabase.com/docs)
- [PostgreSQL 文档](https://www.postgresql.org/docs/)
- [部署指南](../docs/deployment/README.md)

---

**需要帮助？** 在 GitHub 提交 Issue。
