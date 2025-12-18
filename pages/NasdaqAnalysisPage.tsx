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
import { useCurrentAsset, useNews, useAnalysis, usePriceData, useLoading, useErrors } from '../utils/context';
import { formatUpdateTime, formatExpirationWarning, isDataExpired } from '../utils/helpers';
import { AssetType } from '../types';

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
  const { priceData, loading: pricesLoading, error: pricesError } = usePriceData('nasdaq');
  const { loading } = useLoading();
  const { errors } = useErrors();
  
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 设置当前资产类型
  useEffect(() => {
    setCurrentAsset('nasdaq');
  }, [setCurrentAsset]);

  // 手动刷新数据
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // 这里会触发NewsAnalyzer组件重新获取数据
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link
                to="/"
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                返回首页
              </Link>
              <div className="ml-6 h-6 border-l border-gray-300" />
              <h1 className="ml-6 text-xl font-bold text-gray-900 flex items-center">
                <span className="inline-block w-3 h-3 bg-blue-500 rounded-full mr-3"></span>
                纳斯达克100分析
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                {formatUpdateTime(lastUpdated)}
              </div>
              {isDataExpired(lastUpdated, 30) && (
                <div className="text-sm text-amber-600 bg-amber-50 px-2 py-1 rounded">
                  {formatExpirationWarning(lastUpdated, 30)}
                </div>
              )}
              <button
                onClick={handleRefresh}
                disabled={isRefreshing || hasAnyLoading}
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {isRefreshing ? '刷新中...' : '刷新数据'}
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
              onClose={() => {}}
            />
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
          {/* 左侧：新闻分析 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 新闻分析器 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
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
                />
              </div>
            </div>

            {/* 新闻列表 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
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
                    <LoadingSpinner size="md" text="加载新闻中..." />
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
          <div className="space-y-6">
            {/* 价格趋势图表 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  价格趋势
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  过去5天的纳斯达克100走势
                </p>
              </div>
              <div className="p-6">
                {pricesLoading || loading.prices ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner size="md" text="加载价格数据..." />
                  </div>
                ) : priceData.length > 0 ? (
                  <TrendChart
                    data={priceData}
                    assetType="nasdaq"
                    timeRange={5}
                  />
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    暂无价格数据
                  </div>
                )}
              </div>
            </div>

            {/* 市场概览 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  市场概览
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">当前指数</span>
                    <span className="font-semibold text-gray-900">
                      {priceData.length > 0 ? `${priceData[priceData.length - 1]?.close.toFixed(2)}` : '--'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">24小时变化</span>
                    <span className={`font-semibold ${
                      priceData.length > 0 && priceData[priceData.length - 1]?.changePercent >= 0 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {priceData.length > 0 ? `${priceData[priceData.length - 1]?.changePercent.toFixed(2)}%` : '--'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">相关新闻</span>
                    <span className="font-semibold text-gray-900">
                      {news.length} 条
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">分析报告</span>
                    <span className="font-semibold text-gray-900">
                      {analysis.length} 份
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 技术指标 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  技术指标
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">5日最高</span>
                    <span className="font-semibold text-gray-900">
                      {priceData.length > 0 ? Math.max(...priceData.map(d => d.high)).toFixed(2) : '--'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">5日最低</span>
                    <span className="font-semibold text-gray-900">
                      {priceData.length > 0 ? Math.min(...priceData.map(d => d.low)).toFixed(2) : '--'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">平均成交量</span>
                    <span className="font-semibold text-gray-900">
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
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  快速导航
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  <Link
                    to="/gold"
                    className="block w-full text-left px-4 py-3 text-sm font-medium text-yellow-600 bg-yellow-50 rounded-md hover:bg-yellow-100 transition-colors"
                  >
                    切换到现货黄金分析
                  </Link>
                  <Link
                    to="/"
                    className="block w-full text-left px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
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