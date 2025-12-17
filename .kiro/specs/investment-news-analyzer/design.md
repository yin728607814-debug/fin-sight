# Investment News Analyzer Design Document

## Overview

投资新闻分析器是一个基于React和TypeScript的单页面应用，旨在为投资者提供实时的金融新闻分析和价格趋势可视化。系统采用现代Web技术栈，集成多个金融数据API，并利用AI技术进行新闻影响分析。

应用将部署在Netlify平台上，提供快速、可靠的用户体验。系统支持现货黄金和纳斯达克100两个主要投资产品，为每个产品提供专门的新闻分析和价格趋势展示。

## Architecture

### 系统架构
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Gateway    │    │  External APIs  │
│   (React/TS)    │◄──►│   (Netlify       │◄──►│  - News API     │
│                 │    │    Functions)    │    │  - Finance API  │
│                 │    │                  │    │  - AI Analysis  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### 技术栈选择
- **前端框架**: React 18 with TypeScript
- **状态管理**: React Context + useReducer
- **图表库**: Chart.js with react-chartjs-2
- **样式**: Tailwind CSS
- **构建工具**: Vite
- **部署平台**: Netlify
- **后端服务**: Netlify Functions (Serverless)

### API集成策略
- **新闻数据**: NewsAPI 或 Alpha Vantage News API
- **金融数据**: Alpha Vantage API 或 Yahoo Finance API
- **AI分析**: OpenAI GPT API 或 Google Gemini API

## Components and Interfaces

### 核心组件结构

#### 1. 应用层组件
```typescript
// App.tsx - 主应用组件
interface AppProps {}

// Router.tsx - 路由管理
interface Route {
  path: string;
  component: React.ComponentType;
  title: string;
}
```

#### 2. 页面组件
```typescript
// GoldAnalysisPage.tsx - 现货黄金分析页面
interface GoldAnalysisPageProps {}

// NasdaqAnalysisPage.tsx - 纳斯达克100分析页面  
interface NasdaqAnalysisPageProps {}

// HomePage.tsx - 首页导航
interface HomePageProps {}
```

#### 3. 功能组件
```typescript
// NewsAnalyzer.tsx - 新闻分析组件
interface NewsAnalyzerProps {
  assetType: 'gold' | 'nasdaq';
  onAnalysisComplete?: (analysis: NewsAnalysis[]) => void;
}

// TrendChart.tsx - 价格趋势图表
interface TrendChartProps {
  data: PriceData[];
  assetType: 'gold' | 'nasdaq';
  timeRange: number; // 天数
}

// NewsList.tsx - 新闻列表展示
interface NewsListProps {
  news: NewsItem[];
  analysis: NewsAnalysis[];
  loading: boolean;
}

// ImpactIndicator.tsx - 影响指示器
interface ImpactIndicatorProps {
  impact: 'positive' | 'negative' | 'neutral';
  confidence: number;
  summary: string;
}
```

## Data Models

### 新闻数据模型
```typescript
interface NewsItem {
  id: string;
  title: string;
  content: string;
  source: string;
  publishedAt: Date;
  url: string;
  relevanceScore: number;
}

interface NewsAnalysis {
  newsId: string;
  impact: 'positive' | 'negative' | 'neutral';
  confidence: number; // 0-1
  summary: string;
  keyPoints: string[];
  predictedChange: number; // 预测变化百分比
  timeframe: 'short' | 'medium' | 'long';
}
```

### 价格数据模型
```typescript
interface PriceData {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
  change: number;
  changePercent: number;
}

interface AssetInfo {
  symbol: string;
  name: string;
  currentPrice: number;
  currency: string;
  lastUpdated: Date;
}
```

### 应用状态模型
```typescript
interface AppState {
  currentAsset: 'gold' | 'nasdaq';
  news: {
    gold: NewsItem[];
    nasdaq: NewsItem[];
  };
  analysis: {
    gold: NewsAnalysis[];
    nasdaq: NewsAnalysis[];
  };
  priceData: {
    gold: PriceData[];
    nasdaq: PriceData[];
  };
  loading: {
    news: boolean;
    analysis: boolean;
    prices: boolean;
  };
  errors: {
    news?: string;
    analysis?: string;
    prices?: string;
  };
}
```

## 
Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

基于需求分析，以下是系统必须满足的核心正确性属性：

**Property 1: 新闻获取和显示**
*For any* 用户点击获取新闻的操作，系统应该获取相关新闻并在界面上显示
**Validates: Requirements 1.1**

**Property 2: 新闻过滤准确性**
*For any* 获取到的新闻数据集，过滤后的结果应该只包含与指定资产类型相关的新闻
**Validates: Requirements 1.2**

**Property 3: 新闻影响分析完整性**
*For any* 获取到的新闻项，系统应该为每条新闻生成对应的影响分析
**Validates: Requirements 2.1**

**Property 4: 影响分析结果格式**
*For any* 生成的影响分析，应该包含影响方向、置信度和趋势预测信息
**Validates: Requirements 2.2**

**Property 5: 分析结果展示格式**
*For any* 影响分析结果，展示格式应该包含易于理解的重点归纳和影响指示
**Validates: Requirements 2.3**

**Property 6: 新闻影响程度排序**
*For any* 多条新闻的分析结果，应该按照影响程度从高到低进行排序显示
**Validates: Requirements 2.4**

**Property 7: 页面内容过滤 - 黄金**
*For any* 现货黄金页面的内容，显示的新闻和分析应该只与黄金市场相关
**Validates: Requirements 3.2**

