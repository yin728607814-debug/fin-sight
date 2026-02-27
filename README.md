# 🚀 FinSight AI

一个现代化的金融新闻分析 Web 应用，提供 AI 驱动的市场洞察和实时数据分析。

![FinSight AI](https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6)

## ✨ 功能特性

### 核心功能
- 📰 **实时金融新闻**: 聚合来自东方财富、新浪财经、Finnhub 等权威源的最新市场新闻
- 🤖 **AI 智能分析**: 使用 Google Gemini AI 分析新闻情感和市场影响
- 📊 **交互式图表**: 实时价格走势和技术指标可视化
- 📈 **多资产支持**: 黄金、纳斯达克100、A股等多种投资标的
- 🌐 **混合新闻策略**: 优先使用中文新闻源，必要时补充英文新闻并自动翻译

### 高级功能
- 🌓 **深色模式**: 支持浅色/深色/跟随系统三种主题模式
- 📉 **新闻情绪指数**: 基于 AI 分析的市场情绪量化指标（0-100分）
- 💬 **AI 投资顾问**: 智能问答助手，提供个性化投资建议
- 💼 **投资组合追踪**: 实时追踪持仓收益和盈亏情况
- 🎨 **个性化仪表盘**: 可拖拽的自定义布局，一站式查看所有信息

### 技术特性
- 🌐 **响应式设计**: 完美适配桌面和移动设备
- ⚡ **性能优化**: 路由懒加载、防抖节流、智能缓存
- 🛡️ **错误处理**: 全局错误边界、友好的错误提示
- 💾 **数据持久化**: Supabase 云端存储 + localStorage 本地缓存
- 🔄 **实时更新**: 自动刷新数据，把握市场脉搏
- 🔐 **API 密钥安全**: 后端代理保护敏感信息

## 🛠️ 技术栈

- **前端框架**: React 18 + TypeScript + Vite
- **样式方案**: Tailwind CSS
- **图表库**: Recharts
- **布局系统**: react-grid-layout
- **状态管理**: React Context + Hooks
- **数据验证**: Zod
- **HTTP 客户端**: Axios
- **AI 服务**: Google Gemini AI
- **数据库**: Supabase (PostgreSQL)
- **部署平台**: Cloudflare Pages + Functions

## 🚀 快速开始

### 环境要求
- Node.js 18+
- npm 或 yarn

### 1. 克隆项目
```bash
git clone https://github.com/yin728607814-debug/fin-sight.git
cd fin-sight
```

### 2. 安装依赖
```bash
npm install
```

### 3. 配置环境变量

创建 `.env` 文件：
```bash
cp .env.example .env
```

编辑 `.env` 文件，添加必要的 API 密钥：
```env
# Gemini AI（必需，用于 AI 分析）
GEMINI_API_KEY=your_gemini_api_key

# Supabase（必需，用于用户认证和数据存储）
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Finnhub（可选，用于英文新闻补充）
VITE_FINNHUB_API_KEY=your_finnhub_api_key
```

**新闻数据源说明**：
- **新浪财经**：通过 Cloudflare Functions 代理访问，无需 API 密钥
- **东方财富**：通过 Cloudflare Functions 代理访问，无需 API 密钥
- **Finnhub**：可选，用于补充英文新闻（需要 API 密钥）

应用会优先使用中文新闻源（新浪财经、东方财富），仅在需要时使用 Finnhub 补充英文新闻。

### 4. 启动开发服务器
```bash
npm run dev
```

### 5. 访问应用
打开 http://localhost:3000

## 🔑 API 密钥获取

| 服务 | 用途 | 是否必需 | 获取地址 | 免费额度 |
|------|------|----------|----------|----------|
| Gemini AI | AI 分析 | ✅ 必需 | https://ai.google.dev/ | 1500次/天 |
| Supabase | 数据存储和认证 | ✅ 必需 | https://supabase.com/ | 500MB 数据库 |
| Finnhub | 英文新闻补充 | ⭕ 可选 | https://finnhub.io/ | 60次/分钟 |
| 新浪财经 | 中文新闻 | ❌ 无需密钥 | 通过代理访问 | - |
| 东方财富 | 中文新闻 | ❌ 无需密钥 | 通过代理访问 | - |

**说明**：
- 新浪财经和东方财富的新闻数据通过 Cloudflare Functions 代理访问，无需申请 API 密钥
- Finnhub 仅在中文新闻源不足时用于补充英文新闻（会自动翻译），可选配置

## 🌐 部署到 Cloudflare Pages

### 快速部署（推荐）

1. **Fork 项目到你的 GitHub**

2. **登录 Cloudflare Dashboard**
   - 访问 https://dash.cloudflare.com/
   - 进入 **Workers & Pages**

3. **创建新项目**
   - 点击 **Create application**
   - 选择 **Pages** → **Connect to Git**
   - 选择你的 GitHub 仓库

4. **配置构建设置**
   ```
   Build command: npm run build
   Build output directory: dist
   ```

5. **设置环境变量**
   
   在 **Environment variables** 中添加：
   ```
   GEMINI_API_KEY=你的_Gemini_API_密钥
   VITE_SUPABASE_URL=你的_Supabase_URL
   VITE_SUPABASE_ANON_KEY=你的_Supabase_匿名密钥
   VITE_FINNHUB_API_KEY=你的_Finnhub_API_密钥（可选）
   ```
   
   **注意**：
   - `GEMINI_API_KEY` 和 Supabase 配置是必需的
   - `VITE_FINNHUB_API_KEY` 是可选的，仅用于补充英文新闻
   - 新浪财经和东方财富无需配置，通过 Functions 代理访问

