/**
 * 纳斯达克100分析页面
 * 显示纳斯达克100相关的新闻分析和价格趋势
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { NewsAnalyzer } from '../components/NewsAnalyzer';
import { TrendChart } from '../components/TrendChart';
import { NewsList } from '../components/NewsList';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { OverallAnalysisCard } from '../components/OverallAnalysisCard';
import { ThemeToggle } from '../components/ThemeToggle';
import { SentimentIndex } from '../components/SentimentIndex';
import { useCurrentAsset, useNews, useAnalysis, useOverallAnalysis, usePriceData, useLoading, useErrors } from '../utils/context';
import { formatUpdateTime, formatExpirationWarning, isDataExpired } from '../utils/helpers';

/**
 * 纳斯达克100分析页面Props
 */
interface NasdaqAnalysisPageProps {}

/**
 * 纳斯达克100分析页面组件
 */
export const NasdaqAnalysisPage: React.FC<NasdaqAnalysisPageProps> = () => {
  const { setCurrentAsset } = useCurrentAsset();
  const { news, loading: newsLoading, error: newsError } = useNews('nasdaq');
  const { analysis, loading: analysisLoading, error: analysisError } = useAnalysis('nasdaq');
  const { overallAnalysis } = useOverallAnalysis('nasdaq');
  const { priceData, loading: pricesLoading, error: pricesError } = usePriceData('nasdaq');
  const { loading } = useLoading();
  const { errors } = useErrors();
  
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshNewsOnly, setRefreshNewsOnly] = useState(false);
  const [refreshingPrice, setRefreshingPrice] = useState(false);

  // 设置当前资产类型
  useEffect(() => {
    setCurrentAsset('nasdaq');
  }, [setCurrentAsset]);

  // 刷新价格数据
  const handleRefreshPrice = async () => {
    setRefreshingPrice(true);
    try {
      // 清除价格缓存并重新加载
      const { clearPriceCache } = await import('../hooks/usePriceDataWithConversion');
      clearPriceCache();
      
      // 触发重新获取价格数据
      window.location.reload();
    } catch (error) {
      console.error('刷新价格失败:', error);
    } finally {
      setRefreshingPrice(false);
    }
  };

  // 只刷新新闻（不触发 AI 分析）
  const handleRefreshNewsOnly = async () => {
    setIsRefreshing(true);
    setRefreshNewsOnly(true);
    try {
      setLastUpdated(new Date());
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
        setRefreshNewsOnly(false);
      }, 500);
    }
  };

  // 刷新数据并重新分析
  const handleRefresh = async () => {
    setIsRefreshing(true);
    setRefreshNewsOnly(false);
    try {
      // 这里会触发NewsAnalyzer组件重新获取数据并分析
      setLastUpdated(new Date());
    } finally {
      setIsRefreshing(false);
    }
  };

  // 检查是否有任何加载状态
  const hasAnyLoading = newsLoading || analysisLoading || pricesLoading || 
                       loading.news || loading.analysis || loading.prices;

  // 检查是否有任何错误
  const hasAnyError = newsError || analysisError || pricesError || 
                     errors.news || errors.analysis || errors.prices;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* 装饰性背景 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/20 dark:bg-blue-600/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-400/20 dark:bg-purple-600/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-indigo-400/10 dark:bg-indigo-600/5 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="relative bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl shadow-lg border-b border-white/20 dark:border-gray-700/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link
                to="/"
                className="flex items-center text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                返回首页
              </Link>
              <div className="ml-6 h-6 border-l border-gray-300/50 dark:border-gray-600/50" />
              <h1 className="ml-6 text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
                <span className="inline-block w-3 h-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full mr-3 shadow-lg"></span>
                纳斯达克100分析
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                {formatUpdateTime(lastUpdated)}
              </div>
              {isDataExpired(lastUpdated, 30) && (
                <div className="text-sm text-amber-700 dark:text-amber-400 bg-amber-100/80 dark:bg-amber-900/30 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                  {formatExpirationWarning(lastUpdated, 30)}
                </div>
              )}
              <div className="relative z-[9998]">
                <ThemeToggle />
              </div>
              <button
                onClick={handleRefreshNewsOnly}
                disabled={isRefreshing || hasAnyLoading}
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/40 dark:border-gray-700/40 rounded-lg hover:bg-white/80 dark:hover:bg-gray-800/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-green-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                title="只刷新新闻，不进行 AI 分析"
              >
                <svg className={`h-4 w-4 mr-2 ${isRefreshing && refreshNewsOnly ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {isRefreshing && refreshNewsOnly ? '刷新中...' : '刷新新闻'}
              </button>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing || hasAnyLoading}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-500 backdrop-blur-sm border border-blue-700 dark:border-blue-600 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                title="刷新新闻并重新进行 AI 分析"
              >
                <svg className={`h-4 w-4 mr-2 ${isRefreshing && !refreshNewsOnly ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {isRefreshing && !refreshNewsOnly ? '分析中...' : '分析新闻'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 全局错误显示 */}
        {hasAnyError && (
          <div className="mb-6">
            <ErrorMessage
              title="数据加载出现问题"
              message="部分数据可能无法正常显示，请尝试刷新页面"
              onRetry={handleRefresh}
            />
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 lg:gap-8">
          {/* 左侧：新闻分析 */}
          <div className="xl:col-span-3 space-y-6">
            {/* 新闻分析器 */}
            <div className="bg-white/40 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20">
              <div className="px-6 py-4 border-b border-white/20">
                <h2 className="text-lg font-semibold text-gray-900">
                  新闻影响分析
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  AI分析纳斯达克100相关新闻的潜在影响
                </p>
              </div>
              <div className="p-6">
                <NewsAnalyzer 
                  assetType="nasdaq"
                  onAnalysisComplete={() => setLastUpdated(new Date())}
                  skipAnalysis={refreshNewsOnly}
                />
              </div>
            </div>

            {/* 整体市场分析 */}
            {overallAnalysis && (
              <OverallAnalysisCard 
                analysis={overallAnalysis}
                loading={analysisLoading || loading.analysis}
              />
            )}

            {/* 新闻列表 */}
            <div className="bg-white/40 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20">
              <div className="px-6 py-4 border-b border-white/20">
                <h2 className="text-lg font-semibold text-gray-900">
                  相关新闻
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  影响纳斯达克100的重要新闻动态
                </p>
              </div>
              <div className="p-6">
                {newsLoading || loading.news ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner size="md" />
                  </div>
                ) : (
                  <NewsList
                    news={news}
                    analysis={analysis}
                    loading={newsLoading || loading.news}
                  />
                )}
              </div>
            </div>
          </div>

          {/* 右侧：价格趋势 */}
          <div className="xl:col-span-2 space-y-6">
            {/* 价格趋势图表 */}
            <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/20">
              <div className="px-6 py-4 border-b border-white/20 dark:border-gray-700/20">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      价格趋势
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      过去5天的纳斯达克100走势
                    </p>
                  </div>
                  <button
                    onClick={handleRefreshPrice}
                    disabled={refreshingPrice}
                    className="flex items-center space-x-1 px-3 py-1.5 text-xs text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/40 transition-colors disabled:opacity-50"
                    title="刷新纳斯达克价格"
                  >
                    <svg className={`h-3.5 w-3.5 ${refreshingPrice ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>{refreshingPrice ? '刷新中' : '刷新价格'}</span>
                  </button>
                </div>
              </div>
              <div className="p-6">
                {pricesLoading || loading.prices ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner size="md" />
                  </div>
                ) : priceData.length > 0 ? (
                  <TrendChart
                    data={priceData}
                    assetType="nasdaq"
                    timeRange={5}
                  />
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    暂无价格数据
                  </div>
                )}
              </div>
            </div>

            {/* 情绪指数 */}
            {analysis.length > 0 && (
              <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/20">
                <div className="px-6 py-4 border-b border-white/20 dark:border-gray-700/20">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    市场情绪指数
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    基于AI分析的市场情绪量化指标
                  </p>
                </div>
                <div className="p-6">
                  <SentimentIndex 
                    analyses={analysis} 
                    assetType="nasdaq"
                    autoSave={true}
                  />
                </div>
              </div>
            )}

            {/* 市场概览 */}
            <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/20">
              <div className="px-6 py-4 border-b border-white/20 dark:border-gray-700/20">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  市场概览
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-white/30 dark:bg-gray-700/30 backdrop-blur-sm rounded-xl">
                    <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">当前指数</span>
                    <span className="font-bold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                      {priceData.length > 0 ? `${priceData[priceData.length - 1]?.close.toLocaleString('en-US', { maximumFractionDigits: 2 })}` : '--'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/30 dark:bg-gray-700/30 backdrop-blur-sm rounded-xl">
                    <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">24小时变化</span>
                    <span className={`font-bold ${
                      priceData.length > 0 && priceData[priceData.length - 1]?.changePercent >= 0 
                        ? 'text-red-600 dark:text-red-400' 
                        : 'text-green-600 dark:text-green-400'
                    }`}>
                      {priceData.length > 0 ? `${priceData[priceData.length - 1]?.changePercent >= 0 ? '+' : ''}${priceData[priceData.length - 1]?.changePercent.toFixed(2)}%` : '--'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/30 dark:bg-gray-700/30 backdrop-blur-sm rounded-xl">
                    <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">相关新闻</span>
                    <span className="font-bold text-gray-900 dark:text-gray-100">
                      {news.length} 条
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/30 dark:bg-gray-700/30 backdrop-blur-sm rounded-xl">
                    <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">分析报告</span>
                    <span className="font-bold text-gray-900 dark:text-gray-100">
                      {analysis.length} 份
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 技术指标 */}
            <div className="bg-white/40 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20">
              <div className="px-6 py-4 border-b border-white/20">
                <h2 className="text-lg font-semibold text-gray-900">
                  技术指标
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-white/30 backdrop-blur-sm rounded-xl">
                    <span className="text-sm text-gray-700 font-medium">5日最高</span>
                    <span className="font-bold text-gray-900">
                      {priceData.length > 0 ? Math.max(...priceData.map(d => d.high)).toFixed(2) : '--'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/30 backdrop-blur-sm rounded-xl">
                    <span className="text-sm text-gray-700 font-medium">5日最低</span>
                    <span className="font-bold text-gray-900">
                      {priceData.length > 0 ? Math.min(...priceData.map(d => d.low)).toFixed(2) : '--'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/30 backdrop-blur-sm rounded-xl">
                    <span className="text-sm text-gray-700 font-medium">平均成交量</span>
                    <span className="font-bold text-gray-900">
                      {priceData.length > 0 && priceData.some(d => d.volume) 
                        ? (priceData.reduce((sum, d) => sum + (d.volume || 0), 0) / priceData.length).toFixed(0)
                        : '--'
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 快速导航 */}
            <div className="bg-white/40 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20">
              <div className="px-6 py-4 border-b border-white/20">
                <h2 className="text-lg font-semibold text-gray-900">
                  快速导航
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  <Link
                    to="/gold"
                    className="block w-full text-left px-4 py-3 text-sm font-medium text-yellow-700 bg-yellow-100/60 backdrop-blur-sm rounded-xl hover:bg-yellow-100/80 transition-all shadow-lg"
                  >
                    切换到现货黄金分析
                  </Link>
                  <Link
                    to="/"
                    className="block w-full text-left px-4 py-3 text-sm font-medium text-gray-700 bg-white/50 backdrop-blur-sm rounded-xl hover:bg-white/70 transition-all shadow-lg"
                  >
                    返回首页
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default NasdaqAnalysisPage;