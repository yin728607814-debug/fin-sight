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
 * 调用 Gemini API（通过后端代理，带自动降级和重试）
 */
async function callGeminiWithFallback(
  _apiKey: string, // 保留参数以兼容现有代码，但不再使用
  prompt: string,
  temperature: number = 0.7,
  maxOutputTokens: number = 2048,
  timeout: number = 30000
): Promise<string> {
  const maxRetries = 2;
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`🔄 重试 Gemini API 调用 (${attempt}/${maxRetries})...`);
        // 等待一段时间再重试
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }

      // 调用后端 API 代理
      const response = await axios.post(
        '/gemini-analysis',
        {
          prompt,
          temperature,
          maxOutputTokens
        },
        { 
          timeout,
          // 添加重试配置
          validateStatus: (status) => status < 500 // 只有 5xx 错误才会抛出异常
        }
      );

      if (response.data?.success && response.data?.data) {
        if (attempt > 0) {
          console.log(`✅ 重试成功！`);
        }
        return response.data.data;
      }

      // 如果是 4xx 错误，不重试
      if (response.status >= 400 && response.status < 500) {
        throw new Error(response.data?.error || `API 错误: ${response.status}`);
      }

      throw new Error(response.data?.error || 'Analysis failed');
    } catch (error: unknown) {
      lastError = error;
      
      // 检查是否是网络错误
      const isNetworkError = 
        (error as any).code === 'ECONNABORTED' ||
        (error as any).code === 'ERR_NETWORK' ||
        (error as any).message?.includes('Network Error') ||
        (error as any).message?.includes('timeout');

      // 如果是网络错误且还有重试次数，继续重试
      if (isNetworkError && attempt < maxRetries) {
        console.warn(`⚠️ 网络错误，将在 ${1000 * (attempt + 1)}ms 后重试...`);
        continue;
      }

      // 如果是最后一次尝试或非网络错误，抛出异常
      if (attempt === maxRetries) {
        console.error('❌ Gemini API 调用失败（已达最大重试次数）:', error);
        throw error;
      }
    }
  }

  // 如果所有重试都失败了
  console.error('❌ Gemini API 调用失败:', lastError);
  throw lastError;
}

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
  private readonly CACHE_DURATION = 2 * 60 * 60 * 1000; // 2小时缓存（优化配额使用）
  private requestQueue: Promise<AxiosResponse<GeminiResponse> | void> = Promise.resolve(); // 请求队列
  private lastRequestTime = 0; // 上次请求时间
  private readonly MIN_REQUEST_INTERVAL = 5000; // 最小请求间隔 5秒（免费版每分钟15次，留余量）
  private consecutiveRateLimitErrors = 0; // 连续429错误计数

  constructor(config?: Partial<AnalysisAPIConfig>) {
    this.config = {
      baseURL: 'https://generativelanguage.googleapis.com/v1beta',
      apiKey: config?.apiKey || '',
      model: 'gemini-3-pro-preview', // 使用 Gemini 3 Pro Preview 模型
      timeout: 90000, // 增加到90秒，支持批量分析50条新闻
      maxRetries: 3,
      ...config
    };
    
    this.errorHandler = ErrorHandler.getInstance();
    this.cache = new Map();
    
    // 仅在开发环境输出初始化日志
    if (process.env.NODE_ENV === 'development') {
      logInfo('AnalysisService initialized with Gemini AI', { 
        model: this.config.model,
        hasApiKey: !!this.config.apiKey
      });
    }
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
   * 如果新闻数量超过 20 条，自动分批并行处理以提升速度
   */
  private async aiBatchAnalysis(newsList: Array<{ title: string; content: string }>, assetType: string): Promise<BatchAnalysisResult> {
    const BATCH_SIZE = 20; // 每批最多 20 条新闻
    const MAX_PARALLEL_BATCHES = 3; // 最多并行处理3个批次（付费版API限制充足）
    
    // 如果新闻数量较少，直接处理
    if (newsList.length <= BATCH_SIZE) {
      return await this.aiBatchAnalysisSingle(newsList, assetType);
    }
    
    // 分批处理
    console.log(`📊 新闻数量较多 (${newsList.length}条)，分批并行处理以提升速度...`);
    const batches: Array<{ title: string; content: string }[]> = [];
    for (let i = 0; i < newsList.length; i += BATCH_SIZE) {
      batches.push(newsList.slice(i, i + BATCH_SIZE));
    }
    
    console.log(`📦 分成 ${batches.length} 批，每批最多 ${BATCH_SIZE} 条，最多 ${MAX_PARALLEL_BATCHES} 批并行处理`);
    
    // 并行处理批次（每次最多处理 MAX_PARALLEL_BATCHES 个批次）
    const batchResults: BatchAnalysisResult[] = [];
    
    for (let i = 0; i < batches.length; i += MAX_PARALLEL_BATCHES) {
      const currentBatches = batches.slice(i, i + MAX_PARALLEL_BATCHES);
      const batchIndices = currentBatches.map((_, idx) => i + idx);
      
      console.log(`🚀 并行处理第 ${i + 1}-${Math.min(i + MAX_PARALLEL_BATCHES, batches.length)} 批 (共${currentBatches.length}个批次)...`);
      
      // 并行处理当前这组批次
      const promises = currentBatches.map((batch, idx) => {
        const batchNum = i + idx + 1;
        console.log(`  📝 批次 ${batchNum}/${batches.length}: ${batch.length}条新闻`);
        return this.aiBatchAnalysisSingle(batch, assetType);
      });
      
      // 等待所有并行批次完成
      const results = await Promise.all(promises);
      batchResults.push(...results);
      
      console.log(`✅ 第 ${i + 1}-${Math.min(i + MAX_PARALLEL_BATCHES, batches.length)} 批处理完成`);
      
      // 如果还有更多批次，稍微延迟一下（避免瞬间请求过多）
      if (i + MAX_PARALLEL_BATCHES < batches.length) {
        const delay = 500; // 批次组之间延迟500ms
        console.log(`⏳ 等待${delay}ms后处理下一组批次...`);
        await this.sleep(delay);
      }
    }
    
    // 合并结果
    const allAnalyses = batchResults.flatMap((result, batchIndex) => 
      result.analyses.map(analysis => ({
        ...analysis,
        newsIndex: batchIndex * BATCH_SIZE + analysis.newsIndex
      }))
    );
    
    // 计算整体影响
    const positiveCount = allAnalyses.filter(a => a.impact === 'positive').length;
    const negativeCount = allAnalyses.filter(a => a.impact === 'negative').length;
    const overallImpact = positiveCount > negativeCount ? 'positive' as const : 
                         negativeCount > positiveCount ? 'negative' as const : 
                         'neutral' as const;
    
    const avgConfidence = allAnalyses.reduce((sum, a) => sum + a.confidence, 0) / allAnalyses.length;
    
    console.log(`✅ 所有批次处理完成！共 ${allAnalyses.length} 条分析`);
    
    return {
      analyses: allAnalyses,
      overallImpact,
      overallConfidence: avgConfidence,
      overallSummary: `综合分析了 ${newsList.length} 条新闻：${positiveCount} 条利好，${negativeCount} 条利空，${newsList.length - positiveCount - negativeCount} 条中性。整体市场情绪偏${overallImpact === 'positive' ? '乐观' : overallImpact === 'negative' ? '悲观' : '中性'}。`
    };
  }

  /**
   * 单批次AI分析（不超过20条新闻）
   */
  private async aiBatchAnalysisSingle(newsList: Array<{ title: string; content: string }>, assetType: string): Promise<BatchAnalysisResult> {
    const prompt = this.buildBatchAnalysisPrompt(newsList, assetType);
    
    logInfo('批量分析配置', { 
      newsCount: newsList.length, 
      model: this.config.model
    });
    
    // 使用 callGeminiWithFallback 替代 makeGeminiRequest
    const responseText = await callGeminiWithFallback(
      this.config.apiKey,
      prompt,
      0.3,
      8192,
      120000  // 120秒超时（Pro 模型较慢，给足够时间）
    );

    return this.parseBatchGeminiResponseText(responseText, newsList.length);
  }

  /**
   * 解析批量分析响应文本
   */
  private parseBatchGeminiResponseText(responseText: string, _expectedCount: number): BatchAnalysisResult {
    try {
      // 移除可能的 markdown 代码块标记
      let cleanedText = responseText
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim();
      
      // 提取 JSON
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('无法从响应中提取JSON');
      }
      
      let jsonText = jsonMatch[0];
      
      // 尝试修复常见的JSON格式问题
      try {
        // 1. 尝试直接解析
        const parsed = JSON.parse(jsonText);
        
        if (!parsed.analyses || !Array.isArray(parsed.analyses)) {
          throw new Error('响应格式错误：缺少 analyses 数组');
        }
        
        return {
          analyses: parsed.analyses,
          overallImpact: parsed.overallImpact || 'neutral',
          overallConfidence: parsed.overallConfidence || 0.5,
          overallSummary: parsed.overallSummary || '分析完成'
        };
      } catch (parseError) {
        console.warn('首次JSON解析失败，尝试修复...', parseError);
        
        // 2. 尝试修复常见问题
        // 修复未转义的换行符
        jsonText = jsonText.replace(/\n/g, '\\n').replace(/\r/g, '\\r');
        
        // 修复未转义的引号（在字符串内部）
        // 这个比较复杂，先尝试简单的替换
        jsonText = jsonText.replace(/([^\\])"/g, (match, p1) => {
          // 如果前面不是反斜杠，可能需要转义
          return p1 + '\\"';
        });
        
        // 修复数组末尾多余的逗号
        jsonText = jsonText.replace(/,(\s*[}\]])/g, '$1');
        
        // 再次尝试解析
        try {
          const parsed = JSON.parse(jsonText);
          
          if (!parsed.analyses || !Array.isArray(parsed.analyses)) {
            throw new Error('响应格式错误：缺少 analyses 数组');
          }
          
          console.log('✅ JSON修复成功');
          return {
            analyses: parsed.analyses,
            overallImpact: parsed.overallImpact || 'neutral',
            overallConfidence: parsed.overallConfidence || 0.5,
            overallSummary: parsed.overallSummary || '分析完成'
          };
        } catch (secondError) {
          console.error('JSON修复失败，使用降级策略');
          
          // 3. 降级策略：尝试提取部分有效的分析结果
          const analysesMatch = jsonText.match(/"analyses"\s*:\s*\[([\s\S]*?)\]/);
          if (analysesMatch) {
            try {
              // 尝试只解析analyses数组
              const analysesArray = JSON.parse('[' + analysesMatch[1] + ']');
              console.log(`✅ 部分解析成功，获得${analysesArray.length}条分析`);
              
              return {
                analyses: analysesArray,
                overallImpact: 'neutral',
                overallConfidence: 0.5,
                overallSummary: '部分分析完成'
              };
            } catch (arrayError) {
              console.error('部分解析也失败');
            }
          }
          
          // 4. 最终降级：返回空结果
          throw new Error('无法解析JSON响应，已尝试所有修复策略');
        }
      }
    } catch (error) {
      console.error('解析批量分析响应失败:', error);
      throw error;
    }
  }

  /**
   * 构建批量分析提示词 - 为每条新闻返回单独分析（平衡版本）
   */
  private buildBatchAnalysisPrompt(newsList: Array<{ title: string; content: string }>, assetType: string): string {
    const assetNames = {
      'gold': '现货黄金(XAUUSD)',
      'nasdaq': '纳斯达克100指数',
      'astock': 'A股市场(上证指数)'
    };
    
    const assetName = assetNames[assetType as keyof typeof assetNames] || assetType;
    
    // 根据资产类型添加投资策略说明
    let investmentStrategy = '';
    if (assetType === 'gold') {
      investmentStrategy = '\n\n**投资策略背景**：用户对黄金采取长期持有策略，只买入不卖出，关注长期价值保值和增值机会。请在分析时考虑长期持有的视角，重点关注影响黄金长期价值的因素。';
    } else if (assetType === 'nasdaq') {
      investmentStrategy = '\n\n**投资策略背景**：用户对纳斯达克100采取定期定投策略，持续买入，关注长期增长趋势。请在分析时考虑定投策略的特点，重点关注长期成长性和趋势性机会。';
    }
    
    // 将新闻列表格式化，每条新闻带编号（使用完整内容，最多800字）
    const newsText = newsList.map((news, index) => {
      // 使用完整的content，如果太长则截取800字
      const fullContent = news.content.length > 800 
        ? news.content.substring(0, 800) + '...' 
        : news.content;
      return `[${index}] ${news.title}\n${fullContent}`;
    }).join('\n\n');
    
    return `你是一位专业的金融分析师。分析以下${newsList.length}条新闻对${assetName}的影响。${investmentStrategy}

注意：新闻内容可能较简短（仅标题和摘要），请基于标题和关键信息做出专业判断。

**重要：必须返回严格的JSON格式，不要包含任何markdown标记、注释或额外文本。**

${newsText}

返回格式（纯JSON，无markdown）：
{
  "analyses": [
    {
      "newsIndex": 0,
      "impact": "positive",
      "confidence": 0.75,
      "summary": "基于标题和摘要详细分析这条新闻的影响机制和传导路径（80-120字）",
      "keyPoints": ["关键点1", "关键点2", "关键点3"],
      "predictedChange": 2.5
    }
  ],
  "overallImpact": "positive",
  "overallConfidence": 0.70,
  "overallSummary": "综合所有新闻的整体市场影响分析（150-200字）"
}

JSON格式要求：
- 所有字符串必须使用双引号
- 字符串内的特殊字符必须转义（换行用\\n，引号用\\"）
- 不要在字符串中使用未转义的换行符
- 数组最后一个元素后不要有逗号
- 对象最后一个属性后不要有逗号
- impact只能是: "positive", "negative", "neutral"
- confidence和predictedChange必须是数字，不要用字符串

分析要求：
- 即使内容简短，也要基于标题和关键词做出合理推断
- summary要具体说明影响机制和传导路径（不要包含换行符）
- keyPoints要提取核心要素（政策、数据、事件等）
- predictedChange范围：-10到+10（百分比）
- confidence反映信息完整度和影响确定性
- 必须返回所有${newsList.length}条新闻的完整分析

再次强调：只返回纯JSON，不要任何markdown标记或额外说明。`;
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
   * 公共方法，可供外部调用
   */
  public async makeGeminiRequest(request: GeminiRequest): Promise<AxiosResponse<GeminiResponse>> {
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
          const error = new Error(`HTTP ${response.status}: ${response.statusText}`) as Error & {
            response?: typeof response;
            config?: typeof response.config;
          };
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

      let text = candidate.content.parts[0].text;
      logInfo('Gemini API 响应文本', { textLength: text.length, preview: text.substring(0, 100) });

      // 移除可能的 markdown 代码块标记
      text = text.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      
      // 尝试解析 JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('无法从响应中提取 JSON');
      }

      let jsonText = jsonMatch[0];
      
      // 清理可能的格式问题
      jsonText = jsonText.trim();
      
      const parsed = JSON.parse(jsonText);
      
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

      let text = candidate.content.parts[0].text;
      logInfo('Gemini API 批量响应文本', { textLength: text.length, preview: text.substring(0, 200) });

      // 移除可能的 markdown 代码块标记
      text = text.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      
      // 尝试解析 JSON - 增强容错
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('无法从响应中提取 JSON');
      }

      let jsonText = jsonMatch[0];
      
      // 清理可能的格式问题
      jsonText = jsonText.trim();
      
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
        
        // 尝试多种修复策略
        let fixedJson = jsonText;
        
        // 策略1: 移除不完整的最后一个对象
        try {
          // 找到最后一个完整的对象
          const lastCompleteObject = fixedJson.lastIndexOf('}');
          if (lastCompleteObject > 0) {
            // 检查是否有未闭合的数组
            const afterLastObject = fixedJson.substring(lastCompleteObject + 1);
            if (afterLastObject.includes('[') && !afterLastObject.includes(']')) {
              // 有未闭合的数组，尝试闭合
              fixedJson = fixedJson.substring(0, lastCompleteObject + 1) + ']}';
            }
          }
          parsed = JSON.parse(fixedJson);
          logInfo('JSON修复成功（策略1）');
        } catch {
          // 策略2: 尝试提取analyses数组并修复
          const analysesMatch = jsonText.match(/"analyses"\s*:\s*\[([\s\S]*?)(?:\]|$)/);
          if (analysesMatch) {
            try {
              let analysesText = analysesMatch[1];
              
              // 移除不完整的最后一个对象（找到最后一个完整的}）
              const objects = [];
              let depth = 0;
              let currentObj = '';
              let inString = false;
              let escapeNext = false;
              
              for (let i = 0; i < analysesText.length; i++) {
                const char = analysesText[i];
                
                if (escapeNext) {
                  currentObj += char;
                  escapeNext = false;
                  continue;
                }
                
                if (char === '\\') {
                  escapeNext = true;
                  currentObj += char;
                  continue;
                }
                
                if (char === '"' && !escapeNext) {
                  inString = !inString;
                }
                
                if (!inString) {
                  if (char === '{') depth++;
                  if (char === '}') {
                    depth--;
                    if (depth === 0) {
                      currentObj += char;
                      objects.push(currentObj.trim());
                      currentObj = '';
                      continue;
                    }
                  }
                }
                
                if (depth > 0) {
                  currentObj += char;
                }
              }
              
              // 使用完整的对象
              if (objects.length > 0) {
                const validAnalyses = objects.join(',');
                const analyses = JSON.parse('[' + validAnalyses + ']');
                parsed = {
                  analyses,
                  overallImpact: 'neutral',
                  overallConfidence: 0.5,
                  overallSummary: '部分分析结果（已修复）'
                };
                logInfo('JSON修复成功（策略2）', { analysesCount: analyses.length });
              } else {
                throw new Error('无法提取有效的分析对象');
              }
            } catch (innerError) {
              logError('策略2修复失败', innerError);
              throw parseError;
            }
          } else {
            throw parseError;
          }
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
    const assetNames = {
      'gold': '黄金',
      'nasdaq': '纳斯达克100',
      'astock': 'A股'
    };
    
    const assetName = assetNames[assetType as keyof typeof assetNames] || assetType;
    
    const impactText: Record<ImpactType, string> = {
      positive: `可能对${assetName}产生积极影响`,
      negative: `可能对${assetName}产生消极影响`,
      neutral: `对${assetName}的影响相对中性`,
      mixed: `对${assetName}的影响呈现多空交织态势`
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
    const relevantWords: Record<ImpactType, string[]> = {
      positive: ['增长', '上涨', '利好', '积极', 'growth', 'increase', 'positive'],
      negative: ['下跌', '下降', '利空', '消极', 'decline', 'decrease', 'negative'],
      neutral: ['稳定', '持平', '观望', 'stable', 'unchanged', 'neutral'],
      mixed: ['波动', '分化', '交织', '不确定', 'mixed', 'volatile', 'uncertain']
    };
    
    const words = relevantWords[impact] || [];
    
    for (const sentence of sentences.slice(0, 10)) {
      if (words.some((word: string) => sentence.toLowerCase().includes(word.toLowerCase()))) {
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
    const assetNames = {
      'gold': '现货黄金(XAUUSD)',
      'nasdaq': '纳斯达克100指数',
      'astock': 'A股市场(上证指数)'
    };
    
    const assetName = assetNames[assetType as keyof typeof assetNames] || assetType;
    
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
    // 如果 API 密钥为空字符串，说明使用后端代理，不应该使用演示数据
    if (this.config.apiKey === '') {
      return false;
    }
    
    // 如果没有设置密钥，使用演示数据
    if (!this.config.apiKey || this.config.apiKey.trim() === '') {
      return true;
    }
    
    // 只检查明确的占位符模式
    const placeholderPatterns = [
      /^your[_-]?api[_-]?key/i,           // your_api_key, your-api-key
      /^replace[_-]?with/i,                // replace_with, replace-with
      /^enter[_-]?your/i,                  // enter_your, enter-your
      /^add[_-]?your/i,                    // add_your, add-your
      /^paste[_-]?your/i,                  // paste_your, paste-your
      /^insert[_-]?your/i,                 // insert_your, insert-your
      /^xxx+$/i,                           // xxx, xxxx, xxxxx
      /^test[_-]?key$/i,                   // test_key, test-key
      /^sample[_-]?key$/i,                 // sample_key, sample-key
      /^example[_-]?key$/i                 // example_key, example-key
    ];
    
    return placeholderPatterns.some(pattern => pattern.test(this.config.apiKey));
  }

  /**
   * 工具方法：延迟执行
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 生成降级的整体市场分析（当AI分析失败时使用）
   */
  private generateFallbackOverallAnalysis(
    newsList: Array<{ title: string; content: string }>, 
    assetType: import('../types').AssetType
  ): import('../types').OverallMarketAnalysis {
    const assetNames = {
      'gold': '现货黄金',
      'nasdaq': '纳斯达克100',
      'astock': 'A股'
    };
    
    const assetName = assetNames[assetType] || assetType;
    
    // 简单的关键词分析
    const allText = newsList.map(n => `${n.title} ${n.content}`).join(' ').toLowerCase();
    
    const positiveKeywords = ['上涨', '增长', '利好', '看涨', 'rise', 'gain', 'bull', 'positive'];
    const negativeKeywords = ['下跌', '下降', '利空', '看跌', 'fall', 'drop', 'bear', 'negative'];
    
    const positiveCount = positiveKeywords.reduce((sum, kw) => 
      sum + (allText.match(new RegExp(kw, 'gi'))?.length || 0), 0
    );
    const negativeCount = negativeKeywords.reduce((sum, kw) => 
      sum + (allText.match(new RegExp(kw, 'gi'))?.length || 0), 0
    );
    
    let impact: import('../types').ImpactType = 'neutral';
    if (positiveCount > negativeCount * 1.2) {
      impact = 'positive';
    } else if (negativeCount > positiveCount * 1.2) {
      impact = 'negative';
    }
    
    return {
      assetType,
      impact,
      confidence: 0.4, // 降级分析置信度较低
      summary: `基于${newsList.length}条新闻的基础分析，${assetName}市场整体呈现${impact === 'positive' ? '偏多' : impact === 'negative' ? '偏空' : '中性'}态势。由于AI分析服务暂时不可用，此分析基于关键词统计，建议结合其他信息源做出投资决策。`,
      investmentAdvice: `当前建议保持谨慎态度，密切关注市场动态。建议采用分批建仓策略，控制仓位在合理范围内，设置止损止盈点位。`,
      keyFactors: [
        '市场情绪波动',
        '宏观经济环境',
        '政策面影响',
        '技术面走势'
      ],
      riskLevel: 'medium',
      timeHorizon: 'short',
      predictedTrend: `短期内${assetName}可能维持震荡走势，建议关注关键支撑和阻力位。`,
      analyzedNewsCount: newsList.length,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 分析整体市场趋势并提供投资建议
   */
  async analyzeOverallMarket(
    newsList: Array<{ title: string; content: string }>, 
    assetType: import('../types').AssetType
  ): Promise<import('../types').OverallMarketAnalysis> {
    const assetNames = {
      'gold': '现货黄金(XAUUSD)',
      'nasdaq': '纳斯达克100指数',
      'astock': 'A股市场(上证指数)'
    };
    
    const assetName = assetNames[assetType] || assetType;
    
    // 获取当前日期和时间
    const now = new Date();
    const currentDate = now.toLocaleDateString('zh-CN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      weekday: 'long'
    });
    const currentTime = now.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit'
    });
    
    // 使用标题+完整内容（最多200字）
    const newsText = newsList.map((news, index) => {
      const shortContent = news.content.length > 200 
        ? news.content.substring(0, 200) + '...' 
        : news.content;
      return `[${index}] ${news.title}\n${shortContent}`;
    }).join('\n\n');
    
    const maxPromptLength = 20000; // 允许更长的输入
    let finalNewsText = newsText;
    if (newsText.length > maxPromptLength) {
      console.warn(`⚠️ 新闻内容过长 (${newsText.length}字)，截断到${maxPromptLength}字`);
      finalNewsText = newsText.substring(0, maxPromptLength) + '\n\n[内容过长，已截断...]';
    }
    
    console.log(`📊 新闻文本长度: ${newsText.length}字，最终长度: ${finalNewsText.length}字`);
    
    // 根据资产类型添加投资策略说明
    let investmentStrategy = '';
    if (assetType === 'gold') {
      investmentStrategy = '\n\n**投资策略背景**：用户对黄金采取长期持有策略，只买入不卖出，关注长期价值保值和增值机会。请在提供投资建议时，重点关注长期持有的视角，分析何时是较好的买入时机，以及如何通过长期持有实现资产保值增值。';
    } else if (assetType === 'nasdaq') {
      investmentStrategy = '\n\n**投资策略背景**：用户对纳斯达克100采取定期定投策略，持续买入，关注长期增长趋势。请在提供投资建议时，重点关注定投策略的优化，分析当前是否适合继续定投，以及如何通过定投策略获得长期收益。';
    }
    
    // 详细的prompt，要求深入分析
    const prompt = `你是专业的金融分析师。当前时间是 ${currentDate} ${currentTime}。请深入分析以下${newsList.length}条关于${assetName}的新闻，提供详细的市场洞察。

**重要提示：**
1. 当前时间是 ${currentDate}，请基于这个时间点进行分析
2. 你正在分析的是${assetName}，请确保所有分析、建议和预测都是针对${assetName}的，不要提及其他市场或指数
3. 请使用最新的市场数据和价格水平进行分析${investmentStrategy}
4. **严格要求：只基于提供的新闻内容进行分析，不要编造或推测未在新闻中明确提及的数据（如具体涨跌幅度、价格变动等）**
5. **如果新闻中没有提到具体的价格变动数据，不要在分析中提及具体的涨跌数字**
6. **区分新闻报道的事实和你的分析推测，在分析中明确标注哪些是新闻事实，哪些是你的专业判断**
7. **写作风格：使用流畅自然的叙述方式，不要使用 (News [1])、(News [2]) 等引用标记，直接将新闻内容融入分析中**
8. **表达方式：用"根据最新报道"、"市场消息显示"、"有消息称"等自然的表述方式来引用新闻内容**

新闻内容：
${finalNewsText}

请返回JSON格式（不要markdown代码块）：
{
  "impact": "positive/negative/neutral",
  "confidence": 0.75,
  "summary": "综合市场分析（250-350字）：深入分析${assetName}当前市场状况、主要驱动因素、价格走势特征，以及各类新闻对${assetName}的综合影响。使用流畅的叙述方式，不要使用引用标记。",
  "investmentAdvice": "投资建议（200-300字）：基于当前分析和用户的投资策略，提供针对${assetName}的具体投资策略建议，包括建仓时机、仓位控制、风险管理等实用建议。使用自然的表达方式。",
  "keyFactors": ["关键因素1：具体说明对${assetName}的影响机制", "关键因素2：具体说明对${assetName}的影响机制", "关键因素3：具体说明对${assetName}的影响机制", "关键因素4：具体说明对${assetName}的影响机制"],
  "riskLevel": "low/medium/high",
  "timeHorizon": "short/medium/long",
  "predictedTrend": "趋势预测（150-250字）：基于${currentDate}的市场情况和新闻内容，预测${assetName}未来价格走势。使用流畅的叙述，避免引用标记。"
}

分析要求：
1. 只返回一个完整的JSON对象
2. 确保JSON格式完整，所有字段都有值
3. 所有分析必须针对${assetName}，不要提及其他市场或指数
4. 分析要深入、具体、详细，避免泛泛而谈
5. keyFactors要具体说明每个因素对${assetName}的影响机制和传导路径
6. 投资建议要结合用户的投资策略，针对${assetName}，实用、可操作、有针对性
7. 趋势预测要基于当前时间（${currentDate}）和新闻内容，提供${assetName}的趋势判断
8. **严格禁止：不要在分析中编造或推测新闻中未明确提及的具体价格变动数据**
9. **如果新闻内容不足以支持某个结论，请明确说明"根据现有新闻信息"或"基于市场常规判断"**
10. **写作要求：使用流畅、专业、易读的叙述方式，避免使用任何形式的引用标记如 (News [1])、[1]、①等**`;


    try {
      // 添加请求前的日志
      console.log(`🚀 发起整体市场分析请求`);
      console.log(`📊 Prompt总长度: ${prompt.length}字`);
      console.log(`🔑 API密钥前缀: ${this.config.apiKey?.substring(0, 10)}...`);
      
      const responseText = await callGeminiWithFallback(
        this.config.apiKey,
        prompt,
        0.2,  // 降低temperature，减少AI的创造性和幻觉
        8192,  // 最大输出 tokens
        120000  // 120秒超时（Pro 模型较慢，给足够时间）
      );

      if (!responseText) {
        throw new Error('整体分析响应为空');
      }

      console.log(`📝 整体分析响应长度: ${responseText.length}字`);
      console.log(`📝 响应预览: ${responseText.substring(0, 300)}`);

      // 移除可能的 markdown 代码块标记
      const cleanedText = responseText
        .replace(/```json\s*/gi, '')  // 移除 ```json
        .replace(/```\s*/g, '')        // 移除 ```
        .trim();
      
      console.log(`🧹 清理后预览: ${cleanedText.substring(0, 300)}`);
      
      // 智能提取第一个完整的JSON对象或数组
      let jsonText = '';
      let parsed;
      
      // 检测是数组还是对象
      const startsWithArray = cleanedText.trimStart().startsWith('[');
      const startsWithObject = cleanedText.trimStart().startsWith('{');
      
      if (startsWithArray) {
        // 提取完整的数组
        const firstBracket = cleanedText.indexOf('[');
        let depth = 0;
        let endPos = -1;
        
        for (let i = firstBracket; i < cleanedText.length; i++) {
          if (cleanedText[i] === '[') depth++;
          if (cleanedText[i] === ']') depth--;
          if (depth === 0) {
            endPos = i + 1;
            break;
          }
        }
        
        if (endPos > firstBracket) {
          const arrayText = cleanedText.substring(firstBracket, endPos);
          try {
            const array = JSON.parse(arrayText);
            if (Array.isArray(array) && array.length > 0) {
              parsed = array[0]; // 取第一个元素
              console.log('✅ 成功从数组中提取第一个对象');
            } else {
              throw new Error('数组为空');
            }
          } catch (arrayError) {
            console.error('❌ 数组解析失败:', arrayError);
            throw arrayError;
          }
        } else {
          // 数组不完整，尝试提取第一个对象
          console.log('⚠️ 数组不完整，尝试提取第一个对象');
          const firstBrace = cleanedText.indexOf('{');
          if (firstBrace === -1) {
            throw new Error('无法找到JSON对象');
          }
          
          let depth = 0;
          let objEndPos = -1;
          let inString = false;
          let escapeNext = false;
          
          for (let i = firstBrace; i < cleanedText.length; i++) {
            const char = cleanedText[i];
            
            if (escapeNext) {
              escapeNext = false;
              continue;
            }
            
            if (char === '\\') {
              escapeNext = true;
              continue;
            }
            
            if (char === '"') {
              inString = !inString;
              continue;
            }
            
            if (!inString) {
              if (char === '{') depth++;
              if (char === '}') {
                depth--;
                if (depth === 0) {
                  objEndPos = i + 1;
                  break;
                }
              }
            }
          }
          
          if (objEndPos > firstBrace) {
            const objText = cleanedText.substring(firstBrace, objEndPos);
            try {
              parsed = JSON.parse(objText);
              console.log('✅ 成功从不完整数组中提取第一个对象');
            } catch (objError) {
              console.error('❌ 对象解析失败:', objError);
              throw objError;
            }
          } else {
            throw new Error('无法找到完整的JSON对象');
          }
        }
      } else if (startsWithObject) {
        // 提取第一个完整的JSON对象（使用括号计数）
        const firstBrace = cleanedText.indexOf('{');
        let depth = 0;
        let endPos = -1;
        let inString = false;
        let escapeNext = false;
        
        for (let i = firstBrace; i < cleanedText.length; i++) {
          const char = cleanedText[i];
          
          // 处理字符串中的引号
          if (escapeNext) {
            escapeNext = false;
            continue;
          }
          
          if (char === '\\') {
            escapeNext = true;
            continue;
          }
          
          if (char === '"') {
            inString = !inString;
            continue;
          }
          
          // 只在非字符串中计数括号
          if (!inString) {
            if (char === '{') depth++;
            if (char === '}') {
              depth--;
              if (depth === 0) {
                endPos = i + 1;
                break;
              }
            }
          }
        }
        
        if (endPos > firstBrace) {
          jsonText = cleanedText.substring(firstBrace, endPos);
          console.log(`📦 提取的JSON长度: ${jsonText.length}字`);
          console.log(`📦 JSON预览: ${jsonText.substring(0, 300)}`);
          
          try {
            parsed = JSON.parse(jsonText);
            console.log('✅ JSON解析成功');
          } catch (parseError) {
            console.error('❌ JSON解析失败:', parseError);
            console.error('尝试解析的JSON:', jsonText.substring(0, 500));
            throw parseError;
          }
        } else {
          throw new Error('无法找到完整的JSON对象');
        }
      } else {
        console.error('❌ 无法识别JSON格式');
        console.error('清理后的内容:', cleanedText.substring(0, 500));
        throw new Error('无法从响应中提取JSON');
      }
      
      // 验证解析结果
      if (!parsed) {
        throw new Error('JSON解析结果为空');
      }
      
      const overallAnalysis: import('../types').OverallMarketAnalysis = {
        assetType,
        impact: parsed.impact || 'neutral',
        confidence: parsed.confidence || 0.5,
        summary: parsed.summary || '',
        investmentAdvice: parsed.investmentAdvice || '',
        keyFactors: parsed.keyFactors || [],
        riskLevel: parsed.riskLevel || 'medium',
        timeHorizon: parsed.timeHorizon || 'medium',
        predictedTrend: parsed.predictedTrend || '',
        analyzedNewsCount: newsList.length,
        timestamp: new Date().toISOString()
      };

      console.log(`✅ 整体市场分析完成:`, {
        impact: overallAnalysis.impact,
        confidence: overallAnalysis.confidence,
        riskLevel: overallAnalysis.riskLevel
      });

      return overallAnalysis;
      
    } catch (error) {
      console.error('❌ 整体市场分析失败:', error);
      
      // 详细的错误日志
      if (axios.isAxiosError(error)) {
        console.error('API错误详情:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message
        });
        
        // 403错误特殊处理
        if (error.response?.status === 403) {
          console.error('🚫 Gemini API 403错误 - 可能的原因：');
          console.error('1. API密钥无效或已过期');
          console.error('2. API密钥没有权限访问此模型');
          console.error('3. 请求内容违反了安全策略');
          console.error('4. 地区限制或IP被封禁');
          console.error('当前API密钥:', this.config.apiKey?.substring(0, 10) + '...');
        }
        
        // 429错误特殊处理
        if (error.response?.status === 429) {
          console.error('🚫 Gemini API 429错误 - API配额已用完');
          console.error('免费版限制：每分钟15次请求，每天1500次请求');
          console.error('建议：等待1-2分钟后重试');
        }
      }
      
      // 返回降级的分析结果，而不是抛出错误
      console.warn('⚠️ 使用降级分析结果');
      return this.generateFallbackOverallAnalysis(newsList, assetType);
    }
  }
}

/**
 * 默认分析服务实例 - 通过后端 API 调用
 */
export const analysisService = new AnalysisService({
  apiKey: '' // 不再需要前端 API 密钥，通过后端代理
});