# 🚀 Cloudflare Pages 快速部署指南

本指南将帮助你在 5 分钟内将 FinSight AI 部署到 Cloudflare Pages。

## 前置要求

- GitHub 账号
- Cloudflare 账号（免费）
- Gemini API 密钥
- Supabase 项目

## 部署步骤

### 1. Fork 项目

1. 访问 https://github.com/yin728607814-debug/fin-sight
2. 点击右上角的 **Fork** 按钮
3. 等待 Fork 完成

### 2. 登录 Cloudflare

1. 访问 https://dash.cloudflare.com/
2. 使用你的账号登录
3. 进入 **Workers & Pages** 页面

### 3. 创建新项目

1. 点击 **Create application**
2. 选择 **Pages** 标签
3. 点击 **Connect to Git**
4. 选择 **GitHub**
5. 授权 Cloudflare 访问你的 GitHub
6. 选择你 Fork 的 `fin-sight` 仓库

### 4. 配置构建设置

在构建配置页面填写：

```
Framework preset: None
Build command: npm run build
Build output directory: dist
Root directory: (留空)
```

### 5. 设置环境变量

点击 **Environment variables**，添加以下变量：

**必需的环境变量：**

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `GEMINI_API_KEY` | 你的 Gemini API 密钥 | 从 https://ai.google.dev/ 获取 |
| `VITE_SUPABASE_URL` | 你的 Supabase URL | 从 Supabase 项目设置获取 |
| `VITE_SUPABASE_ANON_KEY` | 你的 Supabase 匿名密钥 | 从 Supabase 项目设置获取 |

**可选的环境变量：**

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `VITE_FINNHUB_API_KEY` | 你的 Finnhub API 密钥 | 用于补充英文新闻（可选） |

### 6. 部署

1. 点击 **Save and Deploy**
2. 等待 1-2 分钟，Cloudflare 会自动构建和部署
3. 部署完成后，你会看到一个 `.pages.dev` 域名

### 7. 访问应用

点击提供的域名，访问你的 FinSight AI 应用！

## 获取 API 密钥

### Gemini API 密钥

1. 访问 https://ai.google.dev/
2. 点击 **Get API Key**
3. 创建或选择一个项目
4. 复制 API 密钥

### Supabase 配置

1. 访问 https://supabase.com/
2. 创建新项目或选择现有项目
3. 进入 **Settings** → **API**
4. 复制 **Project URL** 和 **anon public** 密钥

### Finnhub API 密钥（可选）

1. 访问 https://finnhub.io/
2. 注册免费账号
3. 在 Dashboard 复制 API 密钥

## 数据库设置

部署完成后，需要在 Supabase 中执行数据库迁移：

1. 登录 Supabase Dashboard
2. 选择你的项目
3. 进入 **SQL Editor**
4. 依次执行 `database/migrations/` 目录下的 SQL 文件：
   - `010_create_chat_messages.sql`（AI 聊天记录表）
   - 其他迁移文件（如果有）

## 自定义域名（可选）

1. 在 Cloudflare Pages 项目页面
2. 进入 **Custom domains**
3. 点击 **Set up a custom domain**
4. 按照提示添加你的域名

## 故障排除

### 构建失败

- 检查 Node.js 版本是否为 18+
- 确认所有依赖都已正确安装
- 查看构建日志中的错误信息

### 应用无法访问

- 检查环境变量是否正确设置
- 确认 Supabase 项目正常运行
- 查看浏览器控制台的错误信息

### AI 功能不工作

- 确认 `GEMINI_API_KEY` 已正确设置
- 检查 API 密钥是否有效
- 查看 Functions 日志

## 更新应用

当你更新代码后：

1. 推送到 GitHub
2. Cloudflare 会自动检测并重新部署
3. 等待 1-2 分钟即可看到更新

## 下一步

- 查看 [详细部署指南](./CLOUDFLARE_DEPLOY_GUIDE.md) 了解更多配置选项
- 查看 [迁移指南](./CLOUDFLARE_MIGRATION.md) 了解如何从其他平台迁移

## 需要帮助？

- 查看 [许可证](./LICENSE.md) 了解使用条款
- 在 GitHub 提交 Issue

---

**🎉 恭喜！你已成功部署 FinSight AI！**
