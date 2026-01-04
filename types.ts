// ============================================================================
// 投资新闻分析器 - 核心数据类型定义
// ============================================================================

// 资产类型
export type AssetType = 'gold' | 'nasdaq';

// 影响类型
export type ImpactType = 'positive' | 'negative' | 'neutral' | 'mixed';

// 时间框架
export type TimeFrame = 'short' | 'medium' | 'long';

// ============================================================================
// 新闻相关数据模型
// ============================================================================

/**
 * 新闻项目接口
 */
export interface NewsItem {
  id: string;
  title: string;
  content: string;
  source: string;
  publishedAt: Date;
  url: string;
  relevanceScore: number; // 0-1之间的相关性评分
}

/**
 * 新闻影响分析接口
 */
export interface NewsAnalysis {
  newsId: string;
  impact: ImpactType;
  confidence: number; // 0-1之间的置信度
  summary: string;
  keyPoints: string[];
  predictedChange: number; // 预测变化百分比
  timeframe: TimeFrame;
}

/**
 * 整体市场分析接口
 */
export interface OverallMarketAnalysis {
  assetType: AssetType;
  impact: ImpactType;
  confidence: number;
  summary: string; // 综合分析摘要
  investmentAdvice: string; // 投资建议
  keyFactors: string[]; // 关键影响因素
  riskLevel: 'low' | 'medium' | 'high'; // 风险等级
  timeHorizon: TimeFrame; // 建议持有时间
  predictedTrend: string; // 预测趋势描述
  analyzedNewsCount: number; // 分析的新闻数量
  timestamp: string; // 分析时间戳（ISO字符串）
}

// ============================================================================
// 价格数据模型
// ============================================================================

/**
 * 价格数据接口
 */
export interface PriceData {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
  change: number;
  changePercent: number;
}

/**
 * 资产信息接口
 */
export interface AssetInfo {
  symbol: string;
  name: string;
  currentPrice: number;
  currency: string;
  lastUpdated: Date;
}

// ============================================================================
// 应用状态管理
// ============================================================================

/**
 * 加载状态接口
 */
export interface LoadingState {
  news: boolean;
  analysis: boolean;
  prices: boolean;
}

/**
 * 错误状态接口
 */
export interface ErrorState {
  news?: string;
  analysis?: string;
  prices?: string;
}

/**
 * 应用主状态接口
 */
export interface AppState {
  currentAsset: AssetType;
  news: {
    gold: NewsItem[];
    nasdaq: NewsItem[];
  };
  analysis: {
    gold: NewsAnalysis[];
    nasdaq: NewsAnalysis[];
  };
  overallAnalysis: {
    gold: OverallMarketAnalysis | null;
    nasdaq: OverallMarketAnalysis | null;
  };
  priceData: {
    gold: PriceData[];
    nasdaq: PriceData[];
  };
  loading: LoadingState;
  errors: ErrorState;
}

// ============================================================================
// API服务接口
// ============================================================================

/**
 * 新闻服务接口
 */
export interface NewsService {
  fetchMarketNews(assetType: AssetType, limit?: number): Promise<NewsItem[]>;
  analyzeNewsImpact(news: NewsItem[], assetType: string): Promise<NewsAnalysis[]>;
}

/**
 * 价格服务接口
 */
export interface PriceService {
  fetchPriceHistory(symbol: string, days: number): Promise<PriceData[]>;
  getCurrentPrice(symbol: string): Promise<AssetInfo>;
}

/**
 * AI分析服务接口
 */
export interface AnalysisService {
  analyzeNewsImpact(newsContent: string, assetType: string): Promise<{
    impact: ImpactType;
    confidence: number;
    summary: string;
    keyPoints: string[];
    predictedChange: number;
  }>;
  
