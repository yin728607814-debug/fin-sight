# 部署指南

本文档描述了投资新闻分析器应用的部署配置和流程。

## ✅ 快速部署状态

**当前状态**: 已配置完成，可以直接部署  
**构建状态**: ✅ 通过 (0.52MB, 7个文件)  
**配置状态**: ✅ Netlify配置完整  

## 🚀 Netlify 部署

### 自动部署设置

1. **连接 Git 仓库**
   - 在 Netlify 控制台中连接你的 GitHub/GitLab 仓库
   - 选择主分支进行自动部署

2. **构建设置**
   - 构建命令: `npm run build`
   - 发布目录: `dist`
   - Node.js 版本: `18`

### 环境变量配置

在 Netlify 控制台的 "Site settings" > "Environment variables" 中设置以下变量：

```bash
# 必需的 API 密钥
GEMINI_API_KEY=your_gemini_api_key_here
NEWS_API_KEY=your_news_api_key_here
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_api_key_here

# 应用配置
VITE_APP_TITLE=Investment News Analyzer
VITE_APP_VERSION=1.0.0

# 可选配置
VITE_API_TIMEOUT=10000
VITE_API_RETRY_ATTEMPTS=3
VITE_CACHE_TIMEOUT=300000
```

### 部署优化功能

我们的 `netlify.toml` 配置包含以下优化：

- **静态资源缓存**: JS/CSS/字体文件缓存1年
- **安全头部**: 防止XSS、点击劫持等安全问题
- **SPA路由**: 支持React Router的客户端路由
- **压缩优化**: 自动压缩CSS和JS文件
- **环境区分**: 生产/预览/开发环境的不同配置

## 🛠️ 本地部署测试

### 1. 部署前检查

运行完整的部署前检查：

```bash
npm run deploy:check
```

这会检查：
- 代码质量和类型安全
- 测试覆盖率
- 构建配置
- 环境变量设置
- 构建产物大小

### 2. 本地构建测试

```bash
# 生产环境构建
npm run build:prod

# 预览构建结果
npm run preview
```

### 3. 性能分析

```bash
# 分析构建包大小
npm run build:analyze
```

## 📊 性能监控

应用内置了性能监控功能：

- **页面加载时间**: 自动记录首屏加载性能
- **API响应时间**: 监控所有API调用的响应时间
- **错误跟踪**: 自动捕获和记录JavaScript错误
- **资源加载**: 监控静态资源的加载性能

在生产环境中，这些数据会被自动收集。开发环境下会在控制台输出详细信息。

## 🔧 构建优化

### 代码分割

我们实现了智能的代码分割策略：

- **React核心**: React和ReactDOM单独打包
- **路由库**: React Router单独打包
- **图表库**: Chart.js相关库单独打包
- **工具库**: Axios、date-fns等工具库单独打包

这样可以：
- 提高缓存效率
- 减少初始加载时间
- 支持按需加载

### 资源优化

- **图片内联**: 小于4KB的图片自动内联为base64
- **Tree Shaking**: 自动移除未使用的代码
- **压缩优化**: 生产环境自动压缩代码
- **Source Map**: 开发环境提供调试支持

## 🚨 故障排除

### 常见部署问题

1. **构建失败**
   ```bash
   # 清理缓存重新构建
   npm run clean
   npm run build
   ```

2. **环境变量未生效**
   - 检查 Netlify 控制台中的环境变量设置
   - 确保变量名称正确（区分大小写）
   - 重新部署以应用新的环境变量

3. **路由404错误**
   - 确保 `netlify.toml` 中的重定向规则正确
   - 检查 React Router 配置

4. **API调用失败**
   - 检查API密钥是否正确设置
   - 验证CORS配置
   - 查看浏览器控制台的网络请求

### 调试工具

1. **构建日志**: 在 Netlify 控制台查看详细的构建日志
2. **函数日志**: 如果使用Netlify Functions，查看函数执行日志
3. **性能监控**: 使用内置的性能监控工具分析问题

## 📈 部署最佳实践

1. **分支策略**
   - `main` 分支自动部署到生产环境
   - 功能分支创建预览部署
   - 使用Pull Request进行代码审查

2. **环境管理**
   - 生产环境使用真实API密钥
   - 预览环境使用测试API密钥
   - 开发环境使用本地配置

3. **监控和维护**
   - 定期检查构建状态
   - 监控应用性能指标
   - 及时更新依赖包

4. **安全考虑**
   - 不要在代码中硬编码API密钥
   - 使用环境变量管理敏感信息
   - 定期轮换API密钥

## 📞 支持

如果遇到部署问题，请：

1. 检查本文档的故障排除部分
2. 查看 Netlify 构建日志
3. 运行本地部署检查脚本
4. 查看应用的性能监控数据

---

*最后更新: 2024年12月*