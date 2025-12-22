/**
 * NewsAnalyzer组件 - 新闻分析处理逻辑
 * 负责获取新闻数据并进行AI分析
 */

import React, { useState, useCallback, useEffect } from 'react';
import { NewsAnalyzerProps, NewsItem, NewsAnalysis } from '../types';
import { useNews, useAnalysis, usePriceData, useLoading, useErrors } from '../utils/context';
import { newsService, analysisService, priceService } from '../services';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';
import { DemoDataNotice } from './DemoDataNotice';

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

  /**
   * 获取新闻数据
   */
  const fetchNews = useCallback(async () => {
    try {
      clearError('news');
      setLoading({ news: true });
      
      const newsData = await newsService.fetchMarketNews(assetType, 10);
      setNews(newsData);
      setLastFetchTime(new Date());
      
      return newsData;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取新闻失败';
      setError('news', errorMessage);
      throw error;
    } finally {
      setLoading({ news: false });
    }
  }, [assetType, setNews, setLoading, setError, clearError]);

  /**
   * 获取价格数据（5天历史数据，排除周末）
   */
  const fetchPriceData = useCallback(async () => {
    try {
      clearError('prices');
      setLoading({ prices: true });
      
      // 根据资产类型确定符号
      const symbol = assetType === 'nasdaq' ? 'nasdaq' : 'gold'; // nasdaq使用Yahoo Finance获取指数数据，gold使用演示数据
      
      // 获取5天价格历史数据
      const priceHistory = await priceService.fetchFiveDayPriceHistory(symbol);
      
      // 过滤掉周末数据（周六=6，周日=0）
      const weekdayData = priceHistory.filter(data => {
        const dayOfWeek = data.date.getDay();
        return dayOfWeek !== 0 && dayOfWeek !== 6; // 排除周日和周六
      });
      
      // 确保我们有5个工作日的数据，如果不够就获取更多
      if (weekdayData.length < 5) {
        // 获取更多天数的数据
        const extendedHistory = await priceService.fetchPriceHistory(symbol, 10);
        const extendedWeekdayData = extendedHistory.filter(data => {
          const dayOfWeek = data.date.getDay();
          return dayOfWeek !== 0 && dayOfWeek !== 6;
        });
        
        // 取最近的5个工作日
        const recentFiveDays = extendedWeekdayData.slice(-5);
        setPriceData(recentFiveDays);
      } else {
        // 取最近的5个工作日
        const recentFiveDays = weekdayData.slice(-5);
        setPriceData(recentFiveDays);
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取价格数据失败';
      setError('prices', errorMessage);
      console.error('获取价格数据失败:', error);
    } finally {
      setLoading({ prices: false });
    }
  }, [assetType, setPriceData, setLoading, setError, clearError]);

  /**
   * 分析新闻影响
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
      
      // 并行分析所有新闻
      const analysisPromises = newsItems.map(async (newsItem) => {
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

      const results = await Promise.all(analysisPromises);
      analysisResults.push(...results);

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
   * 获取并分析新闻，同时获取价格数据
   */
  const fetchAndAnalyze = useCallback(async () => {
    try {
      // 并行获取新闻和价格数据
      const [newsData] = await Promise.all([
        fetchNews(),
        fetchPriceData()
      ]);
      
      // 分析新闻
      await analyzeNews(newsData);
    } catch (error) {
      console.error('获取和分析数据失败:', error);
    }
  }, [fetchNews, fetchPriceData, analyzeNews]);

  /**
   * 重新分析现有新闻
   */
  const reanalyzeNews = useCallback(async () => {
    if (news && news.length > 0) {
      await analyzeNews(news);
    }
  }, [news, analyzeNews]);

  /**
   * 组件挂载时自动获取新闻和价格数据
   */
  useEffect(() => {
    if (news.length === 0 || priceData.length === 0) {
      fetchAndAnalyze();
    }
  }, [assetType, fetchAndAnalyze, news.length, priceData.length]); // 只在资产类型变化时重新获取

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
      {/* 演示数据提示 - 只在本地开发环境显示 */}
      {typeof window !== 'undefined' && (
        window.location.hostname === 'localhost' || 
        window.location.hostname === '127.0.0.1' ||
        window.location.port === '3001'
      ) && (
        <DemoDataNotice />
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
            <button
              onClick={fetchAndAnalyze}
              disabled={loading.news || isAnalyzing}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading.news ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  获取中...
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
            
            {news.length > 0 && (
              <button
                onClick={reanalyzeNews}
                disabled={isAnalyzing}
                className="inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAnalyzing ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    分析中...
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

      {/* 错误信息 */}
      {errors.news && (
        <ErrorMessage 
          message={errors.news} 
          onRetry={fetchNews}
          onDismiss={() => clearError('news')}
        />
      )}
      
      {errors.analysis && (
        <ErrorMessage 
          message={errors.analysis} 
          onRetry={reanalyzeNews}
          onDismiss={() => clearError('analysis')}
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