  analyzeBatchNews(newsList: Array<{ title: string; content: string }>, assetType: string): Promise<{
    analyses: Array<{
      newsIndex: number;
      impact: ImpactType;
      confidence: number;
      summary: string;
      keyPoints: string[];
      predictedChange: number;
    }>;
    overallImpact: ImpactType;
    overallConfidence: number;
    overallSummary: string;
  }>;
  
  analyzeOverallMarket(newsList: Array<{ title: string; content: string }>, assetType: AssetType): Promise<OverallMarketAnalysis>;
}

// ============================================================================
// 错误处理类型
// ============================================================================

/**
 * API错误类型枚举
 */
export enum ErrorType {
  NETWORK_ERROR = 'network_error',
  API_LIMIT_EXCEEDED = 'api_limit_exceeded',
  INVALID_RESPONSE = 'invalid_response',
  ANALYSIS_FAILED = 'analysis_failed',
  DATA_NOT_FOUND = 'data_not_found',
  VALIDATION_ERROR = 'validation_error'
}

/**
 * API错误接口
 */
export interface APIError {
  type: ErrorType;
  message: string;
  code?: string | number;
  details?: unknown;
}

/**
 * 网络错误接口
 */
export interface NetworkError extends APIError {
  type: ErrorType.NETWORK_ERROR;
  status?: number;
}

/**
 * 分析错误接口
 */
export interface AnalysisError extends APIError {
  type: ErrorType.ANALYSIS_FAILED;
  newsId?: string;
}

// ============================================================================
// React组件Props接口
// ============================================================================

/**
 * 新闻分析器组件Props
 */
export interface NewsAnalyzerProps {
  assetType: AssetType;
  onAnalysisComplete?: (analysis: NewsAnalysis[]) => void;
  skipAnalysis?: boolean; // 是否跳过 AI 分析，只刷新新闻
}

/**
 * 趋势图表组件Props
 */
export interface TrendChartProps {
  data: PriceData[];
  assetType: AssetType;
  timeRange: number; // 天数
}

/**
 * 新闻列表组件Props
 */
export interface NewsListProps {
  news: NewsItem[];
  analysis: NewsAnalysis[];
  loading: boolean;
}

/**
 * 影响指示器组件Props
 */
export interface ImpactIndicatorProps {
  impact: ImpactType;
  confidence: number;
  summary: string;
}

// ============================================================================
// Context和Action类型
// ============================================================================

/**
 * 应用Action类型
 */
export enum AppActionType {
  SET_CURRENT_ASSET = 'SET_CURRENT_ASSET',
  SET_NEWS = 'SET_NEWS',
  SET_ANALYSIS = 'SET_ANALYSIS',
  SET_OVERALL_ANALYSIS = 'SET_OVERALL_ANALYSIS',
  SET_PRICE_DATA = 'SET_PRICE_DATA',
  SET_LOADING = 'SET_LOADING',
  SET_ERROR = 'SET_ERROR',
  CLEAR_ERROR = 'CLEAR_ERROR',
  RESET_STATE = 'RESET_STATE'
}

/**
 * 应用Action接口
 */
export type AppAction =
  | { type: AppActionType.SET_CURRENT_ASSET; payload: AssetType }
  | { type: AppActionType.SET_NEWS; payload: { assetType: AssetType; news: NewsItem[] } }
  | { type: AppActionType.SET_ANALYSIS; payload: { assetType: AssetType; analysis: NewsAnalysis[] } }
  | { type: AppActionType.SET_OVERALL_ANALYSIS; payload: { assetType: AssetType; analysis: OverallMarketAnalysis } }
  | { type: AppActionType.SET_PRICE_DATA; payload: { assetType: AssetType; data: PriceData[] } }
  | { type: AppActionType.SET_LOADING; payload: Partial<LoadingState> }
  | { type: AppActionType.SET_ERROR; payload: { key: keyof ErrorState; error: string } }
  | { type: AppActionType.CLEAR_ERROR; payload: keyof ErrorState }
  | { type: AppActionType.RESET_STATE };

