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
 * Gemini 模型列表（按优先级排序）
 * 注意：Gemini 3 系列需要使用 v1beta API
 */
const GEMINI_MODELS = [
  { model: 'gemini-3-pro-preview', version: 'v1beta' },      // 首选：Gemini 3.0 Pro（最强大，分析质量最高）
  { model: 'gemini-3-flash-preview', version: 'v1beta' },    // 备选1：Gemini 3.0 Flash（快速）
  { model: 'gemini-2.5-pro', version: 'v1' },                // 备选2：Gemini 2.5 Pro
  { model: 'gemini-2.5-flash', version: 'v1' },              // 备选3：Gemini 2.5 Flash
  { model: 'gemini-2.0-flash', version: 'v1' },              // 备选4：Gemini 2.0 Flash
];

/**
 * 调用 Gemini API（带自动降级）
 */
async function callGeminiWithFallback(
  apiKey: string,
  prompt: string,
  temperature: number = 0.7,
  maxOutputTokens: number = 2048,
  timeout: number = 30000
): Promise<string> {
  let lastError: Error | null = null;

  for (const { model, version } of GEMINI_MODELS) {
    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${apiKey}`,
        {
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature,
            maxOutputTokens
          }
        },
        { timeout }
      );

      const responseText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (responseText) {
        if (model !== GEMINI_MODELS[0].model) {
          console.log(`ℹ️ 使用备用模型: ${model} (${version})`);
        }
        return responseText;
      }
    } catch (error: any) {
      lastError = error;
      const status = error.response?.status;
      const isTimeout = error.code === 'ECONNABORTED' || error.message?.includes('timeout');
      
      // 503 (服务过载)、429 (配额限制) 或超时时尝试下一个模型
      if (status === 503 || status === 429 || isTimeout) {
        const reason = isTimeout ? '超时' : status;
        console.log(`⚠️ ${model} 不可用 (${reason})，尝试下一个模型...`);
        continue;
      }
      
      // 其他错误直接抛出
      throw error;
    }
  }

  // 所有模型都失败
  throw lastError || new Error('所有 Gemini 模型都不可用');
}

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
  private readonly CACHE_DURATION = 15 * 60 * 1000; // 15分钟缓存（优化配额使用）

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
   * 获取市场新闻（混合策略）
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
            // 纳斯达克：使用混合策略（中文源优先）
            console.log('🚀 使用混合策略获取纳斯达克新闻');
            newsItems = await this.fetchNasdaqNewsHybrid(limit);
          } else if (assetType === 'gold') {
            // 黄金：使用混合策略（中文源优先）
            console.log('🚀 使用混合策略获取黄金新闻');
            newsItems = await this.fetchGoldNewsHybrid(limit);
          } else if (assetType === 'astock') {
            // A股：使用新浪财经A股新闻
            console.log('🚀 使用新浪财经获取A股新闻');
            newsItems = await this.fetchSinaAStockNews(limit);
          } else {
            // 其他资产：使用新浪财经
            console.log('🚀 使用新浪财经获取新闻');
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
   * 混合策略获取纳斯达克新闻（中文源优先 + Finnhub备用）
   */
  private async fetchNasdaqNewsHybrid(limit: number = 50): Promise<NewsItem[]> {
    console.log('📡 开始混合策略获取纳斯达克新闻');
    console.log('📋 优先级: 东方财富 → 新浪财经 → Finnhub');
    
    const allNews: NewsItem[] = [];
    
    // 第一优先级：东方财富美股专页
    try {
      const eastmoneyNews = await this.fetchEastMoneyNews(limit);
      console.log(`✅ 东方财富获取成功: ${eastmoneyNews.length}条`);
      allNews.push(...eastmoneyNews);
    } catch (error) {
      console.warn(`⚠️ 东方财富获取失败:`, error.message);
    }
    
    // 第二优先级：新浪财经补充（获取足够多的新闻用于过滤）
    if (allNews.length < limit) {
      console.log(`📊 东方财富不足，获取新浪财经新闻`);
      
      try {
        // 获取500条新闻用于过滤（因为需要过滤出美股相关的）
        const sinaNews = await this.fetchSinaUSStockNews(500);
        console.log(`✅ 新浪财经获取成功: ${sinaNews.length}条`);
        allNews.push(...sinaNews);
      } catch (error) {
        console.warn(`⚠️ 新浪财经获取失败:`, error.message);
      }
    }
    
    console.log(`📊 合并前总数: ${allNews.length}条`);
    
    // 去重（按URL）
    const uniqueNews = this.deduplicateNews(allNews);
    console.log(`🔄 去重后: ${uniqueNews.length}条`);
    
    // 计算相关性评分
    const scoredNews = uniqueNews.map(news => ({
      ...news,
      relevanceScore: this.calculateNasdaqRelevanceScore(news)
    }));
    
    // 按相关性排序
    scoredNews.sort((a, b) => b.relevanceScore - a.relevanceScore);
    
    // 降低过滤阈值，保留更多新闻（阈值10分，更宽松）
    const filteredNews = scoredNews.filter(news => news.relevanceScore >= 0.1);
    console.log(`✂️ 过滤后: ${filteredNews.length}条 (相关性≥10分)`);
    
    // 如果中文源仍然不足，补充Finnhub + 翻译
    if (filteredNews.length < limit) {
      const needed = limit - filteredNews.length;
      console.log(`⚠️ 中文源不足（${filteredNews.length}/${limit}），需要Finnhub补充${needed}条`);
      console.log(`🌐 使用Finnhub获取并翻译...`);
      
      try {
        const finnhubNews = await this.fetchFinnhubNews(needed);
        if (finnhubNews.length > 0) {
          const translatedNews = await this.translateNewsItems(finnhubNews);
          filteredNews.push(...translatedNews);
          console.log(`✅ Finnhub补充完成: ${translatedNews.length}条`);
        }
      } catch (error) {
        console.error(`❌ Finnhub补充失败:`, error);
      }
    } else {
      console.log(`✅ 中文源充足，无需Finnhub补充`);
    }
    
    // 返回前N条
    const finalNews = filteredNews.slice(0, limit);
    console.log(`🎯 最终返回: ${finalNews.length}条`);
    console.log(`📊 来源: 东方财富优先 + 新浪财经补充`);
    
    return finalNews;
  }

  /**
   * 混合策略获取黄金新闻（中文源优先 + Finnhub备用）
   */
  private async fetchGoldNewsHybrid(limit: number = 50): Promise<NewsItem[]> {
    console.log('📡 开始混合策略获取黄金新闻');
    console.log('📋 优先级: 东方财富黄金频道 → 新浪财经 → Finnhub');
    
    const allNews: NewsItem[] = [];
    
    // 第一优先级：东方财富黄金频道
    try {
      const eastmoneyGoldNews = await this.fetchEastMoneyGoldNews(limit);
      console.log(`✅ 东方财富黄金频道获取成功: ${eastmoneyGoldNews.length}条`);
      allNews.push(...eastmoneyGoldNews);
    } catch (error) {
      console.warn(`⚠️ 东方财富黄金频道获取失败:`, error.message);
    }
    
    // 第二优先级：新浪财经黄金新闻补充
    if (allNews.length < limit) {
      console.log(`📊 东方财富不足，获取新浪财经黄金新闻`);
      
      try {
        // 获取500条新闻用于过滤（因为需要过滤出黄金相关的）
        const sinaNews = await this.fetchSinaGoldNews(500);
        console.log(`✅ 新浪财经获取成功: ${sinaNews.length}条`);
        allNews.push(...sinaNews);
      } catch (error) {
        console.warn(`⚠️ 新浪财经获取失败:`, error.message);
      }
    }
    
    console.log(`📊 合并前总数: ${allNews.length}条`);
    
    // 去重（按URL）
    const uniqueNews = this.deduplicateNews(allNews);
    console.log(`🔄 去重后: ${uniqueNews.length}条`);
    
    // 计算相关性评分
    const scoredNews = uniqueNews.map(news => ({
      ...news,
      relevanceScore: this.calculateGoldRelevanceScore(news)
    }));
    
    // 按相关性排序
    scoredNews.sort((a, b) => b.relevanceScore - a.relevanceScore);
    
    // 降低过滤阈值，保留更多新闻（阈值10分，更宽松）
    const filteredNews = scoredNews.filter(news => news.relevanceScore >= 0.1);
    console.log(`✂️ 过滤后: ${filteredNews.length}条 (相关性≥10分)`);
    
    // 如果中文源仍然不足，补充Finnhub + 翻译
    if (filteredNews.length < limit) {
      const needed = limit - filteredNews.length;
      console.log(`⚠️ 中文源不足（${filteredNews.length}/${limit}），需要Finnhub补充${needed}条`);
      console.log(`🌐 使用Finnhub获取并翻译...`);
      
      try {
        const finnhubNews = await this.fetchFinnhubGoldNews(needed);
        if (finnhubNews.length > 0) {
          const translatedNews = await this.translateNewsItems(finnhubNews);
          filteredNews.push(...translatedNews);
          console.log(`✅ Finnhub补充完成: ${translatedNews.length}条`);
        }
      } catch (error) {
        console.error(`❌ Finnhub补充失败:`, error);
      }
    } else {
      console.log(`✅ 中文源充足，无需Finnhub补充`);
    }
    
    // 返回前N条
    const finalNews = filteredNews.slice(0, limit);
    console.log(`🎯 最终返回: ${finalNews.length}条`);
    console.log(`📊 来源: 东方财富黄金频道优先 + 新浪财经补充`);
    
    return finalNews;
  }

  /**
   * 获取新浪财经A股新闻
   */
  private async fetchSinaAStockNews(limit: number): Promise<NewsItem[]> {
    try {
      const response = await axios.get('/.netlify/functions/sina-news-proxy', {
        params: { 
          category: 'finance',
          num: limit
        },
        timeout: this.config.timeout
      });

      if (!response.data.articles || !Array.isArray(response.data.articles)) {
        return [];
      }

      // 只保留A股相关的新闻
      const astockNews = response.data.articles
        .filter((article: any) => {
          const url = article.url || '';
          const title = article.title || '';
          const content = (article.description || article.content || '').toLowerCase();
          
          // A股相关关键词
          const keywords = ['A股', 'a股', '沪指', '深指', '上证', '深证',
                           '上证指数', '深证成指', '创业板', '科创板',
                           '股市', '股票', '股价', '大盘', '指数',
                           '涨跌', '行情', '交易', '成交',
                           '证监会', '交易所', '上交所', '深交所',
                           '白酒', '新能源', '半导体', '医药', '地产',
                           '银行', '保险', '券商', '基金',
                           '北向资金', '外资', '机构', '散户'];
          
          // URL过滤：A股路径（排除美股和港股）
          const hasAStockURL = url.includes('/stock/') && 
                              !url.includes('/usstock/') && 
                              !url.includes('/hkstock/');
          
          // 如果URL匹配，直接保留
          if (hasAStockURL) return true;
          
          // 否则检查关键词
          const hasKeyword = keywords.some(kw => 
            title.includes(kw) || content.includes(kw.toLowerCase())
          );
          
          return hasKeyword;
        })
        .slice(0, limit)
        .map((article: any, index: number) => {
          // 使用 URL 或标题生成稳定的 ID（不使用时间戳）
          const stableId = article.url 
            ? `sina_astock_${this.hashString(article.url)}`
            : `sina_astock_${this.hashString(article.title)}_${index}`;
          
          return {
            id: stableId,
            title: article.title || '',
            content: article.description || article.content || article.title || '',
            source: '新浪财经',
            publishedAt: new Date(article.publishedAt || Date.now()),
            url: article.url || '#',
            relevanceScore: 0.5,
            image: article.image
          };
        });

      return astockNews;
    } catch (error) {
      console.error('新浪财经A股新闻获取失败:', error);
      return [];
    }
  }

  /**
   * 获取新浪财经美股新闻
   */
  private async fetchSinaUSStockNews(limit: number): Promise<NewsItem[]> {
    try {
      const response = await axios.get('/.netlify/functions/sina-news-proxy', {
        params: { 
          category: 'finance',
          num: limit  // 使用传入的limit参数
        },
        timeout: this.config.timeout
      });

      if (!response.data.articles || !Array.isArray(response.data.articles)) {
        return [];
      }

      // 只保留美股相关的新闻（更宽松的过滤）
      const usStockNews = response.data.articles
        .filter((article: any) => {
          const url = article.url || '';
          const title = article.title || '';
          const content = (article.description || article.content || '').toLowerCase();
          
          // URL过滤：包含美股路径
          const hasUSStockURL = url.includes('/stock/usstock/') || 
                               url.includes('/stock/us/') ||
                               url.includes('/usstock/');
          
          // 如果URL匹配，直接保留
          if (hasUSStockURL) return true;
          
          // 否则检查关键词
          const keywords = ['美股', '纳斯达克', '纳指', '科技股', 'NASDAQ', 
                           '苹果', '微软', '谷歌', '亚马逊', '特斯拉', '英伟达',
                           'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA',
                           '华尔街', '道琼斯', '标普'];
          const hasKeyword = keywords.some(kw => 
            title.includes(kw) || content.includes(kw.toLowerCase())
          );
          
          return hasKeyword;
        })
        .slice(0, limit)
        .map((article: any, index: number) => {
          // 使用 URL 或标题生成稳定的 ID（不使用时间戳）
          const stableId = article.url 
            ? `sina_us_${this.hashString(article.url)}`
            : `sina_us_${this.hashString(article.title)}_${index}`;
          
          return {
            id: stableId,
            title: article.title || '',
            content: article.description || article.content || article.title || '',
            source: '新浪财经',
            publishedAt: new Date(article.publishedAt || Date.now()),
            url: article.url || '#',
            relevanceScore: 0.5,
            image: article.image
          };
        });

      return usStockNews;
    } catch (error) {
      console.error('新浪财经美股新闻获取失败:', error);
      return [];
    }
  }

  /**
   * 获取新浪财经黄金新闻
   */
  private async fetchSinaGoldNews(limit: number): Promise<NewsItem[]> {
    try {
      const response = await axios.get('/.netlify/functions/sina-news-proxy', {
        params: { 
          category: 'finance',
          num: limit
        },
        timeout: this.config.timeout
      });

      if (!response.data.articles || !Array.isArray(response.data.articles)) {
        return [];
      }

      // 只保留黄金相关的新闻
      const goldNews = response.data.articles
        .filter((article: any) => {
          const url = article.url || '';
          const title = article.title || '';
          const content = (article.description || article.content || '').toLowerCase();
          
          // 黄金相关关键词
          const keywords = ['黄金', '金价', '贵金属', '白银', '现货金', 'XAUUSD', 
                           '伦敦金', '美元金', '金市', '黄金市场', '金银',
                           '避险', '通胀', '美联储', '央行', '黄金储备'];
          const hasKeyword = keywords.some(kw => 
            title.includes(kw) || content.includes(kw.toLowerCase())
          );
          
          return hasKeyword;
        })
        .slice(0, limit)
        .map((article: any, index: number) => {
          // 使用 URL 或标题生成稳定的 ID（不使用时间戳）
          const stableId = article.url 
            ? `sina_gold_${this.hashString(article.url)}`
            : `sina_gold_${this.hashString(article.title)}_${index}`;
          
          return {
            id: stableId,
            title: article.title || '',
            content: article.description || article.content || article.title || '',
            source: '新浪财经',
            publishedAt: new Date(article.publishedAt || Date.now()),
            url: article.url || '#',
            relevanceScore: 0.5,
            image: article.image
          };
        });

      return goldNews;
    } catch (error) {
      console.error('新浪财经黄金新闻获取失败:', error);
      return [];
    }
  }

  /**
   * 获取东方财富美股新闻
   */
  private async fetchEastMoneyNews(limit: number): Promise<NewsItem[]> {
    try {
      const response = await axios.get('/.netlify/functions/eastmoney-news-proxy', {
        timeout: this.config.timeout
      });

      if (!response.data.articles || !Array.isArray(response.data.articles)) {
        console.warn('东方财富返回数据格式错误');
        return [];
      }

      return response.data.articles
        .slice(0, limit)
        .map((article: any, index: number) => {
          // 使用 URL 或标题生成稳定的 ID（不使用时间戳）
          const stableId = article.url 
            ? `eastmoney_${this.hashString(article.url)}`
            : `eastmoney_${this.hashString(article.title)}_${index}`;
          
          return {
            id: stableId,
            title: article.title || '',
            content: article.description || article.content || article.title || '',
            source: '东方财富',
            publishedAt: new Date(article.publishedAt || Date.now()),
            url: article.url || '#',
            relevanceScore: 0.5,
            image: article.image
          };
        });
    } catch (error) {
      console.error('东方财富新闻获取失败:', error);
      return [];
    }
  }

  /**
   * 获取东方财富黄金新闻
   */
  private async fetchEastMoneyGoldNews(limit: number): Promise<NewsItem[]> {
    try {
      const response = await axios.get('/.netlify/functions/eastmoney-gold-proxy', {
        timeout: this.config.timeout
      });

      if (!response.data.articles || !Array.isArray(response.data.articles)) {
        console.warn('东方财富黄金频道返回数据格式错误');
        return [];
      }

      return response.data.articles
        .slice(0, limit)
        .map((article: any, index: number) => {
          // 使用 URL 或标题生成稳定的 ID（不使用时间戳）
          const stableId = article.url 
            ? `eastmoney_gold_${this.hashString(article.url)}`
            : `eastmoney_gold_${this.hashString(article.title)}_${index}`;
          
          return {
            id: stableId,
            title: article.title || '',
            content: article.description || article.content || article.title || '',
            source: '东方财富',
            publishedAt: new Date(article.publishedAt || Date.now()),
            url: article.url || '#',
            relevanceScore: 0.5,
            image: article.image
          };
        });
    } catch (error) {
      console.error('东方财富黄金新闻获取失败:', error);
      return [];
    }
  }

  /**
   * 计算纳斯达克相关性评分（0-1）- 优化版
   */
  private calculateNasdaqRelevanceScore(news: NewsItem): number {
    let score = 0;
    const title = news.title.toLowerCase();
    const content = news.content.toLowerCase();
    const url = news.url.toLowerCase();
    const source = news.source.toLowerCase();
    
    // 1. 来源加分 (40分) - 提高来源权重
    // 东方财富美股专页的新闻默认高分
    if (source.includes('东方财富') || url.includes('eastmoney.com')) {
      score += 0.40;
    }
    // 新浪财经美股路径
    else if (url.includes('/usstock/') || url.includes('/stock/us')) {
      score += 0.40;
    }
    // 其他新浪财经新闻
    else if (source.includes('新浪') || source.includes('sina') || source.includes('财经')) {
      score += 0.30;
    }
    
    // 2. 标题核心关键词 (30分)
    const highPriorityKeywords = ['纳斯达克', 'nasdaq', '纳指', '美股', '华尔街', '道琼斯', '标普'];
    if (highPriorityKeywords.some(kw => title.includes(kw))) {
      score += 0.30;
    }
    
    // 3. 科技公司和股票代码 (20分)
    const companies = ['苹果', '微软', '谷歌', '亚马逊', '特斯拉', '英伟达', 
                      'apple', 'microsoft', 'google', 'amazon', 'tesla', 'nvidia',
                      'aapl', 'msft', 'googl', 'amzn', 'tsla', 'nvda', 'meta', 'nflx'];
    if (companies.some(kw => title.includes(kw) || content.includes(kw))) {
      score += 0.20;
    }
    
    // 4. 通用财经关键词 (10分)
    const generalKeywords = ['科技股', '芯片', '半导体', 'ai', '人工智能', '上市', 'ipo', '美联储', '股市', '股价'];
    if (generalKeywords.some(kw => title.includes(kw) || content.includes(kw))) {
      score += 0.10;
    }
    
    return Math.min(score, 1.0);
  }

  /**
   * 计算黄金相关性评分（0-1）- 优化版
   */
  private calculateGoldRelevanceScore(news: NewsItem): number {
    let score = 0;
    const title = news.title.toLowerCase();
    const content = news.content.toLowerCase();
    const url = news.url.toLowerCase();
    const source = news.source.toLowerCase();
    
    // 1. 来源加分 (40分) - 提高来源权重
    // 东方财富黄金频道的新闻默认高分
    if (source.includes('东方财富') || url.includes('gold.eastmoney.com')) {
      score += 0.40;
    }
    // 新浪财经
    else if (source.includes('新浪') || source.includes('sina') || source.includes('财经')) {
      score += 0.30;
    }
    
    // 2. 标题核心关键词 (30分)
    const highPriorityKeywords = ['黄金', '金价', '贵金属', 'xauusd', '现货金', '伦敦金', '美元金'];
    if (highPriorityKeywords.some(kw => title.includes(kw))) {
      score += 0.30;
    }
    
    // 3. 相关市场因素 (20分)
    const marketFactors = ['白银', '金银', '避险', '通胀', '美联储', '央行', '黄金储备', 
                          '金市', '黄金市场', '金矿', '黄金etf'];
    if (marketFactors.some(kw => title.includes(kw) || content.includes(kw))) {
      score += 0.20;
    }
    
    // 4. 通用财经关键词 (10分)
    const generalKeywords = ['美元', '利率', '通胀', '经济', '投资', '市场', '交易'];
    if (generalKeywords.some(kw => title.includes(kw) || content.includes(kw))) {
      score += 0.10;
    }
    
    return Math.min(score, 1.0);
  }

  /**
   * 去重新闻（按URL）
   */
  private deduplicateNews(newsItems: NewsItem[]): NewsItem[] {
    const seen = new Map<string, NewsItem>();
    
    newsItems.forEach(item => {
      const key = item.url || item.title;
      if (!seen.has(key)) {
        seen.set(key, item);
      }
    });
    
    return Array.from(seen.values());
  }

  /**
   * 使用Finnhub获取纳斯达克新闻（通过代理）
   */
  private async fetchFinnhubNews(limit: number = 50): Promise<NewsItem[]> {
    try {
      console.log('📡 调用Finnhub News Proxy');
      
      // 纳斯达克100主要成分股
      const tickers = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'META', 'NFLX', 'AMD', 'INTC'];
      
      // 获取最近7天的新闻
      const toDate = new Date();
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - 7);
      
      const formatDate = (date: Date) => date.toISOString().split('T')[0];
      
      // 并发获取多个股票的新闻
      const allNews: any[] = [];
      
      // 每次获取2个股票的新闻，避免超过速率限制
      for (let i = 0; i < Math.min(tickers.length, 4); i += 2) {
        const batch = tickers.slice(i, i + 2);
        
        const batchPromises = batch.map(ticker =>
          axios.get('/.netlify/functions/finnhub-news-proxy', {
            params: {
              symbol: ticker,
              from: formatDate(fromDate),
              to: formatDate(toDate)
            },
            timeout: this.config.timeout
          }).catch(err => {
            console.warn(`⚠️ 获取${ticker}新闻失败`, err.message);
            return { data: { articles: [] } };
          })
        );
        
        const batchResults = await Promise.all(batchPromises);
        batchResults.forEach(response => {
          if (response.data?.articles && Array.isArray(response.data.articles)) {
            allNews.push(...response.data.articles);
          }
        });
        
        // 避免速率限制，批次间延迟
        if (i + 2 < tickers.length) {
          await this.sleep(1000);
        }
      }

      console.log('📡 Finnhub响应', { totalNews: allNews.length });

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
        // 使用 URL 生成稳定的 ID（不使用时间戳）
        const stableId = article.url 
          ? `finnhub_news_${this.hashString(article.url)}`
          : `finnhub_news_${this.hashString(article.headline || 'untitled')}_${index}`;
        
        return {
          id: stableId,
          title: article.headline || 'Untitled',
          content: article.summary || article.headline || '',
          source: article.source || 'Finnhub',
          publishedAt: new Date(article.datetime * 1000),
          url: article.url || '#',
          relevanceScore: 0.8,
          image: article.image || undefined
        };
      });

      console.log('✅ Finnhub新闻转换完成', { count: newsItems.length });
      
      return newsItems;
      
    } catch (error) {
      console.error('❌ Finnhub Proxy调用失败', error);
      throw error;
    }
  }

  /**
   * 使用Finnhub获取黄金新闻（通过代理）
   */
  private async fetchFinnhubGoldNews(limit: number = 50): Promise<NewsItem[]> {
    try {
      console.log('📡 调用Finnhub News Proxy获取黄金新闻');
      
      // 黄金相关的股票代码
      const goldTickers = ['GLD', 'GOLD', 'NEM', 'RGLD', 'FNV', 'WPM'];
      
      const batchPromises = goldTickers.map(ticker =>
        axios.get('/.netlify/functions/finnhub-news-proxy', {
          params: {
            symbol: ticker,
            from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            to: new Date().toISOString().split('T')[0]
          },
          timeout: this.config.timeout
        }).catch(error => {
          console.warn(`⚠️ 获取${ticker}新闻失败:`, error.message);
          return { data: [] };
        })
      );

      const responses = await Promise.all(batchPromises);
      const allNews = responses.flatMap(response => response.data || []);

      console.log('📡 Finnhub响应', { totalNews: allNews.length });

      if (allNews.length === 0) {
        throw new Error('Finnhub未返回黄金新闻数据');
      }

      // 去重（按URL）
      const uniqueNews = Array.from(
        new Map(allNews.map((item: any) => [item.url, item])).values()
      );

      // 按时间排序，取最新的
      const sortedNews = uniqueNews
        .sort((a: any, b: any) => b.datetime - a.datetime)
        .slice(0, limit);

      const newsItems = sortedNews.map((article: any, index: number) => {
        // 使用 URL 生成稳定的 ID（不使用时间戳）
        const stableId = article.url 
          ? `finnhub_gold_${this.hashString(article.url)}`
          : `finnhub_gold_${this.hashString(article.headline || 'untitled')}_${index}`;
        
        return {
          id: stableId,
          title: article.headline || 'Untitled',
          content: article.summary || article.headline || '',
          source: article.source || 'Finnhub',
          publishedAt: new Date(article.datetime * 1000),
          url: article.url || '#',
          relevanceScore: 0.8,
          image: article.image || undefined
        };
      });

      console.log('✅ Finnhub黄金新闻转换完成', { count: newsItems.length });
      
      return newsItems;
      
    } catch (error) {
      console.error('❌ Finnhub Gold Proxy调用失败', error);
      throw error;
    }
  }

  /**
   * 批量翻译新闻（使用Gemini AI - 一次性翻译所有新闻）
   */
  private async translateNewsItems(newsItems: NewsItem[]): Promise<NewsItem[]> {
    try {
      console.log(`🌐 批量翻译${newsItems.length}条新闻（1次API调用）`);
      
      // 构建批量翻译请求
      const newsTexts = newsItems.map((item, index) => 
        `[新闻${index}]\n标题: ${item.title}\n内容: ${item.content.substring(0, 300)}`
      ).join('\n\n---\n\n');
      
      const prompt = `请将以下${newsItems.length}条英文新闻翻译成中文。为每条新闻返回翻译后的标题和内容。直接返回JSON格式（不要markdown代码块）：

${newsTexts}

返回格式：
{
  "translations": [
    {
      "newsIndex": 0,
      "title": "翻译后的标题",
      "content": "翻译后的内容"
    },
    {
      "newsIndex": 1,
      "title": "翻译后的标题",
      "content": "翻译后的内容"
    }
  ]
}`;

      const responseText = await callGeminiWithFallback(
        config.apiKeys.gemini,
        prompt,
        0.3,
        8192,  // 最大输出 tokens，用于翻译 50 条新闻
        90000  // 90秒超时
      );
      
      if (!responseText) {
        throw new Error('翻译响应为空');
      }

      // 解析JSON响应
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('无法从响应中提取JSON');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      if (!parsed.translations || !Array.isArray(parsed.translations)) {
        throw new Error('翻译响应格式错误');
      }

      // 应用翻译结果
      const translatedItems = newsItems.map((item, index) => {
        const translation = parsed.translations.find((t: unknown) => t.newsIndex === index);
        
        if (translation && translation.title && translation.content) {
          return {
            ...item,
            title: translation.title,
            content: translation.content
          };
        }
        
        // 如果翻译失败，保留原文
        return item;
      });

      const successCount = translatedItems.filter((item, index) => 
        item.title !== newsItems[index].title
      ).length;

      console.log(`✅ 批量翻译完成：${successCount}/${newsItems.length}条成功`);
      
      return translatedItems;
      
    } catch (error) {
      console.error('批量翻译失败，返回原文', error);
      return newsItems;
    }
  }

  /**
   * 使用新浪财经获取新闻（黄金等）
   */
  private async fetchSinaNews(assetType: AssetType, limit: number): Promise<NewsItem[]> {
    console.log('🚀 服务器环境：开始获取真实新闻数据', { assetType, limit });
    logInfo('开始获取新闻数据', { assetType, limit });
    
    const query = this.buildSearchQuery(assetType);
    
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
      nasdaq: 'NASDAQ OR "tech stocks" OR "technology stocks" OR AAPL OR MSFT OR GOOGL OR AMZN OR TSLA OR NVDA',
      astock: 'A股 OR 上证指数 OR 深证成指 OR 沪指 OR 深指 OR 创业板 OR 科创板'
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

          // 使用 URL 或标题生成稳定的 ID（不使用时间戳）
          const stableId = article.url 
            ? `news_${this.hashString(article.url)}`
            : `news_${this.hashString(article.title)}_${index}`;
          
          const newsItem = {
            id: stableId,
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
    const keywords = this.getAssetKeywords(assetType);
    
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
      
    } else if (assetType === 'astock') {
      // A股：URL过滤 (/stock/ 且排除 /usstock 和 /hkstock)
      const stockNews = newsItems.filter(item => 
        item.url && 
        item.url.startsWith('https://finance.sina.com.cn/stock/') &&
        !item.url.includes('/usstock') &&
        !item.url.includes('/hkstock')
      );
      
      console.log(`   URL过滤(/stock/排除美股港股): ${stockNews.length}条`);
      
      // 如果URL过滤结果足够，直接返回
      if (stockNews.length >= 50) {
        console.log(`   ✅ URL过滤已足够，返回前50条`);
        return stockNews.slice(0, 50);
      }
      
      // 否则补充关键词过滤
      const keywords = this.getAssetKeywords(assetType);
      const keywordFiltered = newsItems.filter(item => {
        // 已经在URL过滤中的，跳过
        if (stockNews.find(u => u.url === item.url)) return false;
        
        const content = (item.title + ' ' + item.content).toLowerCase();
        return keywords.some(keyword => content.includes(keyword.toLowerCase()));
      });
      
      console.log(`   关键词补充: ${keywordFiltered.length}条`);
      
      const result = [...stockNews, ...keywordFiltered].slice(0, 50);
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
      ],
      astock: [
        // 核心关键词
        'A股', 'a股', '沪指', '深指', '上证', '深证',
        '上证指数', '深证成指', '创业板', '科创板',
        // 市场相关
        '股市', '股票', '股价', '大盘', '指数',
        '涨跌', '行情', '交易', '成交',
        // 监管和政策
        '证监会', '交易所', '上交所', '深交所',
        '政策', '监管', '改革', '开放',
        // 行业板块
        '白酒', '新能源', '半导体', '医药', '地产',
        '银行', '保险', '券商', '基金',
        // 投资相关
        '北向资金', '外资', '机构', '散户',
        '涨停', '跌停', '停牌', '复牌'
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

  /**
   * 工具方法：生成字符串的简单哈希值（用于生成稳定的 ID）
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }
}

/**
 * 默认新闻服务实例
 */
export const newsService = new NewsService();