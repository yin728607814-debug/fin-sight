# Cloudflare Pages 快速开始

## 🚀 5 分钟部署指南

### 步骤 1: 准备 Gemini API 密钥
1. 访问 https://ai.google.dev/
2. 点击 "Get API key"
3. 创建或选择一个项目
4. 复制 API 密钥（格式：`AIzaSy...`）

### 步骤 2: 连接 GitHub 到 Cloudflare
1. 登录 https://dash.cloudflare.com/
2. 点击左侧 **Workers & Pages**
3. 点击 **Create application**
4. 选择 **Pages** 标签
5. 点击 **Connect to Git**
6. 授权 Cloudflare 访问你的 GitHub
7. 选择仓库：`yin728607814-debug/krio-test`

### 步骤 3: 配置构建设置
```
Project name: investment-portfolio (或你喜欢的名字)
Production branch: main
Build command: npm run build
Build output directory: dist
```

### 步骤 4: 设置环境变量
点击 **Environment variables**，添加：

**Production 环境**:
```
GEMINI_API_KEY = 你的_Gemini_API_密钥
```

### 步骤 5: 部署
1. 点击 **Save and Deploy**
2. 等待 1-2 分钟
3. 部署完成后，点击提供的 URL（例如：`investment-portfolio.pages.dev`）

### 步骤 6: 验证
1. 打开网站
2. 进入任意分析页面（黄金/纳斯达克/A股）
3. 点击 "刷新新闻并分析"
4. 检查 AI 分析是否正常工作

## ✅ 验证 API 密钥安全

打开浏览器开发者工具（F12）：

1. **Network 标签**
   - 刷新页面
   - 查看所有请求
   - 搜索 `AIzaSy`
   - ✅ 应该找不到（密钥在服务器端）

2. **Sources 标签**
   - 展开所有 JavaScript 文件
   - 搜索 `AIzaSy`
   - ✅ 应该找不到

3. **Console 标签**
   - 查看日志
   - ✅ 不应该有 API 密钥相关的输出

## 🔧 故障排查

### 问题 1: 构建失败
**错误**: `npm install` 失败

**解决**:
1. 检查 `package.json` 是否正确
2. 在 Cloudflare Dashboard 中查看构建日志
3. 确认 Node.js 版本兼容（推荐 18.x 或 20.x）

### 问题 2: AI 分析不工作
**错误**: 点击分析按钮没有反应

**解决**:
1. 检查浏览器控制台是否有错误
2. 确认 `GEMINI_API_KEY` 已在 Cloudflare Dashboard 中设置
3. 检查 Functions 日志：Dashboard → Pages → 你的项目 → Functions

### 问题 3: 404 错误
**错误**: 访问 `/api/gemini-analysis` 返回 404

**解决**:
1. 确认 `functions/api/gemini-analysis.ts` 文件存在
2. 重新部署项目
3. 检查 Cloudflare Dashboard 中的 Functions 列表

## 📊 监控和日志

### 查看实时日志
1. Cloudflare Dashboard → Pages → 你的项目
2. 点击 **Functions** 标签
3. 查看实时请求和错误日志

### 查看分析数据
1. Cloudflare Dashboard → Analytics
2. 查看：
   - 请求量
   - 带宽使用
   - 错误率
   - 响应时间

## 🎯 下一步

### 配置自定义域名
1. 在 Pages 项目中，点击 **Custom domains**
2. 点击 **Set up a custom domain**
3. 输入你的域名（例如：`portfolio.example.com`）
4. 按照提示配置 DNS 记录

### 启用预览部署
Cloudflare Pages 会自动为每个 Pull Request 创建预览部署：
- 每个 PR 都有独立的 URL
- 可以在合并前测试更改
- 预览环境使用相同的环境变量

### 设置通知
1. Cloudflare Dashboard → Notifications
2. 添加通知规则：
   - 部署成功/失败
   - Functions 错误
   - 流量异常

## 💡 提示

1. **免费版限制**
   - 500 次构建/月
   - 无限请求
   - 无限带宽
   - 100,000 次 Functions 调用/天

2. **性能优化**
   - Cloudflare 自动优化图片
   - 自动压缩 HTML/CSS/JS
   - 全球 CDN 加速

3. **安全性**
   - 自动 HTTPS
   - DDoS 防护
   - Web Application Firewall (WAF)

## 📚 更多资源

- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
- [Cloudflare Functions 文档](https://developers.cloudflare.com/pages/functions/)
- [项目迁移指南](./CLOUDFLARE_MIGRATION.md)
- [详细部署指南](./CLOUDFLARE_DEPLOY_GUIDE.md)
- [安全审计报告](./SECURITY_AUDIT.md)

## 🆘 需要帮助？

- [Cloudflare Community](https://community.cloudflare.com/)
- [Cloudflare Discord](https://discord.gg/cloudflaredev)
- [提交 Support Ticket](https://dash.cloudflare.com/?to=/:account/support)