/**
 * 应用Context接口
 */
export interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

// ============================================================================
// 工具类型和常量
// ============================================================================

/**
 * 资产符号映射
 */
export const ASSET_SYMBOLS: Record<AssetType, string> = {
  gold: 'XAUUSD',
  nasdaq: 'NDX'
};

/**
 * 资产名称映射
 */
export const ASSET_NAMES: Record<AssetType, string> = {
  gold: '现货黄金',
  nasdaq: '纳斯达克100'
};

/**
 * 影响类型颜色映射
 */
export const IMPACT_COLORS: Record<ImpactType, string> = {
  positive: 'text-green-600',
  negative: 'text-red-600',
  neutral: 'text-gray-600',
  mixed: 'text-yellow-600'
};

// ============================================================================
// 验证和工具函数类型
// ============================================================================

/**
 * 数据验证结果接口
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * 日期范围接口
 */
export interface DateRange {
  start: Date;
  end: Date;
}

// 保留原有的导航相关类型以保持兼容性
export interface NavItem {
  label: string;
  href: string;
}

export enum FeatureStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING = 'PENDING'
}

export interface Feature {
  id: string;
  title: string;
  description: string;
  status: FeatureStatus;
  icon: string;
}

// ============================================================================
// 投资组合增强类型定义
// ============================================================================

/**
 * 基金产品接口
 */
export interface FundProduct {
  code: string;           // 基金代码
  name: string;           // 基金全称
  shortName: string;      // 基金简称
  type: 'nasdaq' | 'gold'; // 基金类型
  company: string;        // 基金公司
  trackingIndex: string;  // 跟踪指数
}

/**
 * 定投计划接口
 */
export interface AutoInvestPlan {
  enabled: boolean;
  amount: number;              // 定投金额
  frequency: 'weekly' | 'monthly' | 'quarterly'; // 周期
  startDate: Date;             // 首次扣款日期
  nextDate: Date;              // 下次扣款日期
  lastExecutedDate?: Date;     // 上次执行日期
}

/**
 * 增强的持仓接口
 */
export interface EnhancedPosition {
  id: string;
  assetType: AssetType;
  
  // 纳斯达克基金信息
  fundName?: string;           // 用户自定义基金名称
  
  // 黄金信息
  quantity?: number;           // 黄金克数（仅黄金）
  averageBuyPrice?: number;    // 黄金均价（仅黄金，人民币/克）
  
  // 通用信息
  investmentAmount: number;    // 持仓金额（元）
  profitLoss: number;          // 持仓收益（元）
  
  // 计算字段
  currentPrice?: number;       // 当前价格
  currentValue?: number;       // 当前市值
  profitLossPercent?: number;  // 收益率
  dailyProfitLoss?: number;    // 当日收益（元）
  dailyChange?: number;        // 当日涨跌幅（%）
  
  // 定投计划（仅纳斯达克）
  autoInvest?: AutoInvestPlan;
  
  // 元数据
  createdAt: Date;             // 创建时间
  updatedAt: Date;             // 更新时间
}

/**
 * 资产统计接口
 */
export interface AssetStats {
  count: number;
  investment: number;
  currentValue: number;
  profitLoss: number;
}

/**
 * 黄金统计接口
 */
export interface GoldStats extends AssetStats {
  totalGrams: number;        // 总克数
  averagePrice: number;      // 均价（人民币/克）
  currentPrice: number;      // 当前价格（人民币/克）
}

/**
 * 持仓统计接口
 */
export interface PositionStatistics {
  // 基本统计
  totalPositions: number;
  totalInvestment: number;
  currentValue: number;
  totalProfitLoss: number;
  totalProfitLossPercent: number;
  
  // 分类统计
  nasdaqStats: AssetStats;
  goldStats: GoldStats;
  
  // 定投统计
  autoInvestCount: number;
  nextAutoInvestDate?: Date;
}