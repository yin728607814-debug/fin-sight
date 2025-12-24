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
    // 使用新浪财经API（中文新闻，无需翻译）
    const isBrowser = typeof window !== 'undefined';
    const baseURL = isBrowser 
      ? '/.netlify/functions/sina-news-proxy' // 使用新浪财经代理
      : 'https://feed.mix.sina.com.cn/api/roll/get'; // 服务器环境直接调用
    
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
  async fetchMarketNews(assetType: AssetType, limit: number = 50): Promise<NewsItem[]> {
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
      console.warn('📰 使用演示数据进行展示');
      console.warn('💡 部署到生产环境后将使用真实数据');
      
      const { generateDemoNews } = await import('./demoDataService');
      const demoNews = generateDemoNews(assetType, limit);
      this.setCache(cacheKey, demoNews);
      
      logInfo('使用演示新闻数据', { assetType, count: demoNews.length });
      return demoNews;
    }

    // 生产环境：根据资产类型选择API
    return measureAsync(
      'news_fetch',
      async () => {
        try {
          let newsItems: NewsItem[];
          
          if (assetType === 'nasdaq') {
            // 纳斯达克：使用Alpha Vantage News API
            console.log('🚀 使用Alpha Vantage获取纳斯达克新闻');
            newsItems = await this.fetchAlphaVantageNews(limit);
          } else {
            // 黄金：继续使用新浪财经
            console.log('🚀 使用新浪财经获取黄金新闻');
            newsItems = await this.fetchSinaNews(assetType, limit);
          }
          
          // 缓存结果
          this.setCache(cacheKey, newsItems);
          
          console.log('🎉 新闻获取完成', { 
            assetType, 
            总数量: newsItems.length
          });
          
          logInfo('成功获取新闻数据', { 
            assetType, 
            total: newsItems.length
          });
          
          return newsItems;
          
        } catch (error) {
          recordError(error as Error, { operation: 'fetchMarketNews', assetType, limit });
          
          console.error('❌ API调用失败，回退到演示数据');
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
   * 使用Finnhub获取纳斯达克新闻（免费配额：60次/分钟）
   */
  private async fetchAlphaVantageNews(limit: number = 50): Promise<NewsItem[]> {
    try {
      console.log('📡 调用Finnhub News API');
      
      // 纳斯达克100主要成分股
      const tickers = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'META', 'NFLX', 'AMD', 'INTC'];
      
      // 获取最近7天的新闻
      const toDate = new Date();
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - 7);
      
      const formatDate = (date: Date) => date.toISOString().split('T')[0];
      
      // 并发获取多个股票的新闻（限制并发数避免超限）
      const allNews: any[] = [];
      
      // 每次获取2个股票的新闻，避免超过速率限制
      for (let i = 0; i < Math.min(tickers.length, 4); i += 2) {
        const batch = tickers.slice(i, i + 2);
        
        const batchPromises = batch.map(ticker =>
          axios.get('https://finnhub.io/api/v1/company-news', {
            params: {
              symbol: ticker,
              from: formatDate(fromDate),
              to: formatDate(toDate),
              token: config.apiKeys.finnhub
            },
            timeout: this.config.timeout
          }).catch(err => {
            console.warn(`⚠️ 获取${ticker}新闻失败`, err.message);
            return { data: [] };
          })
        );
        
        const batchResults = await Promise.all(batchPromises);
        batchResults.forEach(response => {
          if (Array.isArray(response.data)) {
            allNews.push(...response.data);
          }
        });
        
        // 避免速率限制，批次间延迟
        if (i + 2 < tickers.length) {
          await this.sleep(1000);
        }
      }

      console.log('📡 Finnhub响应', { 
        totalNews: allNews.length
      });

      if (allNews.length === 0) {
        throw new Error('Finnhub API未返回新闻数据');
      }

      // 去重（按URL）
      const uniqueNews = Array.from(
        new Map(allNews.map(item => [item.url, item])).values()
      );

      // 按时间排序，取最新的
      const sortedNews = uniqueNews
        .sort((a, b) => b.datetime - a.datetime)
        .slice(0, limit);

      const newsItems = sortedNews.map((article: any, index: number) => {
        return {
          id: `finnhub_news_${Date.now()}_${index}`,
          title: article.headline || 'Untitled',
          content: article.summary || article.headline || '',
          source: article.source || 'Finnhub',
          publishedAt: new Date(article.datetime * 1000), // Unix timestamp转换
          url: article.url || '#',
          relevanceScore: 0.8, // Finnhub的新闻都是高相关性的
          image: article.image || undefined
        };
      });

      console.log('✅ Finnhub新闻转换完成', { count: newsItems.length });
      
      return newsItems;
      
    } catch (error) {
      console.error('❌ Finnhub API调用失败', error);
      throw error;
    }
  }

  /**
   * 使用新浪财经获取新闻（黄金等）
   */
  private async fetchSinaNews(assetType: AssetType, limit: number): Promise<NewsItem[]> {
    console.log('🚀 服务器环境：开始获取真实新闻数据', { assetType, limit });
    logInfo('开始获取新闻数据', { assetType, limit });
    
    const query = this.buildSearchQuery(assetType);
    console.log('🔍 搜索查询', { query });
    
    const response = await this.makeRequest('/everything', {
      q: query,
      language: 'en',
      sortBy: 'publishedAt',
      pageSize: Math.min(limit, 100) // API限制
    }, assetType);

    console.log('📡 API响应状态', { 
      status: response.status, 
      statusText: response.statusText,
      dataStatus: response.data?.status,
      totalResults: response.data?.totalResults
    });

    const newsItems = this.transformAPIResponse(response.data);
    console.log('🔄 数据转换结果', { 转换后数量: newsItems.length });
    
    // 根据assetType过滤相关新闻
    const filteredNews = this.filterNewsByKeywords(newsItems, assetType);
    console.log('✅ 关键词过滤结果', { 
      原始数量: newsItems.length,
      过滤后数量: filteredNews.length,
      assetType: assetType
    });
    
    // 如果过滤后新闻太少，返回所有新闻
    const finalNews = filteredNews.length >= 10 ? filteredNews : newsItems;
    console.log('📊 最终新闻数量', { 
      使用过滤: filteredNews.length >= 10,
      数量: finalNews.length
    });
    
    return finalNews;
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
    // 使用更精准的纳斯达克相关查询
    const queries = {
      gold: 'gold price OR gold market OR precious metals',
      nasdaq: 'NASDAQ OR "tech stocks" OR "technology stocks" OR AAPL OR MSFT OR GOOGL OR AMZN OR TSLA OR NVDA'
    };
    
    return queries[assetType] || assetType;
  }

  /**
   * 发起API请求（带重试机制）
   */
  private async makeRequest(endpoint: string, params: Record<string, unknown>, assetType: AssetType): Promise<AxiosResponse<NewsAPIResponse>> {
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
          // 生产环境浏览器：使用新浪财经代理
          console.log('🌐 生产环境：使用新浪财经API获取中文新闻');
          
          // 统一使用财经要闻（lid=2509）
          // 这是经过测试最可靠且内容最丰富的分类
          const category = 'finance';
          console.log('📊 使用财经要闻获取新闻');
          
          response = await axios.get('/.netlify/functions/sina-news-proxy', {
            params: { 
              category: category,
              num: 500  // 获取500条新闻用于过滤
            },
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
        
        // 检查是否来自新浪财经（新浪财经的新闻都是财经相关，无需严格过滤）
        const isFromSina = sanitized.source.includes('新浪') || 
                          sanitized.source.includes('sina') ||
                          sanitized.source.includes('财经') ||
                          sanitized.source.includes('经济');
        
        // 生产环境中的宽松过滤策略
        const isProduction = typeof window !== 'undefined' && 
                            window.location.hostname !== 'localhost' && 
                            window.location.hostname !== '127.0.0.1';
        
        const shouldKeep = isProduction ? 
          // 生产环境：新浪财经的新闻直接保留，或者有金融相关词汇
          (isFromSina || isRelevant || hasReliableSource || hasFinancialTerms) :
          // 开发环境：更严格的过滤
          (isRelevant || hasReliableSource);
        
        console.log(`📰 新闻过滤 [${index}]`, { 
          title: sanitized.title.substring(0, 50) + '...',
          source: sanitized.source,
          isFromSina,
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
   * 根据URL和关键词过滤新闻（优先URL过滤，更精准）
   */
  private filterNewsByKeywords(newsItems: NewsItem[], assetType: AssetType): NewsItem[] {
    console.log(`🔍 开始过滤${assetType}新闻，原始数量: ${newsItems.length}`);
    
    if (assetType === 'nasdaq') {
      // 纳斯达克：优先使用URL过滤
      const urlFiltered = newsItems.filter(item => 
        item.url && item.url.startsWith('https://finance.sina.com.cn/stock/usstock')
      );
      
      console.log(`   URL过滤(/stock/usstock): ${urlFiltered.length}条`);
      
      // 如果URL过滤结果足够，直接返回
      if (urlFiltered.length >= 50) {
        console.log(`   ✅ URL过滤已足够，返回前50条`);
        return urlFiltered.slice(0, 50);
      }
      
      // 否则补充关键词过滤
      const keywords = this.getAssetKeywords(assetType);
      const keywordFiltered = newsItems.filter(item => {
        // 已经在URL过滤中的，跳过
        if (urlFiltered.find(u => u.url === item.url)) return false;
        
        const content = (item.title + ' ' + item.content).toLowerCase();
        return keywords.some(keyword => content.includes(keyword.toLowerCase()));
      });
      
      console.log(`   关键词补充: ${keywordFiltered.length}条`);
      
      const result = [...urlFiltered, ...keywordFiltered].slice(0, 50);
      console.log(`   最终结果: ${result.length}条`);
      
      return result;
      
    } else if (assetType === 'gold') {
      // 黄金：URL过滤 (/money/ 且包含黄金关键词)
      const moneyNews = newsItems.filter(item => 
        item.url && item.url.startsWith('https://finance.sina.com.cn/money/')
      );
      
      const urlFiltered = moneyNews.filter(item => {
        const content = (item.title + ' ' + item.content).toLowerCase();
        return content.includes('黄金') || content.includes('金价') || 
               content.includes('贵金属') || content.includes('白银') ||
               content.includes('gold');
      });
      
      console.log(`   URL过滤(/money/+黄金关键词): ${urlFiltered.length}条`);
      
      // 如果URL过滤结果足够，直接返回
      if (urlFiltered.length >= 50) {
        console.log(`   ✅ URL过滤已足够，返回前50条`);
        return urlFiltered.slice(0, 50);
      }
      
      // 否则补充关键词过滤
      const keywords = this.getAssetKeywords(assetType);
      const keywordFiltered = newsItems.filter(item => {
        // 已经在URL过滤中的，跳过
        if (urlFiltered.find(u => u.url === item.url)) return false;
        
        const content = (item.title + ' ' + item.content).toLowerCase();
        return keywords.some(keyword => content.includes(keyword.toLowerCase()));
      });
      
      console.log(`   关键词补充: ${keywordFiltered.length}条`);
      
      const result = [...urlFiltered, ...keywordFiltered].slice(0, 50);
      console.log(`   最终结果: ${result.length}条`);
      
      return result;
    }
    
    // 其他类型，使用关键词过滤
    const keywords = this.getAssetKeywords(assetType);
    return newsItems.filter(item => {
      const content = (item.title + ' ' + item.content).toLowerCase();
      return keywords.some(keyword => content.includes(keyword.toLowerCase()));
    });
  }

  /**
   * 获取资产相关关键词（中英文混合，适配新浪财经）
   * 使用宽泛的关键词确保能匹配到足够的新闻
   */
  private getAssetKeywords(assetType: AssetType): string[] {
    const keywords = {
      gold: [
        // 核心关键词 - 必须包含
        '黄金', '金价', 'gold',
        // 相关关键词
        '贵金属', '白银', '铂金',
        '美元', '美联储', '通胀',
        '央行', '储备'
      ],
      nasdaq: [
        // 核心关键词 - 宽泛匹配
        '美股', '股市', '股价', '股票',
        '纳斯达克', '纳指',
        // 主要公司
        '苹果', '微软', '谷歌', '亚马逊', '特斯拉', '英伟达',
        'Apple', 'Microsoft', 'Google', 'Amazon', 'Tesla', 'NVIDIA',
        'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA',
        // 行业和市场
        '科技股', '芯片', 'AI', '人工智能',
        '财报', '业绩', '营收',
        '华尔街', '交易', '投资',
        // 英文
        'stock', 'nasdaq', 'tech', 'market'
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
   * 翻译新闻为中文
   */
  private async translateNews(newsItems: NewsItem[]): Promise<NewsItem[]> {
    // 在生产环境中，总是尝试翻译（API密钥由Netlify函数处理）
    const isProduction = typeof window !== 'undefined' && 
                        window.location.hostname !== 'localhost' && 
                        window.location.hostname !== '127.0.0.1';
    
    if (!isProduction && !config.apiKeys.gemini) {
      console.warn('⚠️ 本地开发环境未配置Gemini API密钥，跳过翻译');
      return newsItems;
    }

    console.log('🌐 开始翻译新闻为中文...', { 
      itemCount: newsItems.length,
      hasGeminiKey: !!config.apiKeys.gemini,
      geminiKeyPrefix: config.apiKeys.gemini ? config.apiKeys.gemini.substring(0, 10) + '...' : 'none'
    });
    
    const translatedItems: NewsItem[] = [];
    
    // 限制翻译数量以避免API限制和超时
    const itemsToTranslate = newsItems.slice(0, 5);
    console.log(`🔢 限制翻译数量为 ${itemsToTranslate.length} 条新闻`);
    
    for (let i = 0; i < itemsToTranslate.length; i++) {
      const item = itemsToTranslate[i];
      try {
        console.log(`🌐 翻译第 ${i + 1}/${itemsToTranslate.length} 条新闻: ${item.title.substring(0, 50)}...`);
        
        const translatedTitle = await this.translateText(item.title);
        const translatedContent = await this.translateText(item.content.substring(0, 500)); // 限制内容长度
        
        translatedItems.push({
          ...item,
          title: translatedTitle,
          content: translatedContent
        });
        
        console.log(`✅ 翻译完成: ${translatedTitle.substring(0, 50)}...`);
        
        // 避免API限制，每次翻译后延迟（增加到3秒）
        if (i < itemsToTranslate.length - 1) {
          console.log('⏳ 等待3秒避免API速率限制...');
          await this.sleep(3000);
        }
        
      } catch (error) {
        console.warn(`❌ 翻译第 ${i + 1} 条新闻失败，保留原文`, { 
          title: item.title.substring(0, 50), 
          error: error.message 
        });
        translatedItems.push(item);
      }
    }
    
    // 添加剩余未翻译的新闻
    if (newsItems.length > 5) {
      translatedItems.push(...newsItems.slice(5));
      console.log(`📝 添加剩余 ${newsItems.length - 5} 条未翻译新闻`);
    }
    
    console.log(`🎉 翻译完成，总计 ${translatedItems.length} 条新闻`);
    return translatedItems;
  }

  /**
   * 翻译单个文本（带重试机制）
   */
  private async translateText(text: string, maxRetries: number = 3): Promise<string> {
    if (!text || text.length === 0) return text;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log('🔄 调用翻译代理...', { textLength: text.length, attempt });
        
        const response = await axios.post('/.netlify/functions/translate', {
          text: text
        }, {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 30000 // 增加超时时间到30秒
        });

        console.log('📡 翻译代理响应状态:', response.status);
        
        const translatedText = response.data?.translatedText;
        
        if (translatedText && translatedText.trim().length > 0 && translatedText !== text) {
          console.log('✅ 翻译成功');
          return translatedText.trim();
        } else {
          console.warn('⚠️ 翻译响应无效，保留原文');
          return text;
        }
        
      } catch (error) {
        const isLastAttempt = attempt === maxRetries;
        const isRateLimitError = error.response?.status === 500 || error.response?.status === 429;
        
        console.error('❌ 翻译代理调用失败:', {
          message: error.message,
          status: error.response?.status,
          attempt,
          maxRetries,
          isRateLimitError
        });
        
        // 如果是速率限制错误且不是最后一次尝试，等待后重试
        if (isRateLimitError && !isLastAttempt) {
          const delay = attempt * 2000; // 递增延迟：2秒、4秒、6秒
          console.log(`⏳ 等待 ${delay}ms 后重试...`);
          await this.sleep(delay);
          continue;
        }
        
        // 最后一次尝试失败或非速率限制错误，返回原文
        return text;
      }
    }
    
    return text;
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