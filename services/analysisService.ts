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
  calculateRetryDelay,
  DEFAULT_RETRY_CONFIG 
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

  constructor(config?: Partial<AnalysisAPIConfig>) {
    this.config = {
      baseURL: 'https://generativelanguage.googleapis.com/v1',
      apiKey: config?.apiKey || '',
      model: 'gemini-2.5-flash', // 使用最新的 Gemini 2.5 Flash 模型
      timeout: 30000,
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
      console.error('Gemini API错误 - 请检查以下配置：');
      console.error('1. API密钥是否正确: ', this.config.apiKey?.substring(0, 8) + '...');
      console.error('2. 是否超出API限制 (免费版每分钟15次请求)');
      console.error('3. 网络连接是否正常');
      console.error('获取真实API密钥: https://ai.google.dev/');
      
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
   * 发起 Gemini API 请求
   */
  private async makeGeminiRequest(request: GeminiRequest): Promise<AxiosResponse<GeminiResponse>> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        const url = `${this.config.baseURL}/models/${this.config.model}:generateContent?key=${this.config.apiKey}`;
        
        logInfo('发起 Gemini API 请求', { 
          attempt, 
          model: this.config.model,
          url: url.replace(this.config.apiKey, '***')
        });
        
        const response = await axios.post<GeminiResponse>(
          url,
          request,
          {
            timeout: this.config.timeout,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );

        logInfo('Gemini API 请求成功', { 
          attempt,
          tokensUsed: response.data.usageMetadata?.totalTokenCount
        });

        return response;
        
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === this.config.maxRetries) {
          break;
        }
        
        if (axios.isAxiosError(error)) {
          // 检查是否是配额限制错误
          if (error.response?.status === 429) {
            const delay = calculateRetryDelay(attempt, {
              ...DEFAULT_RETRY_CONFIG,
              baseDelay: 2000
            });
            logInfo(`Gemini API 配额限制，等待${delay}ms后重试`, { attempt });
            await this.sleep(delay);
            continue;
          }
          
          if (!isRetryableError(error)) {
            throw this.errorHandler.handleNetworkError(error);
          }
        }
        
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