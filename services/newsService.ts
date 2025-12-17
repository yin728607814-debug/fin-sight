/**
 * 新闻服务模块
 * 负责获取金融新闻数据和新闻影响分析
 */

import axios, { AxiosResponse } from 'axios';
import { 
  NewsItem, 
  NewsAnalysis, 
  AssetType, 
  NewsService as INewsService,
  ErrorType 
} from '../types';
import { 
  createAPIError, 
  ErrorHandler, 
  isRetryableError,
  calculateRetryDelay,
  DEFAULT_RETRY_CONFIG 
} from '../utils/errors';
import { validateNewsItem, sanitizeNewsItem } from '../utils/validation';
import { logInfo, logError } from './logger';
import { config } from '../config/env';
import { measureAsync, recordError } from '../utils/monitoring';

/**
 * 新闻API配置
 */
interface NewsAPIConfig {
  baseURL: string;
  apiKey: string;
  timeout: number;
  maxRetries: number;
}

/**
 * 新闻API响应接口
 */
interface NewsAPIResponse {
  status: string;
  totalResults: number;
  articles: Array<{
    source: { id: string; name: string };
    author: string;
    title: string;
    description: string;
    url: string;
    urlToImage: string;
    publishedAt: string;
    content: string;
  }>;
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
 * 新闻服务实现类
 */
export class NewsService implements INewsService {
  private config: NewsAPIConfig;
  private errorHandler: ErrorHandler;
  private cache: Map<string, CacheItem<NewsItem[]>>;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

  constructor(apiConfig?: Partial<NewsAPIConfig>) {
    // 检测是否在浏览器环境中，如果是则使用代理
    const isBrowser = typeof window !== 'undefined';
    const baseURL = isBrowser 
      ? '/.netlify/functions/news-proxy' // 使用Netlify函数代理
      : 'https://newsapi.org/v2'; // 服务器环境直接调用API
    
    this.config = {
      baseURL,
      apiKey: config.apiKeys.news,
      timeout: config.api.timeout,
      maxRetries: config.api.retryAttempts,
      ...apiConfig
    };
    
    this.errorHandler = ErrorHandler.getInstance();
    this.cache = new Map();
    
    logInfo('NewsService initialized', { 
      baseURL: this.config.baseURL,
      isBrowser,
      hasApiKey: !!this.config.apiKey,
      apiKeyPrefix: this.config.apiKey ? this.config.apiKey.substring(0, 8) + '...' : 'none'
    });
  }

  /**
   * 获取市场新闻
   */
  async fetchMarketNews(assetType: AssetType, limit: number = 20): Promise<NewsItem[]> {
    const cacheKey = `news_${assetType}_${limit}`;
    
    // 检查缓存
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      logInfo('返回缓存的新闻数据', { assetType, count: cached.length });
      return cached;
    }

    // 检测是否为本地开发环境
    const isLocalDev = window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1' ||
                      window.location.port === '3001';
    
    if (isLocalDev) {
      console.warn('🌐 检测到本地开发环境');
      console.warn('📰 News API不支持浏览器直接调用（CORS限制）');
      console.warn('🎭 使用演示数据进行展示');
      console.warn('💡 部署到生产环境后将使用真实数据');
      
      const { generateDemoNews } = await import('./demoDataService');
      const demoNews = generateDemoNews(assetType, limit);
      this.setCache(cacheKey, demoNews);
      
      logInfo('使用演示新闻数据', { assetType, count: demoNews.length });
      return demoNews;
    }

