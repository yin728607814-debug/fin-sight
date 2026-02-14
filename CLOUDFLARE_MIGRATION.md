# Cloudflare Pages 迁移指南

## 改造目标
1. 从 Netlify 迁移到 Cloudflare Pages
2. 确保 GEMINI_API_KEY 不暴露到前端
3. 将所有 Netlify Functions 转换为 Cloudflare Pages Functions

## 主要变更

### 1. API 密钥安全
- ❌ **之前**: `VITE_GEMINI_API_KEY` 暴露在前端代码中
- ✅ **现在**: `GEMINI_API_KEY` 只在服务器端使用

### 2. Functions 目录结构
- ❌ **之前**: `netlify/functions/`
- ✅ **现在**: `functions/`

### 3. Functions 语法
Cloudflare Pages Functions 使用不同的语法：

```typescript
// Netlify Functions
exports.handler = async (event, context) => {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data })
  };
};

// Cloudflare Pages Functions
export async function onRequest(context) {
  return new Response(JSON.stringify({ data }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
```

### 4. 环境变量
在 Cloudflare Pages 设置中配置：
- `GEMINI_API_KEY` - Gemini API 密钥（服务器端）
- `VITE_SUPABASE_URL` - Supabase URL（前端）
- `VITE_SUPABASE_ANON_KEY` - Supabase 匿名密钥（前端）
- `VITE_FINNHUB_API_KEY` - Finnhub API 密钥（前端，可选）

## 迁移步骤

### 1. 创建 Cloudflare Pages Functions
```bash
mkdir -p functions/api
```

### 2. 转换现有 Functions
- `netlify/functions/eastmoney-news-proxy.js` → `functions/api/eastmoney-news.js`
- `netlify/functions/eastmoney-gold-proxy.js` → `functions/api/eastmoney-gold.js`
- `netlify/functions/sina-news-proxy.js` → `functions/api/sina-news.js`
- 创建新的 `functions/api/gemini-analysis.js` 用于 AI 分析

### 3. 更新前端代码
- 移除 `config.apiKeys.gemini` 的使用
- 所有 AI 分析请求改为调用 `/api/gemini-analysis`

### 4. 部署配置
创建 `wrangler.toml` 或在 Cloudflare Pages 控制台配置：
- Build command: `npm run build`
- Build output directory: `dist`
- Environment variables: 在控制台设置

## 部署到 Cloudflare Pages

### 方式 1: 通过 Git 集成（推荐）
1. 登录 Cloudflare Dashboard
2. 进入 Pages
3. 点击 "Create a project"
4. 连接 GitHub 仓库
5. 配置构建设置：
   - Build command: `npm run build`
   - Build output directory: `dist`
6. 添加环境变量
7. 点击 "Save and Deploy"

### 方式 2: 通过 Wrangler CLI
```bash
npm install -g wrangler
wrangler login
wrangler pages deploy dist
```

## 测试清单
- [ ] 所有 API Functions 正常工作
- [ ] AI 分析功能正常
- [ ] 新闻获取正常
- [ ] 价格数据获取正常
- [ ] 环境变量正确配置
- [ ] API 密钥未暴露到前端
- [ ] 生产环境部署成功

## 注意事项
1. Cloudflare Pages Functions 有执行时间限制（免费版 10ms CPU 时间）
2. 如果需要更长的执行时间，考虑使用 Cloudflare Workers
3. 确保所有敏感信息都在服务器端处理
