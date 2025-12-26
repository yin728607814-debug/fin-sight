# 🚀 Investment News Analyzer

一个现代化的金融新闻分析Web应用，提供AI驱动的市场洞察和实时数据分析。

![Investment News Analyzer](https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6)

## ✨ 功能特性

### 核心功能
- 📰 **实时金融新闻**: 聚合来自多个权威源的最新市场新闻
- 🤖 **AI智能分析**: 使用Google Gemini AI分析新闻情感和市场影响
- 📊 **交互式图表**: 实时价格走势和技术指标可视化
- 📈 **多资产支持**: 黄金、纳斯达克等多种投资标的

### 高级功能
- 🌓 **深色模式**: 支持浅色/深色/跟随系统三种主题模式
- 📉 **新闻情绪指数**: 基于AI分析的市场情绪量化指标（0-100分）
- 💬 **AI投资顾问**: 智能问答助手，提供个性化投资建议
- 💼 **投资组合追踪**: 实时追踪持仓收益和盈亏情况
- 🎨 **个性化仪表盘**: 可拖拽的自定义布局，一站式查看所有信息

### 技术特性
- 🌐 **响应式设计**: 完美适配桌面和移动设备
- ⚡ **性能优化**: 路由懒加载、防抖节流、智能缓存
- 🛡️ **错误处理**: 全局错误边界、友好的错误提示
- 💾 **数据持久化**: localStorage自动保存用户配置和数据
- 🔄 **实时更新**: 自动刷新数据，把握市场脉搏

## 🛠️ 技术栈

- **前端框架**: React 18 + TypeScript + Vite
- **样式方案**: Tailwind CSS
- **图表库**: Recharts
- **布局系统**: react-grid-layout
- **状态管理**: React Context + Hooks
- **数据验证**: Zod
- **HTTP客户端**: Axios
- **AI服务**: Google Gemini AI
- **部署平台**: Netlify + Serverless Functions

## 🚀 快速开始

### 环境要求
- Node.js 18+
- npm 或 yarn

### 1. 克隆项目
```bash
git clone https://github.com/your-username/investment-news-analyzer.git
cd investment-news-analyzer
```

### 2. 安装依赖
```bash
npm install
```

### 3. 配置API密钥

**方法1: 使用配置向导 (推荐)**
```bash
npm run setup
```

**方法2: 手动配置**
```bash
cp .env.example .env
# 编辑 .env 文件，添加你的API密钥
```

### 4. 启动开发服务器
```bash
npm run dev
```

### 5. 访问应用
打开 http://localhost:3001

## 🔑 API密钥获取

| 服务 | 用途 | 获取地址 | 免费额度 |
|------|------|----------|----------|
| News API | 金融新闻 | https://newsapi.org/ | 1000次/天 |
| Alpha Vantage | 价格数据 | https://www.alphavantage.co/ | 500次/天 |
| Gemini AI | 智能分析 | https://ai.google.dev/ | 1500次/天 |

## 🌐 部署到Netlify

### 方法1: 拖拽部署 (最简单)

1. **构建项目**
   ```bash
   npm run build
   ```

