# Cloudflare Pages 部署指南

## ⚠️ 重要：API 密钥安全

### 已修复的安全问题
1. ✅ 移除了前端代码中的 `VITE_GEMINI_API_KEY`
2. ✅ 所有 Gemini API 调用现在通过后端代理 (`/api/gemini-analysis`)
3. ✅ API 密钥只在服务器端使用，不会暴露到前端

### 需要删除的敏感文件
以下文件包含 API 密钥，**不要提交到 Git**：
- `.env`
- `NETLIFY_ENV_IMPORT.txt`

这些文件已经在 `.gitignore` 中，但如果之前已经提交，需要从 Git 历史中删除：

```bash
# 从 Git 历史中删除敏感文件
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch NETLIFY_ENV_IMPORT.txt .env" \
  --prune-empty --tag-name-filter cat -- --all

# 强制推送（⚠️ 谨慎操作）
git push origin --force --all
```

## 部署步骤

### 1. 准备代码
```bash
# 确保所有更改已提交
git add -A
git commit -m "feat: 迁移到 Cloudflare Pages，确保 API 密钥安全"
git push
```

### 2. 在 Cloudflare 创建项目

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 **Pages**
3. 点击 **Create a project**
4. 选择 **Connect to Git**
5. 授权并选择你的 GitHub 仓库

### 3. 配置构建设置

**Framework preset**: None (或 Vite)

**Build configuration**:
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: `/` (默认)

**Environment variables** (Production):
```
GEMINI_API_KEY=你的_Gemini_API_密钥
```

**Environment variables** (Preview - 可选):
```
GEMINI_API_KEY=你的_测试_Gemini_API_密钥
```

### 4. 部署

点击 **Save and Deploy**，Cloudflare 会自动：
1. 克隆你的仓库
2. 安装依赖 (`npm install`)
3. 构建项目 (`npm run build`)
4. 部署到全球 CDN

### 5. 配置自定义域名（可选）

1. 在 Pages 项目中，进入 **Custom domains**
2. 点击 **Set up a custom domain**
3. 输入你的域名
4. 按照提示配置 DNS

## Functions 说明

### 已创建的 Cloudflare Pages Functions

#### `/api/gemini-analysis`
- **用途**: Gemini AI 分析代理
- **方法**: POST
- **请求体**:
  ```json
  {
    "prompt": "分析内容",
    "temperature": 0.7,
    "maxOutputTokens": 2048
  }
  ```
- **响应**:
  ```json
  {
    "success": true,
    "data": "AI 分析结果"
  }
  ```

### 需要转换的 Netlify Functions

以下 Netlify Functions 需要手动转换为 Cloudflare Pages Functions：

1. `netlify/functions/eastmoney-news-proxy.js` → `functions/api/eastmoney-news.js`
2. `netlify/functions/eastmoney-gold-proxy.js` → `functions/api/eastmoney-gold.js`
3. `netlify/functions/sina-news-proxy.js` → `functions/api/sina-news.js`
4. `netlify/functions/finnhub-news-proxy.js` → `functions/api/finnhub-news.js`
5. 其他 proxy functions...

**注意**: Cloudflare Pages Functions 不支持 Node.js 的 `require()`，需要使用 ES modules 或 Web APIs。

## 验证部署

### 1. 检查 Functions
访问: `https://your-site.pages.dev/api/gemini-analysis`
应该返回 405 错误（因为需要 POST 请求）

### 2. 检查前端
访问: `https://your-site.pages.dev`
应该能正常加载页面

### 3. 测试 AI 分析
在页面中触发 AI 分析功能，检查：
- 网络请求是否正常
- 是否有 API 密钥暴露
- AI 分析是否正常工作

### 4. 检查 API 密钥安全
打开浏览器开发者工具：
1. **Network** 标签：检查请求头和响应，不应该看到 `AIzaSy` 开头的密钥
2. **Sources** 标签：搜索 `AIzaSy`，不应该在任何 JS 文件中找到
3. **Console** 标签：不应该有 API 密钥相关的日志

## 故障排查

### Functions 不工作
1. 检查 Cloudflare Dashboard 中的 Functions 日志
2. 确认环境变量已正确设置
3. 检查 Functions 代码是否有语法错误

### API 密钥错误
1. 在 Cloudflare Dashboard 中重新设置 `GEMINI_API_KEY`
2. 重新部署项目

### 构建失败
1. 检查 `package.json` 中的依赖
2. 确认 Node.js 版本兼容
3. 查看构建日志中的错误信息

## 性能优化

### Cloudflare Pages 优势
- ✅ 全球 CDN 加速
- ✅ 自动 HTTPS
- ✅ 无限带宽（免费版）
- ✅ 快速部署（通常 < 1 分钟）
- ✅ 自动预览部署（每个 PR）

### 注意事项
- Functions 有执行时间限制（免费版 10ms CPU 时间）
- 如果需要更长执行时间，考虑使用 Cloudflare Workers
- 大文件上传可能需要额外配置

## 回滚

如果需要回滚到之前的版本：
1. 在 Cloudflare Dashboard 中进入 **Deployments**
2. 找到之前的成功部署
3. 点击 **Rollback to this deployment**

## 监控

### 查看日志
1. Cloudflare Dashboard → Pages → 你的项目
2. 点击 **Functions** 标签
3. 查看实时日志和错误

### 分析流量
1. Cloudflare Dashboard → Analytics
2. 查看请求量、带宽使用等

## 成本

### 免费版限制
- 500 次构建/月
- 无限请求
- 无限带宽
- 100,000 次 Functions 调用/天

### 升级选项
如果需要更多资源，可以升级到 Pro 或 Business 计划。

## 支持

如果遇到问题：
1. 查看 [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
2. 访问 [Cloudflare Community](https://community.cloudflare.com/)
3. 提交 Support Ticket