**Property 8: 页面内容过滤 - 纳斯达克**
*For any* 纳斯达克100页面的内容，显示的新闻和分析应该只与纳斯达克100相关
**Validates: Requirements 3.3**

**Property 9: 页面状态保持**
*For any* 页面切换操作，之前页面的状态应该被保持，新页面应该快速加载
**Validates: Requirements 3.4**

**Property 10: 价格趋势图表显示**
*For any* 投资产品页面，应该显示该产品过去5天的价格趋势图表
**Validates: Requirements 4.1**

**Property 11: 时间范围计算准确性**
*For any* 当前日期，系统计算的5天时间范围应该准确地从当前日期往前推算
**Validates: Requirements 4.2**

**Property 12: 图表信息完整性**
*For any* 显示的价格趋势图表，应该清晰标注日期、价格和涨跌幅度信息
**Validates: Requirements 4.3**

**Property 13: 图表交互功能**
*For any* 加载完成的价格图表，应该提供交互功能以查看具体数据点详情
**Validates: Requirements 4.5**

**Property 14: API请求处理**
*For any* API请求，系统应该正确处理跨域请求和API限制情况
**Validates: Requirements 5.4**

**Property 15: 数据刷新功能**
*For any* 用户触发的数据刷新操作，系统应该获取最新的新闻和价格信息
**Validates: Requirements 6.1**

**Property 16: 时间戳显示**
*For any* 数据获取操作，系统应该显示数据的更新时间戳
**Validates: Requirements 6.2**

**Property 17: 数据过期提示**
*For any* 过期的数据，系统应该提示用户数据可能不是最新的
**Validates: Requirements 6.3**

**Property 18: 自动刷新不干扰**
*For any* 启用自动刷新的情况下，定期数据更新不应该影响用户当前的操作体验
**Validates: Requirements 6.4**

## Error Handling

### API错误处理策略
```typescript
interface ErrorHandler {
  handleNewsAPIError(error: APIError): void;
  handlePriceAPIError(error: APIError): void;
  handleAnalysisError(error: AnalysisError): void;
  handleNetworkError(error: NetworkError): void;
}

enum ErrorType {
  NETWORK_ERROR = 'network_error',
  API_LIMIT_EXCEEDED = 'api_limit_exceeded', 
  INVALID_RESPONSE = 'invalid_response',
  ANALYSIS_FAILED = 'analysis_failed',
  DATA_NOT_FOUND = 'data_not_found'
}
```

### 错误恢复机制
- **重试策略**: 指数退避算法，最多重试3次
- **降级服务**: API失败时使用缓存数据或备用数据源
- **用户通知**: 友好的错误提示和建议操作
- **日志记录**: 详细的错误日志用于问题诊断

### 数据验证
- **API响应验证**: 使用Zod进行运行时类型检查
- **输入数据清理**: 防止XSS和注入攻击
- **数据完整性检查**: 确保关键字段存在且格式正确

## Testing Strategy

### 双重测试方法

系统将采用单元测试和基于属性的测试相结合的方法：

**单元测试**:
- 验证具体的功能示例和边界情况
- 测试组件的集成点和错误处理
- 使用Jest和React Testing Library进行实现

**基于属性的测试**:
- 验证应该在所有输入中保持的通用属性
- 使用fast-check库进行JavaScript/TypeScript的属性测试
- 每个属性测试运行最少100次迭代以确保覆盖率

### 测试配置要求

**属性测试库**: fast-check
**最小迭代次数**: 100次
**标记格式**: 每个基于属性的测试必须使用注释标记对应的设计文档属性
- 格式: `**Feature: investment-news-analyzer, Property {number}: {property_text}**`

### 测试覆盖范围

**核心功能测试**:
- 新闻获取和过滤逻辑
- 影响分析算法
- 价格数据处理和图表生成
- 页面路由和状态管理

**集成测试**:
- API集成点测试
- 组件间数据流测试
- 错误处理流程测试

**端到端测试**:
- 用户工作流程测试
- 跨浏览器兼容性测试
- 性能和加载时间测试

### API集成和服务

#### 新闻数据服务
```typescript
interface NewsService {
  fetchMarketNews(assetType: 'gold' | 'nasdaq', limit?: number): Promise<NewsItem[]>;
  analyzeNewsImpact(news: NewsItem[], assetType: string): Promise<NewsAnalysis[]>;
}
```

#### 价格数据服务  
```typescript
interface PriceService {
  fetchPriceHistory(symbol: string, days: number): Promise<PriceData[]>;
  getCurrentPrice(symbol: string): Promise<AssetInfo>;
}
```

#### AI分析服务
```typescript
interface AnalysisService {
  analyzeNewsImpact(newsContent: string, assetType: string): Promise<{
    impact: 'positive' | 'negative' | 'neutral';
    confidence: number;
    summary: string;
    keyPoints: string[];
    predictedChange: number;
  }>;
}
```

### 部署和性能优化

#### Netlify部署配置
- **构建命令**: `npm run build`
- **发布目录**: `dist`
- **环境变量**: API密钥和配置通过Netlify环境变量管理
- **重定向规则**: SPA路由支持

#### 性能优化策略
- **代码分割**: 按页面进行懒加载
- **缓存策略**: API响应缓存和浏览器缓存优化
- **图片优化**: 图表和图标的优化加载
- **CDN利用**: 静态资源通过Netlify CDN分发

#### 监控和分析
- **错误监控**: 集成Sentry进行错误跟踪
- **性能监控**: Web Vitals指标监控
- **用户分析**: 基本的使用统计和用户行为分析