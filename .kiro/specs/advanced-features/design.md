# 高级功能设计文档

## 概述

本文档描述了5个高级功能的技术设计：深色模式、新闻情绪指数、AI智能问答助手、投资组合追踪器和个性化仪表盘。这些功能将显著提升用户体验和平台的专业性。

## 架构

### 整体架构

```
┌─────────────────────────────────────────────────────────┐
│                     React 应用层                         │
├─────────────────────────────────────────────────────────┤
│  深色模式  │  情绪指数  │  AI助手  │  组合  │  仪表盘   │
├─────────────────────────────────────────────────────────┤
│              Context API (状态管理)                      │
├─────────────────────────────────────────────────────────┤
│  主题服务  │  情绪服务  │  聊天服务  │  组合服务  │  布局服务 │
├─────────────────────────────────────────────────────────┤
│              localStorage (数据持久化)                   │
└─────────────────────────────────────────────────────────┘
```

## 组件和接口

### 1. 深色模式

#### 组件结构
```
ThemeProvider (Context)
├── ThemeToggle (切换按钮)
└── App (应用根组件)
```

#### 接口定义

```typescript
// 主题类型
type Theme = 'light' | 'dark' | 'system';

// 主题上下文
interface ThemeContextType {
  theme: Theme;
  effectiveTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
}

// 主题服务
interface ThemeService {
  getTheme(): Theme;
  setTheme(theme: Theme): void;
  getSystemTheme(): 'light' | 'dark';
}
```

### 2. 新闻情绪指数

#### 组件结构
```
SentimentIndex (主组件)
├── SentimentGauge (仪表盘)
├── SentimentTrend (趋势图)
└── SentimentDetails (详情弹窗)
```

#### 数据模型

```typescript
// 情绪数据
interface SentimentData {
  score: number; // 0-100
  level: 'bearish' | 'neutral' | 'bullish'; // 悲观/中性/乐观
  timestamp: Date;
  distribution: {
    positive: number; // 正面新闻占比
    neutral: number;  // 中性新闻占比
    negative: number; // 负面新闻占比
  };
  keyFactors: string[]; // 关键影响因素
}

// 情绪历史
interface SentimentHistory {
  assetType: AssetType;
  data: Array<{
    date: string;
    score: number;
  }>;
}

// 情绪服务
interface SentimentService {
  calculateSentiment(analyses: NewsAnalysis[]): SentimentData;
  getSentimentHistory(assetType: AssetType, days: number): SentimentHistory;
  saveSentimentSnapshot(assetType: AssetType, data: SentimentData): void;
}
```

#### 情绪计算算法

```typescript
// 情绪分数计算公式
score = (
  (positiveCount * 100) + 
  (neutralCount * 50) + 
  (negativeCount * 0)
) / totalCount

// 加权计算（考虑置信度）
weightedScore = Σ(impact_score * confidence) / Σ(confidence)

// impact_score映射
positive → 100
neutral → 50
negative → 0
```

### 3. AI智能问答助手

#### 组件结构
```
AIChatAssistant (主组件)
├── ChatWindow (对话窗口)
├── MessageList (消息列表)
├── MessageBubble (消息气泡)
├── ChatInput (输入框)
└── DisclaimerBanner (免责声明)
```

#### 数据模型

```typescript
// 消息类型
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  context?: {
    assetType?: AssetType;
    newsCount?: number;
    priceData?: PricePoint[];
  };
}

// 对话历史
interface ChatHistory {
  messages: ChatMessage[];
  lastUpdated: Date;
}

// 聊天服务
interface ChatService {
  sendMessage(message: string, context: ChatContext): Promise<ChatMessage>;
  getChatHistory(): ChatHistory;
  saveChatHistory(history: ChatHistory): void;
  clearChatHistory(): void;
}

// 上下文数据
interface ChatContext {
  assetType: AssetType;
  recentNews: NewsItem[];
  recentAnalyses: NewsAnalysis[];
  currentPrice: number;
  priceChange: number;
}
```

#### AI Prompt 模板

```typescript
const buildChatPrompt = (
  userQuestion: string,
  context: ChatContext
): string => {
  return `你是一位专业的金融投资顾问。基于以下最新市场数据回答用户问题。

当前市场数据：
- 资产：${context.assetType === 'gold' ? '现货黄金' : '纳斯达克100'}
- 当前价格：${context.currentPrice}
- 24小时变化：${context.priceChange}%
- 最新新闻数量：${context.recentNews.length}条
- 整体市场情绪：${calculateOverallSentiment(context.recentAnalyses)}

用户问题：${userQuestion}

请提供：
1. 简洁明确的回答（150-200字）
2. 基于数据的分析依据
3. 具体的投资建议（如适用）

注意：
- 使用专业但易懂的语言
- 提供具体的数据支持
- 如果数据不足，明确说明
- 必须包含风险提示

返回JSON格式：
{
  "answer": "回答内容",
  "reasoning": "分析依据",
  "suggestion": "投资建议（可选）",
  "riskWarning": "风险提示"
}`;
};
```

### 4. 投资组合追踪器

#### 组件结构
```
PortfolioTracker (主组件)
├── PortfolioSummary (总览)
├── PositionList (持仓列表)
├── PositionCard (持仓卡片)
├── AddPositionModal (添加持仓弹窗)
├── EditPositionModal (编辑持仓弹窗)
├── PortfolioChart (组合图表)
│   ├── AssetAllocationPie (资产分布饼图)
│   └── PerformanceLine (收益曲线)
└── ExportButton (导出按钮)
```

