/**
 * AI分析服务模块
 * 负责使用 Google Gemini AI 分析新闻对市场的潜在影响
 */

import axios, { AxiosResponse } from 'axios';
import { 
  AnalysisService as IAnalysisService,
  ImpactType,
  ErrorType 
} from '../types';
import { 
  createAnalysisError, 
  ErrorHandler, 
  isRetryableError,
  calculateRetryDelay
} from '../utils/errors';
import { logInfo, logError } from './logger';
import { config } from '../config/env';

/**
 * AI分析API配置
 */
interface AnalysisAPIConfig {
  baseURL: string;
  apiKey: string;
  model: string;
  timeout: number;
  maxRetries: number;
}

/**
 * Gemini API请求接口
 */
interface GeminiRequest {
  contents: Array<{
    parts: Array<{
      text: string;
    }>;
  }>;
  generationConfig?: {
    temperature?: number;
    maxOutputTokens?: number;
  };
}

/**
 * Gemini API响应接口
 */
interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
    finishReason: string;
  }>;
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

/**
 * 分析结果接口
 */
interface AnalysisResult {
  impact: ImpactType;
  confidence: number;
  summary: string;
  keyPoints: string[];
  predictedChange: number;
}

/**
 * 批量分析结果接口（包含每条新闻的单独分析）
 */
interface BatchAnalysisResult {
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
}

/**
 * 缓存项接口
 */
interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

/**
 * AI分析服务实现类
 */
export class AnalysisService implements IAnalysisService {
  private config: AnalysisAPIConfig;
  private errorHandler: ErrorHandler;
  private cache: Map<string, CacheItem<AnalysisResult>>;
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30分钟缓存
  private requestQueue: Promise<AxiosResponse<GeminiResponse> | void> = Promise.resolve(); // 请求队列
  private lastRequestTime = 0; // 上次请求时间
  private readonly MIN_REQUEST_INTERVAL = 5000; // 最小请求间隔 5秒（免费版每分钟15次，留余量）
  private consecutiveRateLimitErrors = 0; // 连续429错误计数

  constructor(config?: Partial<AnalysisAPIConfig>) {
    this.config = {
      baseURL: 'https://generativelanguage.googleapis.com/v1',
      apiKey: config?.apiKey || '',
      model: 'gemini-2.5-flash-lite', // 使用轻量级模型，配额更高
      timeout: 60000, // 增加到60秒，支持批量分析50条新闻
      maxRetries: 3,
      ...config
    };
    
    this.errorHandler = ErrorHandler.getInstance();
    this.cache = new Map();
    
    // 调试：输出API密钥状态
    console.log('🔧 AnalysisService 初始化:', {
      model: this.config.model,
      baseURL: this.config.baseURL,
      hasApiKey: !!this.config.apiKey,
      apiKeyPrefix: this.config.apiKey?.substring(0, 10) + '...',
      apiKeyLength: this.config.apiKey?.length
    });
    
    logInfo('AnalysisService initialized with Gemini AI', { 
      model: this.config.model,
      hasApiKey: !!this.config.apiKey
    });
  }

  /**
   * 批量分析多条新闻（节省API调用，但为每条新闻返回单独分析）
   */
  async analyzeBatchNews(newsList: Array<{ title: string; content: string }>, assetType: string): Promise<BatchAnalysisResult> {
    const cacheKey = this.generateCacheKey(JSON.stringify(newsList), assetType);
    
    // 检查缓存
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      logInfo('返回缓存的批量分析结果', { assetType, newsCount: newsList.length });
      return cached as unknown as BatchAnalysisResult;
    }