2. **部署到Netlify**
   - 访问 [netlify.com](https://netlify.com)
   - 拖拽 `dist` 文件夹到部署区域

3. **配置环境变量**
   在Netlify控制台添加：
   ```
   NEWS_API_KEY=your_news_api_key
   ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key
   GEMINI_API_KEY=your_gemini_key
   ```

### 方法2: Git自动部署

1. **推送到GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **连接Netlify**
   - 在Netlify选择"New site from Git"
   - 连接GitHub仓库
   - 自动检测构建设置

## 📜 可用脚本

```bash
npm run dev          # 启动开发服务器 (localhost:3001)
npm run build        # 构建生产版本
npm run preview      # 预览生产构建
npm run setup        # 交互式API密钥配置
npm run clean        # 清理构建文件
npm run lint         # 代码检查
npm run type-check   # TypeScript类型检查
npm run test         # 运行测试
```

## 🏗️ 项目结构

```
investment-news-analyzer/
├── components/              # React组件
│   ├── NewsAnalyzer.tsx    # 新闻分析组件
│   ├── TrendChart.tsx      # 价格图表组件
│   ├── ThemeToggle.tsx     # 主题切换组件
│   ├── SentimentIndex.tsx  # 情绪指数组件
│   ├── ChatWindow.tsx      # AI聊天窗口
│   ├── PortfolioSummary.tsx # 投资组合总览
│   ├── DashboardGrid.tsx   # 仪表盘网格
│   ├── ErrorBoundary.tsx   # 错误边界
│   └── dashboard/          # 仪表盘卡片
│       ├── NewsListCard.tsx
│       ├── PriceChartCard.tsx
│       ├── SentimentCard.tsx
│       ├── PortfolioCard.tsx
│       ├── AIChatCard.tsx
│       └── MarketOverviewCard.tsx
├── pages/                  # 页面组件
│   ├── HomePage.tsx        # 首页
│   ├── NasdaqAnalysisPage.tsx # 纳斯达克分析页
│   ├── GoldAnalysisPage.tsx   # 黄金分析页
│   ├── AIChatPage.tsx      # AI助手页
│   ├── PortfolioPage.tsx   # 投资组合页
│   └── DashboardPage.tsx   # 仪表盘页
├── services/               # API服务
│   ├── newsService.ts      # 新闻服务
│   ├── priceService.ts     # 价格服务
│   ├── analysisService.ts  # 分析服务
│   ├── sentimentService.ts # 情绪服务
│   ├── chatService.ts      # 聊天服务
│   ├── portfolioService.ts # 投资组合服务
│   ├── dashboardService.ts # 仪表盘服务
│   └── themeService.ts     # 主题服务
├── utils/                  # 工具函数
│   ├── context.tsx         # 全局状态管理
│   ├── ThemeContext.tsx    # 主题上下文
│   └── performance.ts      # 性能优化工具
├── netlify/functions/      # Netlify函数
│   └── news-proxy.js       # 新闻API代理
├── types.ts               # TypeScript类型
└── dist/                  # 构建输出
```

## 🔧 开发说明

### 本地开发 vs 生产环境

| 环境 | 数据源 | 说明 |
|------|--------|------|
| 本地开发 | 演示数据 | 浏览器CORS限制，显示模拟数据 |
| 生产环境 | 真实API | 通过Netlify函数代理，获取真实数据 |

### API代理机制
- 浏览器无法直接调用News API（CORS限制）
- 使用Netlify Functions作为代理服务器
- 自动检测环境并选择合适的数据源

## 🐛 故障排除

### 常见问题

**Q: 为什么本地显示"演示数据"？**
A: 这是正常现象。浏览器安全限制导致无法直接调用News API，部署后会自动使用真实数据。

**Q: API调用失败怎么办？**
A: 检查以下几点：
- API密钥是否正确配置
- 是否超出免费限制
- 网络连接是否正常

**Q: 构建失败怎么办？**
A: 尝试以下解决方案：
```bash
# 清理依赖重新安装
rm -rf node_modules package-lock.json
npm install

# 检查Node.js版本
node --version  # 需要18+
```

## 📊 功能演示

### 1. 深色模式
- 三种主题模式：浅色、深色、跟随系统
- 全站适配，所有组件支持
- localStorage持久化，记住用户偏好

### 2. 新闻情绪指数
- 基于AI分析的市场情绪量化（0-100分）
- 圆形仪表盘可视化
- 7天历史趋势图
- 情绪分布和关键影响因素分析

### 3. AI投资顾问
- 智能问答，结合最新新闻和价格数据
- 多轮对话上下文管理
- 快速问题建议
- 对话历史持久化

### 4. 投资组合追踪
- 持仓管理（添加、编辑、删除）
- 实时价格更新和盈亏计算
- 资产分布饼图
- 30天收益曲线图
- 投资组合统计信息
- 导出功能（JSON格式）

### 5. 个性化仪表盘
- 可拖拽的网格布局
- 6种卡片类型：新闻列表、价格图表、情绪指数、投资组合、AI助手、市场概览
- 多布局管理（最多5个自定义布局）
- 布局持久化和重置功能

### 6. 新闻分析
- 实时获取金融新闻
- AI情感分析（积极/消极/中性）
- 影响预测和置信度评分

### 7. 价格图表
- 5天价格走势
- 技术指标显示
- 交互式图表操作

### 8. 智能洞察
- 市场趋势分析
- 新闻事件影响评估
- 投资建议生成

## 🤝 贡献指南

欢迎提交Issue和Pull Request！

1. Fork项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启Pull Request

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🌟 致谢

- [News API](https://newsapi.org/) - 新闻数据源
- [Alpha Vantage](https://www.alphavantage.co/) - 金融数据API
- [Google Gemini](https://ai.google.dev/) - AI分析服务
- [Netlify](https://netlify.com/) - 部署平台

---

**🌟 如果这个项目对你有帮助，请给个Star支持一下！**

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/your-username/investment-news-analyzer)