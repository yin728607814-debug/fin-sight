# Supabase 设置指南

本文档说明如何设置 Supabase 数据库用于投资组合后端存储。

## 📋 前置要求

- 一个 Supabase 账号（免费）
- 项目已安装 `@supabase/supabase-js` 依赖

## 🚀 快速开始

### 1. 注册 Supabase 账号

1. 访问 [https://supabase.com](https://supabase.com)
2. 点击 "Start your project" 注册账号
3. 可以使用 GitHub 账号快速登录

### 2. 创建新项目

1. 登录后，点击 "New Project"
2. 填写项目信息：
   - **Name**: `portfolio-storage`（或任意名称）
   - **Database Password**: 设置一个强密码（请妥善保存）
   - **Region**: 选择 `Northeast Asia (Tokyo)` 或最近的区域
   - **Pricing Plan**: 选择 `Free` 免费计划
3. 点击 "Create new project"
4. 等待 1-2 分钟，项目创建完成

### 3. 获取 API 凭证

1. 在项目仪表板，点击左侧菜单的 **Settings** (齿轮图标)
2. 点击 **API** 选项卡
3. 找到以下信息：
   - **Project URL**: 类似 `https://xxxxx.supabase.co`
   - **anon public**: 这是你的 API Key

### 4. 配置环境变量

1. 复制 `.env.example` 为 `.env`：
   ```bash
   cp .env.example .env
   ```

2. 在 `.env` 文件中填入 Supabase 凭证：
   ```bash
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

3. 在 Netlify 控制台也添加这两个环境变量：
   - 进入 Netlify 项目设置
   - 点击 "Environment variables"
   - 添加 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY`

### 5. 创建数据库表

1. 在 Supabase 项目仪表板，点击左侧菜单的 **SQL Editor**
2. 点击 "New query"
3. 复制 `database/migrations/001_create_positions_table.sql` 的全部内容
4. 粘贴到 SQL Editor 中
5. 点击 "Run" 执行脚本
6. 看到 "Success. No rows returned" 表示执行成功

### 6. 验证表结构

1. 在 Supabase 仪表板，点击左侧菜单的 **Table Editor**
2. 应该能看到 `positions` 表
3. 点击表名，查看表结构：
   - 应该有 11 个字段
   - 应该有 4 个索引
   - RLS 应该是启用状态

### 7. 测试连接

1. 启动开发服务器：
   ```bash
   npm run dev
   ```

2. 打开浏览器控制台，应该能看到：
   ```
   [INFO] Supabase 客户端初始化成功
   ```

3. 如果看到错误，检查：
   - 环境变量是否正确配置
   - Supabase 项目是否已完全启动
   - API Key 是否正确复制

## 📊 数据库表结构

### positions 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键，自动生成 |
| user_id | VARCHAR(255) | 用户标识 |
| asset_type | VARCHAR(20) | 资产类型（nasdaq/gold） |
| fund_name | VARCHAR(255) | 基金名称（可选） |
| quantity | DECIMAL(10,3) | 黄金克数（可选） |
| average_buy_price | DECIMAL(10,2) | 黄金均价（可选） |
| investment_amount | DECIMAL(12,2) | 持仓金额 |
| profit_loss | DECIMAL(12,2) | 持仓收益 |
| created_at | TIMESTAMPTZ | 创建时间 |
| updated_at | TIMESTAMPTZ | 更新时间 |

### 索引

- `idx_positions_user_id`: 用户ID索引
- `idx_positions_asset_type`: 资产类型索引
- `idx_positions_created_at`: 创建时间索引（降序）
- `idx_positions_user_asset`: 用户ID + 资产类型复合索引

## 🔒 安全配置

### Row Level Security (RLS)

当前配置为允许所有操作，因为我们在应用层控制权限。

如果需要更严格的安全策略，可以修改 RLS 策略：

```sql
-- 删除现有策略
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON positions;

-- 创建更严格的策略（需要配合 Supabase Auth）
CREATE POLICY "Users can only access their own positions"
  ON positions
  FOR ALL
  USING (auth.uid()::text = user_id);
```

## 📈 监控和维护

### 查看数据库使用情况

1. 在 Supabase 仪表板，点击 **Settings** > **Usage**
2. 可以看到：
   - 数据库大小
   - API 请求次数
   - 存储使用量

### 免费计划限制

- **数据库大小**: 500 MB
- **月活用户**: 50,000
- **API 请求**: 无限制
- **存储**: 1 GB
- **带宽**: 2 GB

对于个人使用，这些限制完全足够。

### 备份

Supabase 免费计划提供：
- 自动每日备份（保留 7 天）
- 可以手动导出数据

## 🐛 故障排查

### 问题 1: "Supabase 未配置或不可用"

**解决方案:**
1. 检查 `.env` 文件是否存在
2. 检查环境变量是否正确填写
3. 重启开发服务器

### 问题 2: "relation 'positions' does not exist"

**解决方案:**
1. 确认已在 SQL Editor 中执行迁移脚本
2. 在 Table Editor 中检查表是否存在
3. 如果不存在，重新执行迁移脚本

### 问题 3: API 请求返回 401 错误

**解决方案:**
1. 检查 API Key 是否正确
2. 确认使用的是 `anon` key，不是 `service_role` key
3. 检查 RLS 策略是否正确配置

### 问题 4: 数据无法插入

**解决方案:**
1. 检查 RLS 是否启用
2. 检查 RLS 策略是否允许插入操作
3. 查看浏览器控制台的详细错误信息

## 📚 更多资源

- [Supabase 官方文档](https://supabase.com/docs)
- [PostgreSQL 文档](https://www.postgresql.org/docs/)
- [Supabase JavaScript 客户端](https://supabase.com/docs/reference/javascript/introduction)

## 🎉 完成！

现在你的 Supabase 数据库已经配置完成，可以开始使用后端存储功能了！

下一步：
1. 运行应用，测试数据迁移功能
2. 创建新的持仓记录
3. 验证数据是否正确存储在 Supabase 中