#### 数据模型

```typescript
// 持仓
interface Position {
  id: string;
  assetType: AssetType;
  assetName: string; // "现货黄金" | "纳斯达克100"
  quantity: number;
  buyPrice: number;
  buyDate: Date;
  currentPrice?: number; // 实时更新
  currentValue?: number; // quantity * currentPrice
  profitLoss?: number; // currentValue - (quantity * buyPrice)
  profitLossPercent?: number; // (profitLoss / (quantity * buyPrice)) * 100
}

// 投资组合
interface Portfolio {
  positions: Position[];
  totalInvestment: number; // 总投资额
  currentValue: number; // 当前总价值
  totalProfitLoss: number; // 总盈亏
  totalProfitLossPercent: number; // 总收益率
  lastUpdated: Date;
}

// 组合历史
interface PortfolioHistory {
  date: string;
  value: number;
  profitLoss: number;
}

// 组合服务
interface PortfolioService {
  getPortfolio(): Portfolio;
  addPosition(position: Omit<Position, 'id'>): void;
  updatePosition(id: string, updates: Partial<Position>): void;
  deletePosition(id: string): void;
  calculatePortfolio(positions: Position[], prices: Map<AssetType, number>): Portfolio;
  getPortfolioHistory(days: number): PortfolioHistory[];
  exportPortfolio(): string; // JSON string
}
```

### 5. 个性化仪表盘

#### 组件结构
```
CustomDashboard (主组件)
├── DashboardGrid (网格布局)
├── DashboardCard (卡片容器)
│   ├── NewsListCard
│   ├── PriceChartCard
│   ├── SentimentCard
│   ├── PortfolioCard
│   ├── AIChatCard
│   └── MarketOverviewCard
├── CardSelector (卡片选择器)
├── LayoutControls (布局控制)
└── ConfigManager (配置管理)
```

#### 数据模型

```typescript
// 卡片类型
type CardType = 
  | 'news-list'
  | 'price-chart'
  | 'sentiment-index'
  | 'portfolio'
  | 'ai-chat'
  | 'market-overview';

// 卡片配置
interface DashboardCard {
  id: string;
  type: CardType;
  title: string;
  x: number; // 网格X坐标
  y: number; // 网格Y坐标
  w: number; // 宽度（网格单位）
  h: number; // 高度（网格单位）
  minW?: number; // 最小宽度
  minH?: number; // 最小高度
  config?: Record<string, any>; // 卡片特定配置
}

// 仪表盘布局
interface DashboardLayout {
  id: string;
  name: string;
  cards: DashboardCard[];
  createdAt: Date;
  updatedAt: Date;
}

// 仪表盘服务
interface DashboardService {
  getLayouts(): DashboardLayout[];
  getCurrentLayout(): DashboardLayout;
  saveLayout(layout: DashboardLayout): void;
  deleteLayout(id: string): void;
  setCurrentLayout(id: string): void;
  getDefaultLayout(): DashboardLayout;
}
```

## 错误处理

### 深色模式
- localStorage不可用：回退到系统主题
- 主题切换失败：显示错误提示，保持当前主题

### 情绪指数
- 新闻数据不足：显示"数据不足"提示
- 计算失败：使用默认中性值（50分）

### AI助手
- API调用失败：显示友好错误信息，建议重试
- 超时：10秒后显示超时提示
- 配额用完：提示用户稍后再试

### 投资组合
- 价格数据获取失败：使用上次缓存的价格
- localStorage满：提示用户清理数据
- 数据损坏：尝试恢复，失败则重置

### 仪表盘
- 布局数据损坏：恢复默认布局
- 拖拽失败：回退到原位置
- 保存失败：提示用户并保持当前状态

## 测试策略

### 单元测试
- 情绪计算算法测试
- 投资组合计算测试
- 主题切换逻辑测试
- localStorage操作测试

### 集成测试
- AI助手端到端对话测试
- 投资组合添加/编辑/删除流程测试
- 仪表盘拖拽和保存测试

### 用户体验测试
- 深色模式切换流畅性
- 响应式布局测试
- 移动端触摸操作测试

## 性能优化

1. **懒加载**：仪表盘卡片按需加载
2. **防抖**：AI助手输入防抖（500ms）
3. **缓存**：情绪指数计算结果缓存（5分钟）
4. **虚拟滚动**：投资组合列表超过20条时使用虚拟滚动
5. **Web Workers**：复杂计算（如组合历史）使用Worker

## 安全考虑

1. **数据验证**：所有localStorage数据读取前验证格式
2. **XSS防护**：AI回答内容进行HTML转义
3. **数据大小限制**：单个localStorage项不超过5MB
4. **敏感信息**：不在localStorage存储API密钥

## 部署计划

### 阶段1：基础功能（第1-2天）
- 深色模式
- 新闻情绪指数

### 阶段2：AI功能（第3-4天）
- AI智能问答助手

### 阶段3：投资工具（第5-6天）
- 投资组合追踪器

### 阶段4：高级功能（第7-8天）
- 个性化仪表盘

### 阶段5：优化和测试（第9-10天）
- 性能优化
- Bug修复
- 用户测试
