/**
 * NewsAnalyzer组件 - 新闻分析处理逻辑
 * 负责获取新闻数据并进行AI分析
 */

import React, { useState, useCallback, useEffect } from 'react';
import { NewsAnalyzerProps, NewsItem, NewsAnalysis } from '../types';
import { useNews, useAnalysis, usePriceData, useLoading, useErrors } from '../utils/context';
import { newsService, analysisService, priceService } from '../services';
import { LoadingSpinner } from './LoadingSpinner';
import { DataFetchError } from './DemoDataNotice';
import { RetryHandler, RetryButton } from './RetryHandler';
import { ProgressiveFallback, createStandardFallbackLevels } from './ProgressiveFallback';

/**
 * 新闻分析器组件
 */
export const NewsAnalyzer: React.FC<NewsAnalyzerProps> = ({ 
  assetType, 
  onAnalysisComplete 
}) => {
  const { news, setNews } = useNews(assetType);
  const { analysis, setAnalysis } = useAnalysis(assetType);
  const { priceData, setPriceData } = usePriceData(assetType);
  const { loading, setLoading } = useLoading();
  const { errors, setError, clearError } = useErrors();
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showFallbackOptions, setShowFallbackOptions] = useState(false);
  const [usingFallbackData, setUsingFallbackData] = useState(false);

  /**
   * 获取新闻数据（带重试机制）
   */
  const fetchNews = useCallback(async (): Promise<boolean> => {
    try {
      clearError('news');
      setLoading({ news: true });
      setUsingFallbackData(false);
      
      const newsData = await newsService.fetchMarketNews(assetType, 10);
      setNews(newsData);
      setLastFetchTime(new Date());
      
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取新闻失败';
      setError('news', errorMessage);
      return false;
    } finally {
      setLoading({ news: false });
    }
  }, [assetType, setNews, setLoading, setError, clearError]);

  /**
   * 使用演示数据作为降级方案
   */
  const useFallbackNews = useCallback(async (): Promise<boolean> => {
    try {
      clearError('news');
      setLoading({ news: true });
      
      const { generateDemoNews } = await import('../services/demoDataService');
      const demoNews = generateDemoNews(assetType, 10);
      setNews(demoNews);
      setLastFetchTime(new Date());
      setUsingFallbackData(true);
      
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '加载演示数据失败';
      setError('news', errorMessage);
      return false;
    } finally {
      setLoading({ news: false });
    }
  }, [assetType, setNews, setLoading, setError, clearError]);

  /**
   * 获取价格数据（带重试机制）
   */
  const fetchPriceData = useCallback(async (): Promise<boolean> => {
    try {
      clearError('prices');
      setLoading({ prices: true });
      
      // 根据资产类型确定符号
      const symbol = assetType === 'nasdaq' ? 'nasdaq' : 'gold';
      
      // 获取5天价格历史数据（API 会自动过滤周末并返回5个工作日）
      const priceHistory = await priceService.fetchFiveDayPriceHistory(symbol);
      
      // 设置价格数据
      setPriceData(priceHistory);
      
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取价格数据失败';
      setError('prices', errorMessage);
      console.error('获取价格数据失败:', error);
      return false;
    } finally {
      setLoading({ prices: false });
    }
  }, [assetType, setPriceData, setLoading, setError, clearError]);

  /**
   * 分析新闻影响（带并发控制）
   */
  const analyzeNews = useCallback(async (newsItems: NewsItem[]) => {
    if (!newsItems || newsItems.length === 0) {
      return [];
    }

    try {
      clearError('analysis');
      setIsAnalyzing(true);
      setLoading({ analysis: true });

      const analysisResults: NewsAnalysis[] = [];
      
      // 并发控制：每次最多分析 5 条新闻（避免超出 Gemini API 限制）
      const BATCH_SIZE = 5;
      const DELAY_BETWEEN_BATCHES = 1000; // 批次之间延迟 1 秒
      
      for (let i = 0; i < newsItems.length; i += BATCH_SIZE) {
        const batch = newsItems.slice(i, i + BATCH_SIZE);
        
        const batchPromises = batch.map(async (newsItem) => {
          try {
            const result = await analysisService.analyzeNewsImpact(
              newsItem.content, 
              assetType
            );
            
            return {
              newsId: newsItem.id,
              impact: result.impact,
              confidence: result.confidence,
              summary: result.summary,
              keyPoints: result.keyPoints,
              predictedChange: result.predictedChange,
              timeframe: 'short' as const
            };
          } catch (error) {
            console.warn(`分析新闻 ${newsItem.id} 失败:`, error);
            // 返回默认分析结果
            return {
              newsId: newsItem.id,
              impact: 'neutral' as const,
              confidence: 0,
              summary: '分析失败',
              keyPoints: [],
              predictedChange: 0,
              timeframe: 'short' as const
            };
          }
        });
        
        const batchResults = await Promise.all(batchPromises);
        analysisResults.push(...batchResults);
        
        // 如果还有更多批次，等待一段时间再继续
        if (i + BATCH_SIZE < newsItems.length) {
          await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
        }
      }

      // 按影响程度排序（置信度 * 预测变化的绝对值）
      analysisResults.sort((a, b) => {
        const scoreA = a.confidence * Math.abs(a.predictedChange);
        const scoreB = b.confidence * Math.abs(b.predictedChange);
        return scoreB - scoreA;
      });

      setAnalysis(analysisResults);
      onAnalysisComplete?.(analysisResults);
      
      return analysisResults;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '分析新闻失败';
      setError('analysis', errorMessage);
      throw error;
    } finally {
      setIsAnalyzing(false);
      setLoading({ analysis: false });
    }
  }, [assetType, setAnalysis, setLoading, setError, clearError, onAnalysisComplete]);

  /**
   * 获取并分析新闻，同时获取价格数据（带重试机制）
   */
  const fetchAndAnalyze = useCallback(async (): Promise<boolean> => {
    try {
      // 并行获取新闻和价格数据
      const [newsSuccess, priceSuccess] = await Promise.all([
        fetchNews(),
        fetchPriceData()
      ]);
      
      // 如果新闻获取成功，进行分析
      if (newsSuccess && news.length > 0) {
        await analyzeNews(news);
      }
      
      return newsSuccess || priceSuccess; // 至少一个成功就算成功
    } catch (error) {
      console.error('获取和分析数据失败:', error);
      return false;
    }
  }, [fetchNews, fetchPriceData, analyzeNews, news]);

  /**
   * 重新分析现有新闻（带重试机制）
   */
  const reanalyzeNews = useCallback(async (): Promise<boolean> => {
    if (news && news.length > 0) {
      try {
        await analyzeNews(news);
        return true;
      } catch (error) {
        console.error('重新分析新闻失败:', error);
        return false;
      }
    }
    return false;
  }, [news, analyzeNews]);

  /**
   * 组件挂载时自动获取新闻和价格数据
   */
  useEffect(() => {
    if (!isInitialized && (news.length === 0 || priceData.length === 0)) {
      setIsInitialized(true);
      fetchAndAnalyze();
    }
  }, [assetType, fetchAndAnalyze, isInitialized, news.length, priceData.length]); // 只在资产类型变化时重新获取，移除其他依赖避免死循环

  // 当资产类型变化时重置初始化状态
  useEffect(() => {
    setIsInitialized(false);
  }, [assetType]);

  /**
   * 检查数据是否过期（超过30分钟）
   */
  const isDataStale = useCallback(() => {
    if (!lastFetchTime) return true;
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    return lastFetchTime < thirtyMinutesAgo;
  }, [lastFetchTime]);

  return (
    <div className="space-y-4">
      {/* 数据获取失败时的渐进式降级 */}
      {errors.news && !loading.news && news.length === 0 && (
        <ProgressiveFallback
          dataType="news"
          fallbackLevels={createStandardFallbackLevels(
            'news',
            fetchNews,
            undefined,
            useFallbackNews
          )}
          onSuccess={(level) => {
            console.log(`数据获取成功，使用策略: ${level.name}`);
            setShowFallbackOptions(false);
          }}
          onAllFailed={() => {
            console.log('所有数据获取策略都失败了');
            setShowFallbackOptions(true);
          }}
        />
      )}

      {/* 使用降级数据的提示 */}
      {usingFallbackData && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-yellow-800">
                当前使用演示数据
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>由于无法获取实时新闻数据，当前显示的是演示数据用于功能展示。</p>
                <div className="mt-2">
                  <RetryButton
                    onRetry={fetchNews}
                    size="sm"
                    className="mr-2"
                  />
                  <button
                    onClick={() => setUsingFallbackData(false)}
                    className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors"
                  >
                    隐藏提示
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 控制面板 */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-semibold text-slate-900">
              新闻分析
            </h3>
            {lastFetchTime && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-slate-500">
                  更新时间: {lastFetchTime.toLocaleTimeString('zh-CN')}
                </span>
                {isDataStale() && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    数据可能过期
                  </span>
                )}
              </div>
            )}
          </div>
          
          <div className="flex space-x-2">
            <RetryHandler onRetry={fetchAndAnalyze}>
              {({ isRetrying, canRetry, retry, attempt, maxAttempts }) => (
                <button
                  onClick={retry}
                  disabled={loading.news || isAnalyzing || isRetrying || !canRetry}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading.news || isRetrying ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      {isRetrying ? `重试中... (${attempt}/${maxAttempts})` : '获取中...'}
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      刷新新闻
                    </>
                  )}
                </button>
              )}
            </RetryHandler>
            
            {news.length > 0 && (
              <RetryHandler onRetry={reanalyzeNews}>
                {({ isRetrying, canRetry, retry, attempt, maxAttempts }) => (
                  <button
                    onClick={retry}
                    disabled={isAnalyzing || isRetrying || !canRetry}
                    className="inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAnalyzing || isRetrying ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        {isRetrying ? `重新分析中... (${attempt}/${maxAttempts})` : '分析中...'}
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        重新分析
                      </>
                    )}
                  </button>
                )}
              </RetryHandler>
            )}
          </div>
        </div>

        {/* 统计信息 */}
        {news.length > 0 && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-900">{news.length}</p>
              <p className="text-sm text-slate-500">新闻条数</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-900">{analysis.length}</p>
              <p className="text-sm text-slate-500">已分析</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {analysis.filter(a => a.impact === 'positive').length}
              </p>
              <p className="text-sm text-slate-500">利好</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">
                {analysis.filter(a => a.impact === 'negative').length}
              </p>
              <p className="text-sm text-slate-500">利空</p>
            </div>
          </div>
        )}
      </div>

      {/* 改进的错误信息显示 */}
      {errors.news && !showFallbackOptions && (
        <DataFetchError
          dataType="news"
          error={errors.news}
          onRetry={fetchNews}
          onDismiss={() => clearError('news')}
          showFallbackOption={true}
          onUseFallback={useFallbackNews}
        />
      )}
      
      {errors.analysis && (
        <DataFetchError
          dataType="analysis"
          error={errors.analysis}
          onRetry={reanalyzeNews}
          onDismiss={() => clearError('analysis')}
        />
      )}

      {errors.prices && (
        <DataFetchError
          dataType="price"
          error={errors.prices}
          onRetry={fetchPriceData}
          onDismiss={() => clearError('prices')}
        />
      )}

      {/* 加载状态 */}
      {(loading.news || loading.analysis) && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8">
          <div className="text-center">
            <LoadingSpinner size="lg" className="mx-auto mb-4" />
            <p className="text-slate-600">
              {loading.news ? '正在获取新闻...' : '正在分析新闻影响...'}
            </p>
          </div>
        </div>
      )}

      {/* 空状态 */}
      {!loading.news && !loading.analysis && news.length === 0 && !errors.news && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8">
          <div className="text-center">
            <div className="text-slate-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">暂无新闻数据</h3>
            <p className="text-slate-500 mb-4">点击&quot;刷新新闻&quot;按钮获取最新的市场新闻</p>
            <button
              onClick={fetchAndAnalyze}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              获取新闻
            </button>
          </div>
        </div>
      )}
    </div>
  );
};