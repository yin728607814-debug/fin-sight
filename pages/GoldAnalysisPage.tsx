/**
 * 现货黄金分析页面
 * 显示黄金相关的新闻分析和价格趋势
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
import { AssetType } from '../types';

/**
 * 现货黄金分析页面Props
 */
interface GoldAnalysisPageProps {}

/**
 * 现货黄金分析页面组件
 */
export const GoldAnalysisPage: React.FC<GoldAnalysisPageProps> = () => {
  const { setCurrentAsset } = useCurrentAsset();
  const { news, loading: newsLoading, error: newsError } = useNews('gold');
  const { analysis, loading: analysisLoading, error: analysisError } = useAnalysis('gold');
  const { overallAnalysis } = useOverallAnalysis('gold');
  const { priceData, loading: pricesLoading, error: pricesError } = usePriceData('gold');
  const { loading } = useLoading();
  const { errors } = useErrors();
  
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshNewsOnly, setRefreshNewsOnly] = useState(false);

  // 设置当前资产类型
  useEffect(() => {
    setCurrentAsset('gold');
  }, [setCurrentAsset]);

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
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* 装饰性背景 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-yellow-400/20 dark:bg-yellow-600/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-400/20 dark:bg-orange-600/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-amber-400/10 dark:bg-amber-600/5 rounded-full blur-3xl"></div>
      </div>

      {/* Header - 移动端优化 */}
      <header className="relative bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl shadow-lg border-b border-white/20 dark:border-gray-700/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 sm:py-0 sm:h-16 gap-4 sm:gap-0">
            <div className="flex items-center">
              <Link
                to="/"
                className="flex items-center text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors touch-manipulation"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                返回首页
              </Link>
              <div className="ml-6 h-6 border-l border-gray-300/50 dark:border-gray-600/50 hidden sm:block" />
              <h1 className="ml-0 sm:ml-6 text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center mt-2 sm:mt-0">
                <span className="inline-block w-3 h-3 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full mr-3 shadow-lg"></span>
                现货黄金分析
              </h1>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="text-sm text-gray-500 dark:text-gray-400 text-center sm:text-left">
                {formatUpdateTime(lastUpdated)}
              </div>
              {isDataExpired(lastUpdated, 30) && (
                <div className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-1 rounded text-center sm:text-left">
                  {formatExpirationWarning(lastUpdated, 30)}
                </div>
              )}
              <div className="relative z-[9998]">
                <ThemeToggle />
              </div>
              <button
                onClick={handleRefreshNewsOnly}
                disabled={isRefreshing || hasAnyLoading}
                className="flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/40 dark:border-gray-700/40 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-green-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation"
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
                className="flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-amber-600 dark:bg-amber-500 backdrop-blur-sm border border-amber-700 dark:border-amber-600 rounded-md hover:bg-amber-700 dark:hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 dark:focus:ring-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation"
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 lg:gap-8">
          {/* 左侧：新闻分析 - 平板横屏时占用更多空间 */}
          <div className="md:col-span-1 lg:col-span-2 xl:col-span-3 space-y-6 order-1">
            {/* 新闻分析器 */}
            <div className="bg-white/40 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20">
              <div className="px-4 sm:px-6 py-4 border-b border-white/20">
                <h2 className="text-lg font-semibold text-gray-900">
                  新闻影响分析
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  AI分析黄金市场相关新闻的潜在影响
                </p>
              </div>
              <div className="p-4 sm:p-6">
                <NewsAnalyzer 
                  assetType="gold"
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
              <div className="px-4 sm:px-6 py-4 border-b border-white/20">
                <h2 className="text-lg font-semibold text-gray-900">
                  相关新闻
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  影响黄金价格的重要新闻动态
                </p>
              </div>
              <div className="p-4 sm:p-6">
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

          {/* 右侧：价格趋势 - 平板横屏时保持合适比例 */}
          <div className="md:col-span-1 lg:col-span-1 xl:col-span-2 space-y-6 order-2">
            {/* 价格趋势图表 */}
            <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/20">
              <div className="px-4 sm:px-6 py-4 border-b border-white/20 dark:border-gray-700/20">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  价格趋势
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  过去5天的黄金价格走势
                </p>
              </div>
              <div className="p-4 sm:p-6">
                {pricesLoading || loading.prices ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner size="md" />
                  </div>
                ) : priceData.length > 0 ? (
                  <TrendChart
                    data={priceData}
                    assetType="gold"
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
                <div className="px-4 sm:px-6 py-4 border-b border-white/20 dark:border-gray-700/20">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    市场情绪指数
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    基于AI分析的市场情绪量化指标
                  </p>
                </div>
                <div className="p-4 sm:p-6">
                  <SentimentIndex 
                    analyses={analysis} 
                    assetType="gold"
                    autoSave={true}
                  />
                </div>
              </div>
            )}

            {/* 市场概览 - 平板优化 */}
            <div className="bg-white/40 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20">
              <div className="px-4 sm:px-6 py-4 border-b border-white/20">
                <h2 className="text-lg font-semibold text-gray-900">
                  市场概览
                </h2>
              </div>
              <div className="p-4 sm:p-6">
                {/* 平板竖屏：2x2网格，平板横屏及以上：垂直列表 */}
                <div className="grid grid-cols-2 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-1 gap-4 md:gap-0 lg:gap-4 xl:gap-0 md:space-y-4 lg:space-y-0 xl:space-y-4">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center lg:flex-col lg:items-start xl:flex-row xl:justify-between xl:items-center">
                    <span className="text-sm text-gray-600 mb-1 md:mb-0 lg:mb-1 xl:mb-0">当前价格</span>
                    <span className="font-semibold text-gray-900 break-all">
                      {priceData.length > 0 ? `${priceData[priceData.length - 1]?.close.toLocaleString('en-US', { maximumFractionDigits: 2 })}` : '--'}
                    </span>
                  </div>
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center lg:flex-col lg:items-start xl:flex-row xl:justify-between xl:items-center">
                    <span className="text-sm text-gray-600 mb-1 md:mb-0 lg:mb-1 xl:mb-0">24小时变化</span>
                    <span className={`font-semibold break-all ${
                      priceData.length > 0 && priceData[priceData.length - 1]?.changePercent >= 0 
                        ? 'text-red-600' 
                        : 'text-green-600'
                    }`}>
                      {priceData.length > 0 ? `${priceData[priceData.length - 1]?.changePercent >= 0 ? '+' : ''}${priceData[priceData.length - 1]?.changePercent.toFixed(2)}%` : '--'}
                    </span>
                  </div>
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center lg:flex-col lg:items-start xl:flex-row xl:justify-between xl:items-center">
                    <span className="text-sm text-gray-600 mb-1 md:mb-0 lg:mb-1 xl:mb-0">相关新闻</span>
                    <span className="font-semibold text-gray-900">
                      {news.length} 条
                    </span>
                  </div>
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center lg:flex-col lg:items-start xl:flex-row xl:justify-between xl:items-center">
                    <span className="text-sm text-gray-600 mb-1 md:mb-0 lg:mb-1 xl:mb-0">分析报告</span>
                    <span className="font-semibold text-gray-900">
                      {analysis.length} 份
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 快速导航 - 平板优化 */}
            <div className="bg-white/40 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20">
              <div className="px-4 sm:px-6 py-4 border-b border-white/20">
                <h2 className="text-lg font-semibold text-gray-900">
                  快速导航
                </h2>
              </div>
              <div className="p-4 sm:p-6">
                <div className="space-y-3">
                  <Link
                    to="/nasdaq"
                    className="block w-full text-center md:text-left px-4 py-3 text-sm font-medium text-blue-600 bg-blue-100/60 backdrop-blur-sm rounded-xl hover:bg-blue-100 transition-colors touch-manipulation"
                  >
                    切换到纳斯达克100分析
                  </Link>
                  <Link
                    to="/"
                    className="block w-full text-center md:text-left px-4 py-3 text-sm font-medium text-gray-700 bg-white/50 backdrop-blur-sm rounded-xl hover:bg-gray-100 transition-colors touch-manipulation"
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

export default GoldAnalysisPage;