6. **部署**
   - 点击 **Save and Deploy**
   - 等待 1-2 分钟完成部署

### 详细部署指南

查看完整的部署文档：
- [快速开始指南](./docs/deployment/QUICK_START_CLOUDFLARE.md)
- [详细部署指南](./docs/deployment/CLOUDFLARE_DEPLOY_GUIDE.md)
- [迁移指南](./docs/deployment/CLOUDFLARE_MIGRATION.md)

## 📜 可用脚本

```bash
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm run preview      # 预览生产构建
npm run lint         # 代码检查
npm run type-check   # TypeScript 类型检查
npm run test         # 运行测试
npm run clean        # 清理构建文件
```

## 🏗️ 项目结构

```
fin-sight/
├── components/              # React 组件
│   ├── NewsAnalyzer.tsx    # 新闻分析组件
│   ├── TrendChart.tsx      # 价格图表组件
│   ├── SentimentIndex.tsx  # 情绪指数组件
│   ├── ChatWindow.tsx      # AI 聊天窗口
│   └── ...
├── pages/                  # 页面组件
│   ├── HomePage.tsx        # 首页
│   ├── NasdaqAnalysisPage.tsx # 纳斯达克分析页
│   ├── GoldAnalysisPage.tsx   # 黄金分析页
│   ├── AStockAnalysisPage.tsx # A股分析页
│   └── ...
├── services/               # API 服务
│   ├── newsService.ts      # 新闻服务
│   ├── priceService.ts     # 价格服务
│   ├── analysisService.ts  # AI 分析服务
│   └── ...
├── functions/              # Cloudflare Functions
│   └── api/
│       └── gemini-analysis.ts # Gemini AI 代理
├── utils/                  # 工具函数
│   ├── context.tsx         # 全局状态管理
│   └── ...
├── types.ts               # TypeScript 类型
└── dist/                  # 构建输出
```

## 🔐 安全特性

### API 密钥保护
- ✅ Gemini API 密钥只在服务器端使用
- ✅ 所有 AI 分析请求通过后端代理 (`/api/gemini-analysis`)
- ✅ 前端代码中不包含任何敏感 API 密钥
- ✅ 环境变量通过 Cloudflare Dashboard 安全管理

### 数据安全
- ✅ Supabase Row Level Security (RLS) 保护用户数据
- ✅ HTTPS 加密传输
- ✅ 用户认证和授权机制

查看完整的安全审计报告：[SECURITY_AUDIT.md](./SECURITY_AUDIT.md)

## 🔧 开发说明

### 环境检测
应用会自动检测运行环境：
- **开发环境**: 使用本地配置和演示数据
- **生产环境**: 使用真实 API 和云端数据

### API 代理机制
- Gemini AI 调用通过 Cloudflare Functions 代理，保护 API 密钥
- 新闻数据通过以下代理获取：
  - `/sina-news-proxy`: 新浪财经新闻（中文）
  - `/eastmoney-news-proxy`: 东方财富美股新闻（中文）
  - `/eastmoney-gold-proxy`: 东方财富黄金新闻（中文）
  - `/api/finnhub-news-proxy`: Finnhub 新闻（英文，可选）
- 确保 API 密钥安全，避免暴露到前端

## 📊 功能演示

### 1. AI 市场分析
- 实时分析最新金融新闻
- 评估市场情绪和影响
- 提供投资建议和趋势预测
- 支持黄金、纳斯达克100、A股等多个市场

### 2. 新闻情绪指数
- 基于 AI 分析的市场情绪量化（0-100分）
- 圆形仪表盘可视化
- 7天历史趋势图
- 情绪分布和关键影响因素

### 3. AI 投资顾问
- 智能问答，结合最新新闻和价格数据
- 多轮对话上下文管理
- 快速问题建议
- 对话历史持久化

### 4. 投资组合追踪
- 持仓管理（添加、编辑、删除）
- 实时价格更新和盈亏计算
- 资产分布饼图
- 30天收益曲线图

### 5. 个性化仪表盘
- 可拖拽的网格布局
- 多种卡片类型
- 多布局管理
- 布局持久化

## 🐛 故障排除

### 常见问题

**Q: AI 分析不工作？**
A: 检查以下几点：
- Cloudflare Dashboard 中是否正确设置了 `GEMINI_API_KEY`
- 查看 Functions 日志是否有错误
- 确认 API 密钥有效且未超出配额

**Q: 用户登录失败？**
A: 检查 Supabase 配置：
- `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY` 是否正确
- Supabase 项目是否正常运行
- 检查浏览器控制台错误信息

**Q: 构建失败？**
A: 尝试以下解决方案：
```bash
# 清理依赖重新安装
rm -rf node_modules package-lock.json
npm install

# 检查 Node.js 版本
node --version  # 需要 18+
```

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🌟 致谢

- [Google Gemini](https://ai.google.dev/) - AI 分析服务
- [Supabase](https://supabase.com/) - 数据库和认证
- [Cloudflare Pages](https://pages.cloudflare.com/) - 部署平台
- [东方财富](https://www.eastmoney.com/) - 新闻数据源
- [新浪财经](https://finance.sina.com.cn/) - 新闻数据源

---

**🌟 如果这个项目对你有帮助，请给个 Star 支持一下！**

[![Deploy to Cloudflare Pages](https://deploy.workers.cloudflare.com/button)](https://dash.cloudflare.com/)