    // 服务器环境：尝试真实API调用
    return measureAsync(
      'news_fetch',
      async () => {
        try {
          console.log('🚀 服务器环境：开始获取真实新闻数据', { assetType, limit });
          logInfo('开始获取新闻数据', { assetType, limit });
          
          const query = this.buildSearchQuery(assetType);
          console.log('🔍 搜索查询', { query });
          
          const response = await this.makeRequest('/everything', {
            q: query,
            language: 'en',
            sortBy: 'publishedAt',
            pageSize: Math.min(limit, 100) // API限制
            // 移除时间限制，获取更多结果
          });

          console.log('📡 API响应状态', { 
            status: response.status, 
            statusText: response.statusText,
            dataStatus: response.data?.status,
            totalResults: response.data?.totalResults
          });

          const newsItems = this.transformAPIResponse(response.data);
          console.log('🔄 数据转换结果', { 转换后数量: newsItems.length });
          
          const validatedNews = this.validateAndFilterNews(newsItems, assetType);
          console.log('✅ 验证过滤结果', { 最终数量: validatedNews.length });
          
          // 缓存结果
          this.setCache(cacheKey, validatedNews);
          
          console.log('🎉 新闻获取完成', { 
            assetType, 
            原始数量: newsItems.length, 
            验证后数量: validatedNews.length,
            返回数量: Math.min(validatedNews.length, limit)
          });
          
          logInfo('成功获取新闻数据', { 
            assetType, 
            total: newsItems.length, 
            validated: validatedNews.length 
          });
          
          return validatedNews.slice(0, limit);
          
        } catch (error) {
          recordError(error as Error, { operation: 'fetchMarketNews', assetType, limit });
          
          console.error('❌ 真实API调用失败，回退到演示数据');
          logError('⚠️ 新闻API调用失败，使用演示数据', error);
          
          const { generateDemoNews } = await import('./demoDataService');
          const demoNews = generateDemoNews(assetType, limit);
          this.setCache(cacheKey, demoNews);
          return demoNews;
        }
      },
      { assetType, limit }
    );
  }

  /**
   * 分析新闻影响
   */
  async analyzeNewsImpact(news: NewsItem[], assetType: string): Promise<NewsAnalysis[]> {
    try {
      logInfo('开始分析新闻影响', { newsCount: news.length, assetType });
      
      const analyses: NewsAnalysis[] = [];
      
      for (const newsItem of news) {
        try {
          const analysis = await this.analyzeIndividualNews(newsItem, assetType);
          analyses.push(analysis);
        } catch (error) {
          logError('单条新闻分析失败', { newsId: newsItem.id, error });
          // 继续处理其他新闻，不中断整个流程
        }
      }
      
      logInfo('新闻影响分析完成', { 
        total: news.length, 
        successful: analyses.length 
      });
      
      return analyses;
      
    } catch (error) {
      const apiError = this.errorHandler.handleAnalysisError(error);
      logError('新闻影响分析失败', apiError);
      throw apiError;
    }
  }

  /**
   * 构建搜索查询
   */
  private buildSearchQuery(assetType: AssetType): string {
    // 使用更简单的查询，避免复杂的OR语句
    const queries = {
      gold: 'gold',
      nasdaq: 'stock market'  // 使用更通用的词汇
    };
    
    return queries[assetType] || assetType;
  }

  /**
   * 发起API请求（带重试机制）
   */
  private async makeRequest(endpoint: string, params: Record<string, unknown>): Promise<AxiosResponse<NewsAPIResponse>> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        const isLocalDev = typeof window !== 'undefined' && (
          window.location.hostname === 'localhost' || 
          window.location.hostname === '127.0.0.1' ||
          window.location.port === '3001'
        );
        
        let response: AxiosResponse<NewsAPIResponse>;

        if (isLocalDev) {
          // 本地开发环境：这里不应该被调用，因为本地开发直接返回演示数据
          throw new Error('本地开发环境不应该调用真实API');
        } else if (typeof window !== 'undefined') {
          // 生产环境浏览器：使用Netlify函数代理
          console.log('🌐 生产环境：使用Netlify函数代理调用News API');
          response = await axios.get('/.netlify/functions/news-proxy', {
            params: params, // 不包含apiKey，由代理处理
            timeout: this.config.timeout
          });
        } else {
          // 服务器环境：直接调用API
          response = await axios.get(`${this.config.baseURL}${endpoint}`, {
            params: {
              ...params,
              apiKey: this.config.apiKey
            },
            timeout: this.config.timeout,
            headers: {
              'User-Agent': 'Investment-News-Analyzer/1.0'
            }
          });
        }