    try {
      logInfo('开始批量AI新闻影响分析', { assetType, newsCount: newsList.length });
      
      // 如果API密钥明确是占位符，提示用户配置真实密钥
      if (this.shouldUseDemoData()) {
        logInfo('⚠️ 检测到占位符API密钥，使用本地分析方法');
        console.warn('请访问 https://ai.google.dev/ 获取真实的Gemini API密钥以启用AI分析');
        const result = await this.localBatchAnalysis(newsList, assetType);
        this.setCache(cacheKey, result as unknown as AnalysisResult);
        return result;
      }
      
      const result = await this.aiBatchAnalysis(newsList, assetType);
      
      // 缓存结果
      this.setCache(cacheKey, result as unknown as AnalysisResult);
      
      logInfo('批量AI新闻影响分析完成', { 
        assetType, 
        newsCount: newsList.length,
        overallImpact: result.overallImpact, 
        overallConfidence: result.overallConfidence 
      });
      
      return result;
      
    } catch (error) {
      logError('⚠️ 批量AI分析API调用失败，回退到本地分析', error);
      
      // 检查是否是429错误
      if (axios.isAxiosError(error) && error.response?.status === 429) {
        console.error('🚫 Gemini API 配额已用完！');
        console.error('免费版限制：每分钟15次请求，每天1500次请求');
        console.error('建议：');
        console.error('  1. 等待1-2分钟后刷新页面重试');
        console.error('  2. 考虑升级到付费版本: https://ai.google.dev/pricing');
      }
      
      // 回退到本地分析
      try {
        const result = await this.localBatchAnalysis(newsList, assetType);
        this.setCache(cacheKey, result as unknown as AnalysisResult);
        return result;
      } catch (fallbackError) {
        const analysisError = this.errorHandler.handleAnalysisError(fallbackError);
        logError('本地分析也失败了', analysisError);
        throw analysisError;
      }
    }
  }

  /**
   * AI批量分析方法 - 使用 Gemini API，为每条新闻返回单独分析
   */
  private async aiBatchAnalysis(newsList: Array<{ title: string; content: string }>, assetType: string): Promise<BatchAnalysisResult> {
    const prompt = this.buildBatchAnalysisPrompt(newsList, assetType);
    
    const response = await this.makeGeminiRequest({
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.2, // 降低温度，提高响应速度
        maxOutputTokens: 6144 // 减少到6144，加快生成速度
      }
    });

    return this.parseBatchGeminiResponse(response.data, newsList.length);
  }

  /**
   * 构建批量分析提示词 - 为每条新闻返回单独分析（优化版，减少token消耗）
   */
  private buildBatchAnalysisPrompt(newsList: Array<{ title: string; content: string }>, assetType: string): string {
    const assetName = assetType === 'gold' ? '现货黄金(XAUUSD)' : '纳斯达克100指数';
    
    // 将新闻列表格式化，每条新闻带编号（只取标题和内容前200字，减少token）
    const newsText = newsList.map((news, index) => 
      `[${index}] ${news.title}\n${news.content.substring(0, 200)}...`
    ).join('\n\n');
    
    return `分析以下${newsList.length}条新闻对${assetName}的影响，返回JSON（无markdown）：

${newsText}

格式：
{
  "analyses": [
    {"newsIndex": 0, "impact": "positive/negative/neutral", "confidence": 0.75, "summary": "简要分析60-80字", "keyPoints": ["点1", "点2", "点3"], "predictedChange": 2.5}
  ],
  "overallImpact": "positive/negative/neutral",
  "overallConfidence": 0.70,
  "overallSummary": "整体分析100-150字"
}`;
  }

  /**
   * 分析新闻影响
   */
  async analyzeNewsImpact(newsContent: string, assetType: string): Promise<AnalysisResult> {
    const cacheKey = this.generateCacheKey(newsContent, assetType);
    
    // 检查缓存
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      logInfo('返回缓存的分析结果', { assetType });
      return cached;
    }

    try {
      logInfo('开始AI新闻影响分析', { assetType, contentLength: newsContent.length });
      
      // 如果API密钥明确是占位符，提示用户配置真实密钥
      if (this.shouldUseDemoData()) {
        logInfo('⚠️ 检测到占位符API密钥，使用本地分析方法');
        console.warn('请访问 https://ai.google.dev/ 获取真实的Gemini API密钥以启用AI分析');
        const result = await this.localAnalysis(newsContent, assetType);
        this.setCache(cacheKey, result);
        return result;
      }
      
      const result = await this.aiAnalysis(newsContent, assetType);
      
      // 缓存结果
      this.setCache(cacheKey, result);
      
      logInfo('AI新闻影响分析完成', { 
        assetType, 
        impact: result.impact, 
        confidence: result.confidence 
      });
      
      return result;
      
    } catch (error) {
      logError('⚠️ AI分析API调用失败，回退到本地分析', error);
      
      // 检查是否是429错误
      if (axios.isAxiosError(error) && error.response?.status === 429) {
        console.error('🚫 Gemini API 配额已用完！');
        console.error('免费版限制：每分钟15次请求，每天1500次请求');
        console.error('建议：');
        console.error('  1. 等待1-2分钟后刷新页面重试');
        console.error('  2. 减少同时分析的新闻数量');
        console.error('  3. 考虑升级到付费版本: https://ai.google.dev/pricing');
      } else {
        console.error('Gemini API错误 - 请检查以下配置：');
        console.error('1. API密钥是否正确: ', this.config.apiKey?.substring(0, 8) + '...');
        console.error('2. 是否超出API限制 (免费版每分钟15次请求)');
        console.error('3. 网络连接是否正常');
        console.error('获取真实API密钥: https://ai.google.dev/');
      }
      
      // 回退到本地分析
      try {
        const result = await this.localAnalysis(newsContent, assetType);
        this.setCache(cacheKey, result);
        return result;
      } catch (fallbackError) {
        const analysisError = this.errorHandler.handleAnalysisError(fallbackError);
        logError('本地分析也失败了', analysisError);
        throw analysisError;
      }
    }
  }

  /**
   * AI分析方法 - 使用 Gemini API
   */
  private async aiAnalysis(newsContent: string, assetType: string): Promise<AnalysisResult> {
    const prompt = this.buildAnalysisPrompt(newsContent, assetType);
    
    const response = await this.makeGeminiRequest({
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.3, // 较低的温度以获得更一致的结果
        maxOutputTokens: 2048 // 增加输出token限制
      }
    });

    return this.parseGeminiResponse(response.data);
  }

  /**
   * 发起 Gemini API 请求（带队列控制）
   */
  private async makeGeminiRequest(request: GeminiRequest): Promise<AxiosResponse<GeminiResponse>> {
    // 将请求加入队列，确保串行执行
    // 关键：使用独立的 Promise 链，避免错误传播阻塞队列
    const currentRequest = this.executeGeminiRequest(request);
    
    // 更新队列：等待当前请求完成（无论成功或失败）
    this.requestQueue = this.requestQueue
      .then(() => currentRequest)
      .catch(() => {}); // 捕获错误，防止队列中断
    
    // 返回实际的请求结果
    return currentRequest;
  }

  /**
   * 执行 Gemini API 请求（实际执行）
   */
  private async executeGeminiRequest(request: GeminiRequest): Promise<AxiosResponse<GeminiResponse>> {
    // 确保请求间隔
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
      const waitTime = this.MIN_REQUEST_INTERVAL - timeSinceLastRequest;
      logInfo(`请求间隔控制，等待${waitTime}ms`, { timeSinceLastRequest });
      await this.sleep(waitTime);
    }
    
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        const url = `${this.config.baseURL}/models/${this.config.model}:generateContent?key=${this.config.apiKey}`;
        
        logInfo('发起 Gemini API 请求', { 
          attempt, 
          model: this.config.model,
          url: url.replace(this.config.apiKey, '***')
        });
        
        this.lastRequestTime = Date.now(); // 记录请求时间
        
        const response = await axios.post<GeminiResponse>(
          url,
          request,
          {
            timeout: this.config.timeout,
            headers: {
              'Content-Type': 'application/json'
            },
            // 防止axios在错误日志中暴露URL
            validateStatus: (status) => status < 500
          }
        );

        // 手动处理4xx错误
        if (response.status >= 400) {
          const error: unknown = new Error(`HTTP ${response.status}: ${response.statusText}`);
          error.response = response;
          error.config = { ...response.config, url: url.replace(this.config.apiKey, '***') };
          throw error;
        }

        logInfo('Gemini API 请求成功', { 
          attempt,
          tokensUsed: response.data.usageMetadata?.totalTokenCount
        });

        // 成功后重置429错误计数
        this.consecutiveRateLimitErrors = 0;
        
        return response;
        
      } catch (error) {
        lastError = error as Error;
        
        if (axios.isAxiosError(error)) {
          // 检查是否是配额限制错误 (429)
          if (error.response?.status === 429) {
            this.consecutiveRateLimitErrors++;
            
            // 根据连续429错误次数，使用更激进的退避策略
            // 第1次: 10秒, 第2次: 20秒, 第3次: 40秒, 第4次: 60秒
            const baseDelay = 10000; // 基础延迟10秒
            const delay = Math.min(
              baseDelay * Math.pow(2, this.consecutiveRateLimitErrors - 1),
              60000 // 最多60秒
            );
            
            if (attempt === this.config.maxRetries) {
              logError(`Gemini API 配额限制，已达最大重试次数`, { 
                attempt,
                consecutiveErrors: this.consecutiveRateLimitErrors,
                suggestion: '免费版API配额已用完，请等待1分钟后再试，或考虑升级到付费版本'
              });
              break;
            }
            
            logInfo(`Gemini API 配额限制 (429)，等待${delay}ms后重试`, { 
              attempt,
              consecutiveErrors: this.consecutiveRateLimitErrors,
              remainingRetries: this.config.maxRetries - attempt
            });
            await this.sleep(delay);
            continue;
          }
          
          // 其他不可重试的错误直接抛出
          if (!isRetryableError(error)) {
            throw this.errorHandler.handleNetworkError(error);
          }
        }
        
        // 最后一次尝试失败，不再重试
        if (attempt === this.config.maxRetries) {
          break;
        }
        
        // 其他错误使用标准重试延迟
        const delay = calculateRetryDelay(attempt);
        logInfo(`Gemini API 请求失败，${delay}ms后重试`, { 
          attempt, 
          error: (error as Error).message 
        });
        await this.sleep(delay);
      }
    }
    
    throw this.errorHandler.handleNetworkError(lastError);
  }

  /**
   * 解析 Gemini API 响应
   */
  private parseGeminiResponse(response: GeminiResponse): AnalysisResult {
    try {
      const candidate = response.candidates?.[0];
      if (!candidate || !candidate.content?.parts?.[0]?.text) {
        throw new Error('Gemini API 返回了空响应');
      }

      const text = candidate.content.parts[0].text;
      logInfo('Gemini API 响应文本', { textLength: text.length });

      // 尝试解析 JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('无法从响应中提取 JSON');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // 验证和标准化响应
      return {
        impact: this.normalizeImpact(parsed.impact),
        confidence: Math.max(0, Math.min(1, parseFloat(parsed.confidence) || 0.5)),
        summary: parsed.summary || '无法生成摘要',
        keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints.slice(0, 5) : [],
        predictedChange: parseFloat(parsed.predictedChange) || 0
      };
      
    } catch (error) {
      logError('解析 Gemini 响应失败', error);
      throw createAnalysisError(
        ErrorType.INVALID_RESPONSE,
        `解析 AI 响应失败: ${(error as Error).message}`,
        'PARSE_ERROR'
      );
    }
  }

  /**
   * 解析批量分析的 Gemini API 响应（增强容错）
   */
  private parseBatchGeminiResponse(response: GeminiResponse, expectedCount: number): BatchAnalysisResult {
    try {
      const candidate = response.candidates?.[0];
      if (!candidate || !candidate.content?.parts?.[0]?.text) {
        throw new Error('Gemini API 返回了空响应');
      }

      const text = candidate.content.parts[0].text;
      logInfo('Gemini API 批量响应文本', { textLength: text.length });

      // 尝试解析 JSON - 增强容错
      let jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('无法从响应中提取 JSON');
      }

      let jsonText = jsonMatch[0];
      
      // 尝试修复常见的JSON错误
      // 1. 移除末尾可能不完整的对象
      const lastCommaIndex = jsonText.lastIndexOf(',');
      const lastBracketIndex = jsonText.lastIndexOf('}');
      if (lastCommaIndex > lastBracketIndex) {
        // 有逗号但没有闭合括号，可能是不完整的
        jsonText = jsonText.substring(0, lastCommaIndex) + ']},"overallImpact":"neutral","overallConfidence":0.5,"overallSummary":"分析被截断"}';
      }
      
      // 2. 确保JSON正确闭合
      const openBraces = (jsonText.match(/\{/g) || []).length;
      const closeBraces = (jsonText.match(/\}/g) || []).length;
      if (openBraces > closeBraces) {
        jsonText += '}'.repeat(openBraces - closeBraces);
      }
      
      const openBrackets = (jsonText.match(/\[/g) || []).length;
      const closeBrackets = (jsonText.match(/\]/g) || []).length;
      if (openBrackets > closeBrackets) {
        jsonText += ']'.repeat(openBrackets - closeBrackets);
      }

      let parsed;
      try {
        parsed = JSON.parse(jsonText);
      } catch (parseError) {
        logError('JSON解析失败，尝试提取部分数据', parseError);
        // 如果完整JSON解析失败，尝试提取analyses数组
        const analysesMatch = jsonText.match(/"analyses"\s*:\s*\[([\s\S]*?)\]/);
        if (analysesMatch) {
          try {
            const analysesText = '[' + analysesMatch[1] + ']';
            const analyses = JSON.parse(analysesText);
            parsed = {
              analyses,
              overallImpact: 'neutral',
              overallConfidence: 0.5,
              overallSummary: '部分分析结果'
            };
          } catch {
            throw parseError; // 如果还是失败，抛出原始错误
          }
        } else {
          throw parseError;
        }
      }
      
      // 验证响应结构
      if (!parsed.analyses || !Array.isArray(parsed.analyses)) {
        throw new Error('响应缺少 analyses 数组');
      }

      // 标准化每条新闻的分析结果
      const analyses = parsed.analyses.map((analysis: {
        newsIndex: number;
        impact: string;
        confidence: number;
        summary: string;
        keyPoints: string[];
        predictedChange: number;
      }) => ({
        newsIndex: parseInt(String(analysis.newsIndex)) || 0,
        impact: this.normalizeImpact(analysis.impact),
        confidence: Math.max(0, Math.min(1, parseFloat(String(analysis.confidence)) || 0.5)),
        summary: analysis.summary || '无法生成摘要',
        keyPoints: Array.isArray(analysis.keyPoints) ? analysis.keyPoints.slice(0, 3) : [],
        predictedChange: parseFloat(String(analysis.predictedChange)) || 0
      }));

      // 如果返回的分析数量不足，用默认值填充
      while (analyses.length < expectedCount) {
        analyses.push({
          newsIndex: analyses.length,
          impact: 'neutral' as ImpactType,
          confidence: 0.3,
          summary: '分析数据不完整',
          keyPoints: [],
          predictedChange: 0
        });
      }

      return {
        analyses: analyses.slice(0, expectedCount), // 确保不超过预期数量
        overallImpact: this.normalizeImpact(parsed.overallImpact),
        overallConfidence: Math.max(0, Math.min(1, parseFloat(parsed.overallConfidence) || 0.5)),
        overallSummary: parsed.overallSummary || '无法生成整体摘要'
      };
      
    } catch (error) {
      logError('解析批量 Gemini 响应失败', error);
      throw createAnalysisError(
        ErrorType.INVALID_RESPONSE,
        `解析批量 AI 响应失败: ${(error as Error).message}`,
        'PARSE_ERROR'
      );
    }
  }

  /**
   * 标准化影响类型
   */
  private normalizeImpact(impact: string): ImpactType {
    const normalized = impact?.toLowerCase();
    if (normalized === 'positive' || normalized === '利好' || normalized === 'bullish') {
      return 'positive';
    } else if (normalized === 'negative' || normalized === '利空' || normalized === 'bearish') {
      return 'negative';
    }
    return 'neutral';
  }

  /**
   * 本地分析方法（备用）
   */
  private async localAnalysis(newsContent: string, assetType: string): Promise<AnalysisResult> {
    logInfo('执行本地新闻分析', { assetType });
    
    const content = newsContent.toLowerCase();
    
    // 定义关键词
    const positiveKeywords = [
      'rise', 'gain', 'increase', 'bull', 'positive', 'growth', 'up', 'surge', 'rally',
      'boost', 'strong', 'higher', 'advance', 'improve', 'recovery', 'optimistic'
    ];
    
    const negativeKeywords = [
      'fall', 'drop', 'decline', 'bear', 'negative', 'loss', 'down', 'crash', 'plunge',
      'weak', 'lower', 'retreat', 'concern', 'worry', 'risk', 'pessimistic'
    ];
    
    const neutralKeywords = [
      'stable', 'unchanged', 'flat', 'sideways', 'mixed', 'uncertain', 'wait', 'hold'
    ];

    // 计算关键词出现次数
    const positiveCount = this.countKeywords(content, positiveKeywords);
    const negativeCount = this.countKeywords(content, negativeKeywords);
    const neutralCount = this.countKeywords(content, neutralKeywords);
    
    // 分析资产特定因素
    const assetFactors = this.analyzeAssetSpecificFactors(content, assetType);
    
    // 确定影响方向
    let impact: ImpactType = 'neutral';
    let confidence = 0.5;
    let predictedChange = 0;
    
    const totalPositive = positiveCount + assetFactors.positive;
    const totalNegative = negativeCount + assetFactors.negative;
    
    if (totalPositive > totalNegative && totalPositive > neutralCount) {
      impact = 'positive';
      confidence = Math.min(0.5 + (totalPositive * 0.08), 0.9);
      predictedChange = Math.min(totalPositive * 0.3, 5.0);
    } else if (totalNegative > totalPositive && totalNegative > neutralCount) {
      impact = 'negative';
      confidence = Math.min(0.5 + (totalNegative * 0.08), 0.9);
      predictedChange = -Math.min(totalNegative * 0.3, 5.0);
    } else {
      confidence = Math.max(0.3, 0.5 - Math.abs(totalPositive - totalNegative) * 0.05);
    }
    
    return {
      impact,
      confidence,
      summary: this.generateLocalSummary(newsContent, impact, assetType),
      keyPoints: this.extractLocalKeyPoints(newsContent, impact),
      predictedChange
    };
  }

  /**
   * 本地批量分析方法（备用）
   */
  private async localBatchAnalysis(newsList: Array<{ title: string; content: string }>, assetType: string): Promise<BatchAnalysisResult> {
    logInfo('执行本地批量新闻分析', { assetType, count: newsList.length });
    
    // 为每条新闻单独分析
    const analyses = await Promise.all(
      newsList.map(async (news, index) => {
        const result = await this.localAnalysis(`${news.title}\n${news.content}`, assetType);
        return {
          newsIndex: index,
          impact: result.impact,
          confidence: result.confidence,
          summary: result.summary,
          keyPoints: result.keyPoints,
          predictedChange: result.predictedChange
        };
      })
    );

    // 计算整体影响
    const positiveCount = analyses.filter(a => a.impact === 'positive').length;
    const negativeCount = analyses.filter(a => a.impact === 'negative').length;
    const neutralCount = analyses.filter(a => a.impact === 'neutral').length;

    let overallImpact: ImpactType = 'neutral';
    if (positiveCount > negativeCount && positiveCount > neutralCount) {
      overallImpact = 'positive';
    } else if (negativeCount > positiveCount && negativeCount > neutralCount) {
      overallImpact = 'negative';
    }

    const avgConfidence = analyses.reduce((sum, a) => sum + a.confidence, 0) / analyses.length;
    const avgChange = analyses.reduce((sum, a) => sum + a.predictedChange, 0) / analyses.length;

    return {
      analyses,
      overallImpact,
      overallConfidence: avgConfidence,
      overallSummary: `综合分析${newsList.length}条新闻，整体${overallImpact === 'positive' ? '利好' : overallImpact === 'negative' ? '利空' : '中性'}，预测变化约${avgChange.toFixed(2)}%`
    };
  }

  /**
   * 分析资产特定因素
   */
  private analyzeAssetSpecificFactors(content: string, assetType: string): { positive: number; negative: number } {
    let positive = 0;
    let negative = 0;
    
    if (assetType === 'gold') {
      // 黄金特定因素
      if (content.includes('inflation') || content.includes('通胀')) positive += 2;
      if (content.includes('dollar weakness') || content.includes('美元走弱')) positive += 2;
      if (content.includes('safe haven') || content.includes('避险')) positive += 1;
      if (content.includes('interest rate cut') || content.includes('降息')) positive += 2;
      
      if (content.includes('dollar strength') || content.includes('美元走强')) negative += 2;
      if (content.includes('interest rate hike') || content.includes('加息')) negative += 2;
      if (content.includes('risk appetite') || content.includes('风险偏好')) negative += 1;
      
    } else if (assetType === 'nasdaq') {
      // 纳斯达克特定因素
      if (content.includes('tech earnings') || content.includes('科技财报')) positive += 2;
      if (content.includes('innovation') || content.includes('创新')) positive += 1;
      if (content.includes('ai') || content.includes('artificial intelligence')) positive += 2;
      if (content.includes('growth') || content.includes('增长')) positive += 1;
      
      if (content.includes('regulation') || content.includes('监管')) negative += 2;
      if (content.includes('antitrust') || content.includes('反垄断')) negative += 2;
      if (content.includes('recession') || content.includes('衰退')) negative += 2;
      if (content.includes('rate hike') || content.includes('加息')) negative += 1;
    }
    
    return { positive, negative };
  }

  /**
   * 计算关键词出现次数
   */
  private countKeywords(content: string, keywords: string[]): number {
    return keywords.reduce((count, keyword) => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = content.match(regex);
      return count + (matches ? matches.length : 0);
    }, 0);
  }

  /**
   * 生成本地分析摘要
   */
  private generateLocalSummary(newsContent: string, impact: ImpactType, assetType: string): string {
    const title = newsContent.split('\n')[0] || newsContent.substring(0, 100);
    const assetName = assetType === 'gold' ? '黄金' : '纳斯达克100';
    
    const impactText = {
      positive: `可能对${assetName}产生积极影响`,
      negative: `可能对${assetName}产生消极影响`,
      neutral: `对${assetName}的影响相对中性`
    };
    
    return `${title.substring(0, 80)}... ${impactText[impact]}。建议关注后续市场反应。`;
  }

  /**
   * 提取本地关键点
   */
  private extractLocalKeyPoints(newsContent: string, impact: ImpactType): string[] {
    const sentences = newsContent.split(/[.!?。！？]+/).filter(s => s.trim().length > 15);
    const keyPoints: string[] = [];
    
    // 根据影响类型选择相关句子
    const relevantWords = {
      positive: ['增长', '上涨', '利好', '积极', 'growth', 'increase', 'positive'],
      negative: ['下跌', '下降', '利空', '消极', 'decline', 'decrease', 'negative'],
      neutral: ['稳定', '持平', '观望', 'stable', 'unchanged', 'neutral']
    };
    
    const words = relevantWords[impact] || [];
    
    for (const sentence of sentences.slice(0, 10)) {
      if (words.some(word => sentence.toLowerCase().includes(word.toLowerCase()))) {
        keyPoints.push(sentence.trim());
        if (keyPoints.length >= 3) break;
      }
    }
    
    // 如果没有找到相关句子，取前3句
    if (keyPoints.length === 0) {
      keyPoints.push(...sentences.slice(0, 3).map(s => s.trim()));
    }
    
    return keyPoints.filter(point => point.length > 0);
  }

  /**
   * 构建 AI 分析提示词 - 简化版（减少思考token消耗）
   */
  private buildAnalysisPrompt(newsContent: string, assetType: string): string {
    const assetName = assetType === 'gold' ? '现货黄金(XAUUSD)' : '纳斯达克100指数';
    
    return `分析以下新闻对${assetName}的影响，直接返回JSON格式（不要markdown代码块）：

新闻：${newsContent}

返回格式：
{
  "impact": "positive/negative/neutral",
  "confidence": 0.75,
  "summary": "简要分析（80-150字）",
  "keyPoints": ["关键点1", "关键点2", "关键点3"],
  "predictedChange": 2.5
}

说明：
- impact: positive(利好), negative(利空), neutral(中性)
- confidence: 0-1之间的置信度
- predictedChange: 预测价格变化百分比（-10到+10）`;
  }

  /**
   * 生成缓存键
   */
  private generateCacheKey(newsContent: string, assetType: string): string {
    // 使用内容的哈希值作为缓存键
    const contentHash = this.simpleHash(newsContent);
    return `analysis_${assetType}_${contentHash}`;
  }

  /**
   * 简单哈希函数
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * 缓存管理
   */
  private getFromCache(key: string): AnalysisResult | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() > cached.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  private setCache(key: string, data: AnalysisResult): void {
    const now = Date.now();
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + this.CACHE_DURATION
    });
  }

  /**
   * 清理过期缓存
   */
  public clearExpiredCache(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 获取缓存统计信息
   */
  public getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * 检查是否应该使用演示数据
   */
  private shouldUseDemoData(): boolean {
    return !this.config.apiKey || 
           this.config.apiKey === '' || 
           this.config.apiKey.includes('demo') || 
           this.config.apiKey.includes('placeholder') || 
           this.config.apiKey.includes('your_');
  }

  /**
   * 工具方法：延迟执行
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * 默认分析服务实例 - 使用 Gemini API
 */
export const analysisService = new AnalysisService({
  apiKey: config.apiKeys.gemini
});