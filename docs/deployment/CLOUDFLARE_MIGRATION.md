# 🔄 Cloudflare Pages 迁移指南

本指南帮助你从其他平台（Netlify、Vercel 等）迁移到 Cloudflare Pages。

## 目录

- [从 Netlify 迁移](#从-netlify-迁移)
- [从 Vercel 迁移](#从-vercel-迁移)
- [数据迁移](#数据迁移)
- [DNS 配置](#dns-配置)
- [验证迁移](#验证迁移)

## 从 Netlify 迁移

### 1. 对比差异

| 功能 | Netlify | Cloudflare Pages |
|------|---------|------------------|
| Functions 目录 | `netlify/functions/` | `functions/` |
| 环境变量 | Netlify UI | Cloudflare UI |
| 重定向配置 | `_redirects` | `_redirects` |
| Headers 配置 | `_headers` | `_headers` |
| 构建命令 | 相同 | 相同 |

### 2. 迁移 Functions

Netlify Functions 和 Cloudflare Pages Functions 语法略有不同。

**Netlify Functions：**
```typescript
exports.handler = async (event, context) => {
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Hello' })
  };
};
```

**Cloudflare Pages Functions：**
```typescript
export async function onRequest(context) {
  return new Response(JSON.stringify({ message: 'Hello' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
```

### 3. 迁移步骤

#### 3.1 准备工作

```bash
# 1. 备份 Netlify 配置
# 下载环境变量列表
# 备份 netlify.toml 配置

# 2. 更新 Functions
# 将 netlify/functions/ 移动到 functions/
# 更新 Function 语法
```

#### 3.2 更新代码

```bash
# 克隆项目
git clone https://github.com/你的用户名/fin-sight.git
cd fin-sight

# 创建新分支
git checkout -b migrate-to-cloudflare

# 移动 Functions（如果需要）
# 本项目已经使用 Cloudflare Pages 格式

# 提交更改
git add .
git commit -m "迁移到 Cloudflare Pages"
git push origin migrate-to-cloudflare
```

#### 3.3 在 Cloudflare 部署

按照 [快速开始指南](./QUICK_START_CLOUDFLARE.md) 部署到 Cloudflare Pages。

#### 3.4 配置环境变量

从 Netlify 复制所有环境变量到 Cloudflare：

```
GEMINI_API_KEY=...
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_FINNHUB_API_KEY=...
```

#### 3.5 测试

1. 访问 Cloudflare 提供的 `.pages.dev` 域名
2. 测试所有功能：
   - 新闻加载
   - AI 分析
   - 聊天功能
   - 用户登录
3. 检查 Functions 日志

#### 3.6 切换域名

1. 在 Cloudflare Pages 添加自定义域名
2. 更新 DNS 记录
3. 等待 DNS 传播（最多 48 小时）
4. 验证 HTTPS 证书

#### 3.7 停用 Netlify

确认 Cloudflare 正常运行后：

1. 在 Netlify 停止自动部署
2. 保留 Netlify 站点作为备份（可选）
3. 或完全删除 Netlify 站点

## 从 Vercel 迁移

### 1. 对比差异

| 功能 | Vercel | Cloudflare Pages |
|------|--------|------------------|
| API Routes | `pages/api/` | `functions/` |
| 环境变量 | Vercel UI | Cloudflare UI |
| 配置文件 | `vercel.json` | 不需要 |
| Edge Functions | Vercel Edge | Cloudflare Workers |

### 2. 迁移 API Routes

**Vercel API Routes：**
```typescript
// pages/api/hello.ts
export default function handler(req, res) {
  res.status(200).json({ message: 'Hello' });
}
```

**Cloudflare Pages Functions：**
```typescript
// functions/hello.ts
export async function onRequest(context) {
  return new Response(JSON.stringify({ message: 'Hello' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
```

### 3. 迁移步骤

#### 3.1 更新代码结构

```bash
# 移动 API Routes
# 从 pages/api/ 移动到 functions/
# 更新语法

# 删除 vercel.json（如果有）
rm vercel.json
```

#### 3.2 部署到 Cloudflare

按照 [快速开始指南](./QUICK_START_CLOUDFLARE.md) 操作。

#### 3.3 切换域名

与 Netlify 迁移相同。

## 数据迁移

### localStorage 数据

如果用户有本地数据，需要迁移到 Supabase：

#### 聊天记录迁移

```typescript
// 在浏览器控制台运行
const oldData = localStorage.getItem('chat_history');
if (oldData) {
  const parsed = JSON.parse(oldData);
  console.log('旧聊天记录:', parsed);
  // 数据会在用户下次使用时自动迁移到 Supabase
}
```

#### 情绪历史迁移

```typescript
// 在浏览器控制台运行
const sentimentData = localStorage.getItem('sentiment_history');
if (sentimentData) {
  const parsed = JSON.parse(sentimentData);
  console.log('情绪历史:', parsed);
  // 数据会自动迁移到 Supabase
}
```

### 数据库迁移

如果从其他数据库迁移到 Supabase：

#### 1. 导出数据

从原数据库导出 SQL 或 CSV 格式。

#### 2. 转换格式

确保数据格式符合 Supabase 表结构。

#### 3. 导入 Supabase

```sql
-- 在 Supabase SQL Editor 中执行
-- 示例：导入聊天记录
INSERT INTO chat_messages (user_id, asset_type, role, content, created_at)
VALUES 
  ('user-id-1', 'nasdaq', 'user', '问题内容', '2024-01-01T00:00:00Z'),
  ('user-id-1', 'nasdaq', 'assistant', '回答内容', '2024-01-01T00:00:01Z');
```

## DNS 配置

### 添加自定义域名

#### 1. 在 Cloudflare Pages

1. 进入项目设置
2. 点击 **Custom domains**
3. 添加域名：`finsight.example.com`

#### 2. 配置 DNS

**如果域名在 Cloudflare：**

自动配置，无需手动操作。

**如果域名在其他服务商：**

添加 CNAME 记录：

```
类型: CNAME
名称: finsight (或 @)
值: 你的项目.pages.dev
TTL: 自动
```

#### 3. 等待 DNS 传播

```bash
# 检查 DNS 是否生效
nslookup finsight.example.com

# 或使用在线工具
https://dnschecker.org/
```

#### 4. 验证 HTTPS

访问 `https://finsight.example.com`，确认：
- ✅ HTTPS 正常工作
- ✅ 证书有效
- ✅ 应用正常加载

### 从旧域名重定向

在旧平台（Netlify/Vercel）配置重定向：

**Netlify `_redirects`：**
```
/* https://finsight.example.com/:splat 301!
```

**Vercel `vercel.json`：**
```json
{
  "redirects": [
    {
      "source": "/(.*)",
      "destination": "https://finsight.example.com/$1",
      "permanent": true
    }
  ]
}
```

## 验证迁移

### 功能检查清单

- [ ] 首页加载正常
- [ ] 新闻数据显示
- [ ] AI 分析功能工作
- [ ] 价格图表显示
- [ ] 用户登录/注册
- [ ] AI 聊天功能
- [ ] 图片上传功能
- [ ] 投资组合管理
- [ ] 深色模式切换
- [ ] 移动端适配

### 性能对比

使用工具测试性能：

```bash
# Lighthouse 测试
npx lighthouse https://你的域名 --view

# 或使用在线工具
https://pagespeed.web.dev/
```

对比指标：
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Time to Interactive (TTI)
- Total Blocking Time (TBT)

### 监控设置

#### Cloudflare Analytics

1. 查看实时访问数据
2. 监控 Functions 调用
3. 检查错误率

#### Supabase 监控

1. 查看数据库查询性能
2. 监控 API 请求量
3. 检查存储使用

## 回滚计划

如果迁移出现问题：

### 1. 快速回滚

保持旧平台运行，直到确认 Cloudflare 稳定。

### 2. DNS 回滚

```bash
# 将 DNS 记录改回旧平台
# 等待 DNS 传播
```

### 3. 数据恢复

从备份恢复数据（如果需要）。

## 迁移检查清单

### 迁移前

- [ ] 备份所有数据
- [ ] 记录所有环境变量
- [ ] 测试本地构建
- [ ] 准备回滚计划

### 迁移中

- [ ] 部署到 Cloudflare Pages
- [ ] 配置环境变量
- [ ] 执行数据库迁移
- [ ] 测试所有功能
- [ ] 配置自定义域名

### 迁移后

- [ ] 验证所有功能
- [ ] 监控性能和错误
- [ ] 更新文档
- [ ] 通知用户（如果需要）
- [ ] 停用旧平台

## 常见问题

### Q: 迁移需要多长时间？

A: 通常 1-2 小时，包括：
- 代码更新：30 分钟
- 部署配置：30 分钟
- DNS 传播：最多 48 小时（通常几分钟）

### Q: 会有停机时间吗？

A: 不会。使用蓝绿部署：
1. 在 Cloudflare 部署新站点
2. 测试确认正常
3. 切换 DNS
4. 保持旧站点运行直到 DNS 完全传播

### Q: 数据会丢失吗？

A: 不会。数据存储在 Supabase，与部署平台无关。

### Q: 成本会增加吗？

A: 不会。Cloudflare Pages 免费额度通常足够使用。

## 获取帮助

- 查看 [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
- 查看 [快速开始指南](./QUICK_START_CLOUDFLARE.md)
- 在 GitHub 提交 Issue

---

**🎉 迁移完成后，享受 Cloudflare 的全球 CDN 和高性能！**