        if (response.data.status === 'error') {
          throw createAPIError(
            ErrorType.API_LIMIT_EXCEEDED,
            response.data.message || 'API请求失败',
            response.data.code
          );
        }

        return response;
        
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === this.config.maxRetries) {
          break;
        }
        
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 429) {
            // API限制，等待更长时间
            const delay = calculateRetryDelay(attempt, {
              ...DEFAULT_RETRY_CONFIG,
              baseDelay: 2000
            });
            logInfo(`API限制，等待${delay}ms后重试`, { attempt });
            await this.sleep(delay);
            continue;
          }
          
          if (!isRetryableError(error)) {
            throw this.errorHandler.handleNetworkError(error);
          }
        }
        
        const delay = calculateRetryDelay(attempt);
        logInfo(`请求失败，${delay}ms后重试`, { attempt, error: (error as Error).message });
        await this.sleep(delay);
      }
    }
    
    throw this.errorHandler.handleNetworkError(lastError);
  }

  /**
   * 转换API响应为内部数据格式
   */
  private transformAPIResponse(apiResponse: NewsAPIResponse): NewsItem[] {
    console.log('🔄 开始转换API响应', { 
      hasArticles: !!apiResponse.articles, 
      articlesCount: apiResponse.articles?.length || 0,
      totalResults: apiResponse.totalResults 
    });

    if (!apiResponse.articles || !Array.isArray(apiResponse.articles)) {
      console.error('❌ API响应格式错误', { apiResponse });
      return [];
    }

    const transformedItems = apiResponse.articles
      .map((article, index) => {
        try {
          // 确保必需字段存在
          if (!article.title || !article.publishedAt) {
            console.warn('⚠️ 新闻缺少必需字段', { 
              hasTitle: !!article.title, 
              hasPublishedAt: !!article.publishedAt,
              article: article 
            });
            return null;
          }

          const newsItem = {
            id: `news_${Date.now()}_${index}`,
            title: article.title.trim(),
            content: (article.description || article.content || article.title).trim(), // 确保有内容
            source: article.source?.name || 'Unknown',
            publishedAt: new Date(article.publishedAt),
            url: article.url || '#',
            relevanceScore: this.calculateRelevanceScore(article.title, article.description || article.content)
          };

          // 确保内容不为空
          if (!newsItem.content || newsItem.content.length === 0) {
            newsItem.content = newsItem.title; // 如果内容为空，使用标题
          }

          console.log('✅ 转换新闻成功', { 
            id: newsItem.id,
            title: newsItem.title.substring(0, 50) + '...',
            contentLength: newsItem.content.length,
            source: newsItem.source,
            relevanceScore: newsItem.relevanceScore
          });

          return newsItem;
        } catch (error) {
          console.error('❌ 转换新闻数据失败', { article, error });
          return null;
        }
      })
      .filter((item): item is NewsItem => item !== null);

    console.log('🔄 转换完成', { 
      原始数量: apiResponse.articles.length, 
      转换成功: transformedItems.length 
    });

    return transformedItems;
  }

  /**
   * 验证和过滤新闻数据
   */
  private validateAndFilterNews(newsItems: NewsItem[], assetType: AssetType): NewsItem[] {
    console.log('🔍 开始验证和过滤新闻', { 
      输入数量: newsItems.length, 
      资产类型: assetType 
    });

    const keywords = this.getAssetKeywords(assetType);
    console.log('🔑 关键词列表', { keywords });
    
    const processedItems = newsItems
      .map((item, index) => {
        // 先清理数据
        const sanitized = sanitizeNewsItem(item);
        if (!sanitized) {
          console.warn(`⚠️ 清理数据失败 [${index}]`, { item });
          return null;
        }
        
        // 验证数据 - 在生产环境中更宽松
        const validation = validateNewsItem(sanitized);
        if (!validation.isValid) {
          // 在生产环境中，只要有标题和内容就接受
          const isProduction = typeof window !== 'undefined' && 
                              window.location.hostname !== 'localhost' && 
                              window.location.hostname !== '127.0.0.1';
          
          if (isProduction && sanitized.title && sanitized.content) {
            console.log(`📝 生产环境：接受基本有效的新闻 [${index}]`, { 
              title: sanitized.title.substring(0, 50) + '...'
            });
          } else {
            console.warn(`⚠️ 数据验证失败 [${index}]`, { 
              title: sanitized.title.substring(0, 50),
              errors: validation.errors 
            });
            return null;
          }
        }
        
        // 检查相关性 - 生产环境中更宽松的匹配
        const content = (sanitized.title + ' ' + sanitized.content).toLowerCase();
        const matchedKeywords = keywords.filter(keyword => 
          content.includes(keyword.toLowerCase())
        );
        const isRelevant = matchedKeywords.length > 0;
        
        // 可靠来源列表
        const reliableSources = ['reuters', 'bloomberg', 'cnbc', 'marketwatch', 'yahoo finance', 'financial times', 'ap news', 'associated press', 'globenewswire', 'financial post'];
        const hasReliableSource = reliableSources.some(source => 
          sanitized.source.toLowerCase().includes(source)
        );
        
        // 检查是否包含金融相关词汇（更广泛的匹配）
        const financialTerms = [
          'nasdaq', 'stock', 'market', 'trading', 'investment', 'financial', 'finance',
          'company', 'corp', 'inc', 'ltd', 'business', 'revenue', 'earnings', 'profit',
          'shares', 'equity', 'securities', 'capital', 'fund', 'portfolio', 'analyst',
          'price', 'value', 'growth', 'dividend', 'merger', 'acquisition', 'ipo',
          'economic', 'economy', 'industry', 'sector', 'commercial', 'enterprise'
        ];
        
        const hasFinancialTerms = financialTerms.some(term => 
          content.includes(term.toLowerCase())
        );
        
        // 生产环境中的宽松过滤策略
        const isProduction = typeof window !== 'undefined' && 
                            window.location.hostname !== 'localhost' && 
                            window.location.hostname !== '127.0.0.1';
        
        const shouldKeep = isProduction ? 
          // 生产环境：只要有金融相关词汇或来自可靠源就保留
          (isRelevant || hasReliableSource || hasFinancialTerms) :
          // 开发环境：更严格的过滤
          (isRelevant || hasReliableSource);
        
        console.log(`📰 新闻过滤 [${index}]`, { 
          title: sanitized.title.substring(0, 50) + '...',
          source: sanitized.source,
          isRelevant,
          matchedKeywords: matchedKeywords.length,
          hasReliableSource,
          hasFinancialTerms,
          isProduction,
          willKeep: shouldKeep
        });
        
        return shouldKeep ? sanitized : null;
      })
      .filter((item): item is NewsItem => item !== null)
      .sort((a, b) => b.relevanceScore - a.relevanceScore); // 按相关性排序

    console.log('✅ 验证和过滤完成', { 
      输入数量: newsItems.length, 
      输出数量: processedItems.length 
    });

    return processedItems;
  }

  /**
   * 获取资产相关关键词
   */
  private getAssetKeywords(assetType: AssetType): string[] {
    const keywords = {
      gold: [
        'gold', 'precious metals', 'XAUUSD', 'bullion', 'gold price', 'gold market',
        'metal', 'commodity', 'inflation', 'dollar', 'fed', 'interest rate',
        'silver', 'platinum', 'mining', 'jewelry', 'central bank', 'reserve'
      ],
      nasdaq: [
        'nasdaq', 'tech', 'technology', 'stock', 'NDX', 'apple', 'microsoft', 
        'google', 'amazon', 'tesla', 'nvidia', 'meta', 'AI', 'artificial intelligence',
        'software', 'chip', 'semiconductor', 'earnings', 'market', 'trading',
        'biotech', 'pharmaceutical', 'healthcare', 'fintech', 'startup', 'ipo',
        'venture', 'investment', 'fund', 'analyst', 'upgrade', 'downgrade',
        'revenue', 'profit', 'growth', 'innovation', 'digital', 'cloud',
        'cybersecurity', 'data', 'platform', 'enterprise', 'consumer'
      ]
    };
    
    return keywords[assetType] || [];
  }

  /**
   * 计算新闻相关性评分
   */
  private calculateRelevanceScore(title: string, description: string): number {
    const content = (title + ' ' + (description || '')).toLowerCase();
    
    // 基础评分
    let score = 0.5;
    
    // 标题权重更高
    const titleWords = title.toLowerCase().split(' ');
    const importantWords = ['price', 'market', 'trading', 'investment', 'analysis', 'forecast'];
    
    titleWords.forEach(word => {
      if (importantWords.includes(word)) {
        score += 0.1;
      }
    });
    
    // 内容长度影响
    if (content.length > 100) {
      score += 0.1;
    }
    
    // 确保评分在0-1范围内
    return Math.min(Math.max(score, 0), 1);
  }

  /**
   * 分析单条新闻
   */
  private async analyzeIndividualNews(newsItem: NewsItem, _assetType: string): Promise<NewsAnalysis> {
    // 这里是简化的分析逻辑，实际应该调用AI服务
    const content = newsItem.title + ' ' + newsItem.content;
    
    // 简单的情感分析
    const positiveWords = ['rise', 'gain', 'increase', 'bull', 'positive', 'growth', 'up'];
    const negativeWords = ['fall', 'drop', 'decline', 'bear', 'negative', 'loss', 'down'];
    
    const lowerContent = content.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowerContent.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerContent.includes(word)).length;
    
    let impact: 'positive' | 'negative' | 'neutral' = 'neutral';
    let confidence = 0.5;
    let predictedChange = 0;
    
    if (positiveCount > negativeCount) {
      impact = 'positive';
      confidence = Math.min(0.5 + (positiveCount * 0.1), 0.9);
      predictedChange = positiveCount * 0.5;
    } else if (negativeCount > positiveCount) {
      impact = 'negative';
      confidence = Math.min(0.5 + (negativeCount * 0.1), 0.9);
      predictedChange = -negativeCount * 0.5;
    }
    
    return {
      newsId: newsItem.id,
      impact,
      confidence,
      summary: this.generateSummary(newsItem, impact),
      keyPoints: this.extractKeyPoints(content),
      predictedChange,
      timeframe: 'short'
    };
  }

  /**
   * 生成新闻摘要
   */
  private generateSummary(newsItem: NewsItem, impact: 'positive' | 'negative' | 'neutral'): string {
    const impactText = {
      positive: '可能对市场产生积极影响',
      negative: '可能对市场产生消极影响',
      neutral: '对市场影响相对中性'
    };
    
    return `${newsItem.title.substring(0, 50)}... ${impactText[impact]}`;
  }

  /**
   * 提取关键点
   */
  private extractKeyPoints(content: string): string[] {
    // 简化的关键点提取
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
    return sentences.slice(0, 3).map(s => s.trim());
  }

  /**
   * 缓存管理
   */
  private getFromCache(key: string): NewsItem[] | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() > cached.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  private setCache(key: string, data: NewsItem[]): void {
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
   * 检查数据是否过期
   */
  public isDataExpired(key: string): boolean {
    const cached = this.cache.get(key);
    if (!cached) return true;
    return Date.now() > cached.expiresAt;
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
 * 默认新闻服务实例
 */
export const newsService = new NewsService();