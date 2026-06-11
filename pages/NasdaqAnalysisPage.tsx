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
import { DownloadPageButton } from '../components/DownloadPageButton';
import PromptEditorModal from '../components/PromptEditorModal';
import { useCurrentAsset, useNews, useAnalysis, useOverallAnalysis, usePriceData, useLoading, useErrors } from '../utils/context';
import { formatUpdateTime, formatExpirationWarning, isDataExpired } from '../utils/helpers';
import { promptConfigService } from '../services/promptConfigService';

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
  const { priceData, setPriceData, loading: pricesLoading, error: pricesError } = usePriceData('nasdaq');
  const { loading } = useLoading();
  const { errors } = useErrors();
  
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshNewsOnly, setRefreshNewsOnly] = useState(false);
  const [refreshingPrice, setRefreshingPrice] = useState(false);
  const [criticalError, setCriticalError] = useState<string | null>(null);
  const [isPromptEditorOpen, setIsPromptEditorOpen] = useState(false);
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [currentUserId, setCurrentUserId] = useState<string>('guest');

  // 默认的纳斯达克投资策略 Prompt
  const defaultNasdaqPrompt = `
**投资策略背景**：用户对纳斯达克100采取定期定投策略，持续买入，关注长期增长趋势。请在提供投资建议时，重点关注定投策略的优化，分析当前是否适合继续定投，以及如何通过定投策略获得长期收益。`;

  // 获取当前用户 ID
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { supabase } = await import('../services/supabaseClient');
        if (!supabase) return;
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUserId(user.id);
        }
      } catch (error) {
        console.error('获取用户 ID 失败:', error);
      }
    };
    getCurrentUser();
  }, []);

  // 加载用户自定义 Prompt
  useEffect(() => {
    const loadCustomPrompt = async () => {
      try {
        const prompt = await promptConfigService.getUserPrompt(currentUserId, 'nasdaq');
        if (prompt) {
          setCustomPrompt(prompt);
        }
      } catch (error) {
        console.error('加载自定义 Prompt 失败:', error);
      }
    };
    if (currentUserId !== 'guest') {
      loadCustomPrompt();
    }
  }, [currentUserId]);

  // 设置当前资产类型，带错误处理
  useEffect(() => {
    try {
      setCurrentAsset('nasdaq');
    } catch (error) {
      console.error('设置资产类型失败:', error);
      setCriticalError('页面初始化失败');
    }
  }, [setCurrentAsset]);

  // 刷新价格数据
  const handleRefreshPrice = async () => {
    setRefreshingPrice(true);
    try {
      console.log('🔄 开始刷新纳斯达克价格数据...');
      
      // 1. 清除前端转换缓存
      const { clearPriceCache } = await import('../hooks/usePriceDataWithConversion');
      clearPriceCache();
      console.log('✅ 已清除前端缓存');
      
      // 2. 清除priceService内部所有缓存
      const { priceService } = await import('../services/priceService');
      priceService.clearAllCache();
      console.log('✅ 已清除priceService缓存');
      
      // 3. 重新获取价格数据
      console.log('🔄 重新获取纳斯达克价格数据...');
      const newPriceData = await priceService.fetchFiveDayPriceHistory('nasdaq');
      console.log('✅ 获取到新的价格数据:', newPriceData.length, '条');

      // 4. 更新页面价格数据，确保图表和数据来源同步刷新
      setPriceData([...newPriceData]);
      console.log('✅ 页面价格数据已更新');
      
      // 5. 显示数据详情
      const latestPrice = newPriceData[newPriceData.length - 1]?.close || 0;
      const dataDetails = newPriceData.map(d => 
        `${d.date.toISOString().split('T')[0]}: ${d.close.toFixed(2)}`
      ).join('\n');
      
      alert(`✅ 价格数据已更新！\n\n最新价格: ${latestPrice.toFixed(2)}\n数据点数: ${newPriceData.length}\n\n详细数据:\n${dataDetails}`);
      
      // 6. 触发组件重新渲染（不刷新页面）
      setLastUpdated(new Date());
    } catch (error) {
      console.error('❌ 刷新纳斯达克价格失败:', error);
      alert('刷新失败: ' + (error instanceof Error ? error.message : '未知错误'));
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

  // 如果有严重错误，显示错误页面
  if (criticalError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div className="flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 text-center mb-2">
            页面加载失败
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
            {criticalError}
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                setCriticalError(null);
                window.location.reload();
              }}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              重新加载
            </button>
            <button
              onClick={() => {
                // 清除纳斯达克相关的缓存
                try {
                  const keys = Object.keys(localStorage);
                  keys.forEach(key => {
                    if (key.includes('nasdaq') || key.includes('market-analysis')) {
                      localStorage.removeItem(key);
                    }
                  });
                } catch (e) {
                  console.error('清除缓存失败:', e);
                }
                window.location.href = '/';
              }}
              className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium"
            >
              清除缓存并返回首页
            </button>
          </div>
        </div>
      </div>
    );
  }

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
          {/* 移动端：垂直布局 */}
          <div className="flex flex-col sm:hidden py-3 space-y-3">
            {/* 第一行：返回按钮和标题 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center min-w-0 flex-1">
                <Link
                  to="/"
                  className="flex items-center text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors flex-shrink-0"
                >
                  <ArrowLeftIcon className="h-5 w-5 mr-2" />
                  <span className="text-sm">返回</span>
                </Link>
                <div className="ml-3 h-6 border-l border-gray-300/50 dark:border-gray-600/50" />
                <h1 className="ml-3 text-base font-bold text-gray-900 dark:text-gray-100 flex items-center truncate">
                  <span className="inline-block w-2 h-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full mr-2 shadow-lg flex-shrink-0"></span>
                  <span className="truncate">纳斯达克100分析</span>
                </h1>
              </div>
              <div className="relative z-[9998] ml-2 flex-shrink-0">
                <ThemeToggle />
              </div>
            </div>
            
            {/* 第二行：更新时间 */}
            <div className="flex items-center justify-between space-x-2">
              <div className="text-xs text-gray-600 dark:text-gray-400 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm px-2 py-1 rounded-lg truncate flex-1">
                {formatUpdateTime(lastUpdated)}
              </div>
            </div>
            
            {/* 过期警告 */}
            {isDataExpired(lastUpdated, 30) && (
              <div className="text-xs text-amber-700 dark:text-amber-400 bg-amber-100/80 dark:bg-amber-900/30 backdrop-blur-sm px-2 py-1 rounded-lg">
                {formatExpirationWarning(lastUpdated, 30)}
              </div>
            )}
          </div>
          
          {/* 桌面端：水平布局 */}
          <div className="hidden sm:flex items-center justify-between h-16">
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
              <button
                onClick={() => setIsPromptEditorOpen(true)}
                className="px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 
                         bg-blue-50 dark:bg-blue-900/30 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50
                         transition-colors border border-blue-200 dark:border-blue-800"
              >
                ⚙️ 自定义策略
              </button>
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
              <DownloadPageButton 
                pageName="纳斯达克100分析" 
                targetId="overall-analysis-nasdaq"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* 全局错误显示 */}
        {hasAnyError && (
          <div className="mb-4 sm:mb-6">
            <ErrorMessage
              title="数据加载出现问题"
              message="部分数据可能无法正常显示，请尝试刷新页面"
              onRetry={handleRefresh}
            />
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 sm:gap-6 lg:gap-8">
          {/* 左侧：新闻分析 */}
          <div className="xl:col-span-3 space-y-4 sm:space-y-6">
            {/* 新闻分析器 */}
            <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/20">
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-white/20 dark:border-gray-700/20">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
                  新闻影响分析
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                  AI分析纳斯达克100相关新闻的潜在影响
                </p>
              </div>
              <div className="p-4 sm:p-6">
                <NewsAnalyzer 
                  assetType="nasdaq"
                  onAnalysisComplete={() => setLastUpdated(new Date())}
                  skipAnalysis={refreshNewsOnly}
                />
              </div>
            </div>

            {/* 整体市场分析 */}
            {overallAnalysis && (
              <div id="overall-analysis-nasdaq">
                <OverallAnalysisCard 
                  analysis={overallAnalysis}
                  loading={analysisLoading || loading.analysis}
                />
              </div>
            )}

            {/* 新闻列表 */}
            <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/20">
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-white/20 dark:border-gray-700/20">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
                  相关新闻
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                  影响纳斯达克100的重要新闻动态
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

          {/* 右侧：价格趋势 */}
          <div className="xl:col-span-2 space-y-4 sm:space-y-6">
            {/* 价格趋势图表 */}
            <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/20">
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-white/20 dark:border-gray-700/20">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
                      价格趋势
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                      过去5天的纳斯达克100走势
                    </p>
                  </div>
                  <button
                    onClick={handleRefreshPrice}
                    disabled={refreshingPrice}
                    className="flex items-center space-x-1 px-2 sm:px-3 py-1.5 text-xs text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/40 transition-colors disabled:opacity-50"
                    title="刷新纳斯达克价格"
                  >
                    <svg className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${refreshingPrice ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span className="hidden sm:inline">{refreshingPrice ? '刷新中' : '刷新价格'}</span>
                    <span className="sm:hidden">{refreshingPrice ? '刷新' : '刷新'}</span>
                  </button>
                </div>
              </div>
              <div className="p-4 sm:p-6">
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
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                    暂无价格数据
                  </div>
                )}
              </div>
            </div>

            {/* 情绪指数 */}
            {analysis.length > 0 && (
              <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/20">
                <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-white/20 dark:border-gray-700/20">
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
                    市场情绪指数
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                    基于AI分析的市场情绪量化指标
                  </p>
                </div>
                <div className="p-4 sm:p-6">
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
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-white/20 dark:border-gray-700/20">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
                  市场概览
                </h2>
              </div>
              <div className="p-4 sm:p-6">
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex justify-between items-center p-3 bg-white/30 dark:bg-gray-700/30 backdrop-blur-sm rounded-xl">
                    <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-medium">当前指数</span>
                    <span className="font-bold text-gray-900 dark:text-gray-100 whitespace-nowrap text-sm sm:text-base">
                      {priceData.length > 0 ? `${priceData[priceData.length - 1]?.close.toLocaleString('en-US', { maximumFractionDigits: 2 })}` : '--'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/30 dark:bg-gray-700/30 backdrop-blur-sm rounded-xl">
                    <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-medium">24小时变化</span>
                    <span className={`font-bold text-sm sm:text-base ${
                      priceData.length > 0 && priceData[priceData.length - 1]?.changePercent >= 0 
                        ? 'text-red-600 dark:text-red-400' 
                        : 'text-green-600 dark:text-green-400'
                    }`}>
                      {priceData.length > 0 ? `${priceData[priceData.length - 1]?.changePercent >= 0 ? '+' : ''}${priceData[priceData.length - 1]?.changePercent.toFixed(2)}%` : '--'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/30 dark:bg-gray-700/30 backdrop-blur-sm rounded-xl">
                    <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-medium">相关新闻</span>
                    <span className="font-bold text-gray-900 dark:text-gray-100 text-sm sm:text-base">
                      {news.length} 条
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/30 dark:bg-gray-700/30 backdrop-blur-sm rounded-xl">
                    <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-medium">分析报告</span>
                    <span className="font-bold text-gray-900 dark:text-gray-100 text-sm sm:text-base">
                      {analysis.length} 份
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 技术指标 */}
            <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/20">
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-white/20 dark:border-gray-700/20">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
                  技术指标
                </h2>
              </div>
              <div className="p-4 sm:p-6">
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex justify-between items-center p-3 bg-white/30 dark:bg-gray-700/30 backdrop-blur-sm rounded-xl">
                    <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-medium">5日最高</span>
                    <span className="font-bold text-gray-900 dark:text-gray-100">
                      {priceData.length > 0 ? Math.max(...priceData.map(d => d.high)).toFixed(2) : '--'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/30 dark:bg-gray-700/30 backdrop-blur-sm rounded-xl">
                    <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-medium">5日最低</span>
                    <span className="font-bold text-gray-900 dark:text-gray-100">
                      {priceData.length > 0 ? Math.min(...priceData.map(d => d.low)).toFixed(2) : '--'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/30 dark:bg-gray-700/30 backdrop-blur-sm rounded-xl">
                    <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-medium">平均成交量</span>
                    <span className="font-bold text-gray-900 dark:text-gray-100">
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
            <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/20">
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-white/20 dark:border-gray-700/20">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
                  快速导航
                </h2>
              </div>
              <div className="p-4 sm:p-6">
                <div className="space-y-3">
                  <Link
                    to="/gold"
                    className="block w-full text-left px-4 py-3 text-sm font-medium text-yellow-700 dark:text-yellow-300 bg-yellow-100/60 dark:bg-yellow-900/30 backdrop-blur-sm rounded-xl hover:bg-yellow-100/80 dark:hover:bg-yellow-900/40 transition-all shadow-lg"
                  >
                    切换到现货黄金分析
                  </Link>
                  <Link
                    to="/"
                    className="block w-full text-left px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm rounded-xl hover:bg-white/70 dark:hover:bg-gray-700/70 transition-all shadow-lg"
                  >
                    返回首页
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Prompt 编辑器模态框 */}
      <PromptEditorModal
        isOpen={isPromptEditorOpen}
        onClose={() => setIsPromptEditorOpen(false)}
        assetType="nasdaq"
        userId={currentUserId}
        defaultPrompt={defaultNasdaqPrompt}
        onSave={(prompt) => {
          setCustomPrompt(prompt);
          // 刷新分析以应用新的 Prompt
          setLastUpdated(new Date());
        }}
      />
    </div>
  );
};

export default NasdaqAnalysisPage;
