# 📘 Cloudflare Pages 详细部署指南

本指南提供 FinSight AI 在 Cloudflare Pages 上的完整部署说明。

## 目录

- [为什么选择 Cloudflare Pages](#为什么选择-cloudflare-pages)
- [架构说明](#架构说明)
- [详细部署步骤](#详细部署步骤)
- [环境变量配置](#环境变量配置)
- [数据库设置](#数据库设置)
- [Functions 配置](#functions-配置)
- [性能优化](#性能优化)
- [安全配置](#安全配置)
- [监控和日志](#监控和日志)

## 为什么选择 Cloudflare Pages

### 优势

- ✅ **免费额度充足**：每月 500 次构建，无限带宽
- ✅ **全球 CDN**：自动分发到全球边缘节点
- ✅ **自动 HTTPS**：免费 SSL 证书
- ✅ **Git 集成**：推送代码自动部署
- ✅ **Functions 支持**：无服务器 API 代理
- ✅ **快速构建**：平均构建时间 1-2 分钟

### 限制

- 单个 Function 最大执行时间：30 秒（免费版）
- 单个请求最大响应大小：25 MB
- 每天最多 100,000 次 Function 调用（免费版）

## 架构说明

```
┌─────────────────────────────────────────────────────────┐
│                    Cloudflare Pages                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐         ┌──────────────┐             │
│  │   静态资源    │         │   Functions   │             │
│  │  (React App) │         │   (API 代理)  │             │
│  └──────────────┘         └──────────────┘             │
│         │                        │                      │
│         │                        ├─ /gemini-analysis   │
│         │                        ├─ /sina-news-proxy   │
│         │                        ├─ /eastmoney-news-proxy│
│         │                        └─ /yahoo-finance-proxy│
│         │                                               │
└─────────┼───────────────────────────────────────────────┘
          │
          ├─────────────► Gemini AI (AI 分析)
          ├─────────────► Supabase (数据库)
          ├─────────────► 新浪财经 (新闻)
          ├─────────────► 东方财富 (新闻)
          └─────────────► Yahoo Finance (价格)
```

## 详细部署步骤

### 1. 准备工作

#### 1.1 Fork 项目

```bash
# 访问 GitHub 项目页面
https://github.com/yin728607814-debug/fin-sight

# 点击 Fork 按钮
# 等待 Fork 完成
```

#### 1.2 克隆到本地（可选）

```bash
git clone https://github.com/你的用户名/fin-sight.git
cd fin-sight
npm install
```

### 2. Cloudflare 配置

#### 2.1 创建 Cloudflare 账号

1. 访问 https://dash.cloudflare.com/sign-up
2. 使用邮箱注册（免费）
3. 验证邮箱

#### 2.2 连接 GitHub

1. 登录 Cloudflare Dashboard
2. 进入 **Workers & Pages**
3. 点击 **Create application**
4. 选择 **Pages** → **Connect to Git**
5. 选择 **GitHub**
6. 授权 Cloudflare 访问你的 GitHub 仓库

#### 2.3 选择仓库

1. 在仓库列表中找到 `fin-sight`
2. 点击 **Begin setup**

#### 2.4 配置构建

```yaml
Project name: fin-sight (或自定义名称)
Production branch: main
Framework preset: None

Build settings:
  Build command: npm run build
  Build output directory: dist
  Root directory: (留空)
  
Environment variables: (下一步配置)
```

### 3. 环境变量配置

#### 3.1 必需的环境变量

在 **Environment variables** 部分添加：

**生产环境（Production）：**

```env
GEMINI_API_KEY=你的_Gemini_API_密钥
VITE_SUPABASE_URL=https://你的项目.supabase.co
VITE_SUPABASE_ANON_KEY=你的_Supabase_匿名密钥
```

**预览环境（Preview）：**

可以使用相同的值，或者配置测试环境的密钥。

#### 3.2 可选的环境变量

```env
# Finnhub API（用于补充英文新闻）
VITE_FINNHUB_API_KEY=你的_Finnhub_API_密钥

# 应用配置
VITE_APP_TITLE=FinSight AI
VITE_APP_VERSION=1.0.0
```

#### 3.3 环境变量说明

| 变量名 | 用途 | 必需 | 获取方式 |
|--------|------|------|----------|
| `GEMINI_API_KEY` | AI 分析服务 | ✅ | https://ai.google.dev/ |
| `VITE_SUPABASE_URL` | 数据库连接 | ✅ | Supabase 项目设置 |
| `VITE_SUPABASE_ANON_KEY` | 数据库认证 | ✅ | Supabase 项目设置 |
| `VITE_FINNHUB_API_KEY` | 英文新闻补充 | ⭕ | https://finnhub.io/ |

### 4. 部署

1. 点击 **Save and Deploy**
2. Cloudflare 开始构建：
   - 克隆代码
   - 安装依赖
   - 运行构建命令
   - 部署到全球 CDN
3. 等待 1-2 分钟
4. 部署完成后显示 URL：`https://你的项目.pages.dev`

## 数据库设置

### Supabase 项目创建

1. 访问 https://supabase.com/
2. 点击 **New Project**
3. 填写项目信息：
   - Name: `finsight-ai`
   - Database Password: 设置强密码
   - Region: 选择离你最近的区域
4. 等待项目创建（约 2 分钟）

### 执行数据库迁移

1. 进入 Supabase Dashboard
2. 选择你的项目
3. 进入 **SQL Editor**
4. 点击 **New Query**
5. 执行以下迁移脚本：

#### 聊天消息表

复制 `database/migrations/010_create_chat_messages.sql` 的内容并执行。

#### 验证表创建

```sql
-- 查看所有表
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- 验证 RLS 策略
SELECT * FROM pg_policies WHERE tablename = 'chat_messages';
```

### 获取 Supabase 配置

1. 在 Supabase Dashboard
2. 进入 **Settings** → **API**
3. 复制以下信息：
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** → `VITE_SUPABASE_ANON_KEY`

## Functions 配置

Cloudflare Pages Functions 会自动部署 `functions/` 目录下的文件。

### Functions 列表

| 路径 | 用途 | 需要密钥 |
|------|------|----------|
| `/gemini-analysis` | AI 分析 | GEMINI_API_KEY |
| `/sina-news-proxy` | 新浪财经新闻 | 无 |
| `/eastmoney-news-proxy` | 东方财富新闻 | 无 |
| `/eastmoney-gold-proxy` | 东方财富黄金新闻 | 无 |
| `/yahoo-finance-proxy` | Yahoo Finance 价格 | 无 |
| `/finnhub-news-proxy` | Finnhub 新闻 | VITE_FINNHUB_API_KEY |

### 查看 Functions 日志

1. 在 Cloudflare Dashboard
2. 进入你的 Pages 项目
3. 点击 **Functions**
4. 查看实时日志和调用统计

## 性能优化

### 1. 启用缓存

在 `public/_headers` 文件中配置：

```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin

/assets/*
  Cache-Control: public, max-age=31536000, immutable

/*.js
  Cache-Control: public, max-age=31536000, immutable

/*.css
  Cache-Control: public, max-age=31536000, immutable
```

### 2. 图片优化

- 使用 WebP 格式
- 启用懒加载
- 使用 Cloudflare Images（可选）

### 3. 代码分割

项目已配置 Vite 代码分割，自动优化。

## 安全配置

### 1. 环境变量安全

- ✅ 所有 API 密钥都在服务器端使用
- ✅ 前端代码不包含敏感信息
- ✅ Functions 作为代理保护密钥

### 2. CORS 配置

Functions 已配置 CORS 头：

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
```

### 3. RLS 策略

Supabase 表已启用 Row Level Security：

- 用户只能访问自己的数据
- 数据库层面强制隔离

## 监控和日志

### Cloudflare Analytics

1. 进入项目 Dashboard
2. 查看 **Analytics** 标签
3. 监控：
   - 访问量
   - 带宽使用
   - Functions 调用次数
   - 错误率

### Functions 日志

1. 进入 **Functions** 标签
2. 查看实时日志
3. 过滤错误和警告

### Supabase 监控

1. 进入 Supabase Dashboard
2. 查看 **Database** → **Logs**
3. 监控查询性能

## 自定义域名

### 添加域名

1. 在 Cloudflare Pages 项目
2. 进入 **Custom domains**
3. 点击 **Set up a custom domain**
4. 输入你的域名（如 `finsight.example.com`）
5. 按照提示添加 DNS 记录

### DNS 配置

如果域名在 Cloudflare：
- 自动配置 CNAME 记录

如果域名在其他服务商：
- 添加 CNAME 记录指向 `你的项目.pages.dev`

## 持续部署

### 自动部署

推送到 GitHub 后自动触发部署：

```bash
git add .
git commit -m "更新功能"
git push origin main
```

### 预览部署

创建 Pull Request 时自动创建预览环境：

1. 创建新分支
2. 推送更改
3. 创建 Pull Request
4. Cloudflare 自动创建预览 URL

### 回滚

1. 在 Cloudflare Dashboard
2. 进入 **Deployments**
3. 选择之前的部署
4. 点击 **Rollback to this deployment**

## 故障排除

### 构建失败

**问题**：`npm install` 失败

**解决**：
```bash
# 清理 package-lock.json
rm package-lock.json
npm install
git add package-lock.json
git commit -m "更新依赖"
git push
```

**问题**：TypeScript 类型错误

**解决**：
```bash
npm run type-check
# 修复类型错误后重新部署
```

### Functions 错误

**问题**：403 Forbidden

**解决**：
- 检查 API 密钥是否正确设置
- 确认环境变量名称正确

**问题**：超时

**解决**：
- 优化 Function 代码
- 减少外部 API 调用
- 使用缓存

### 数据库连接失败

**问题**：无法连接 Supabase

**解决**：
- 检查 `VITE_SUPABASE_URL` 是否正确
- 检查 `VITE_SUPABASE_ANON_KEY` 是否正确
- 确认 Supabase 项目正常运行

## 成本估算

### Cloudflare Pages（免费版）

- ✅ 500 次构建/月
- ✅ 无限带宽
- ✅ 100,000 次 Function 调用/天
- ✅ 免费 SSL 证书

### Supabase（免费版）

- ✅ 500 MB 数据库
- ✅ 5 GB 带宽/月
- ✅ 50,000 次 API 请求/月

### Gemini API（免费版）

- ✅ 1,500 次请求/天
- ✅ 每分钟 15 次请求

**总计**：完全免费（在免费额度内）

## 下一步

- 配置自定义域名
- 设置监控告警
- 优化性能
- 添加更多功能

## 相关文档

- [快速开始指南](./QUICK_START_CLOUDFLARE.md)
- [迁移指南](./CLOUDFLARE_MIGRATION.md)
- [许可证](./LICENSE.md)

---

**需要帮助？** 在 GitHub 提交 Issue 或查看文档。
