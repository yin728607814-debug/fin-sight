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
import { DownloadPageButton } from '../components/DownloadPageButton';
import PromptEditorModal from '../components/PromptEditorModal';
import { useCurrentAsset, useNews, useAnalysis, useOverallAnalysis, usePriceData, useLoading, useErrors } from '../utils/context';
import { formatUpdateTime, formatExpirationWarning, isDataExpired } from '../utils/helpers';
import { promptConfigService } from '../services/promptConfigService';

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
  const [refreshingPrice, setRefreshingPrice] = useState(false);
  const [criticalError, setCriticalError] = useState<string | null>(null);
  const [isPromptEditorOpen, setIsPromptEditorOpen] = useState(false);
  const [customPrompt, setCustomPrompt] = useState<string>('');

  // 默认的黄金投资策略 Prompt
  const defaultGoldPrompt = `
**投资策略背景**：
用户将黄金视为战略防守底仓，采取极度保守的动态配置策略。核心原则：过滤短期单日噪音，只有在特定的宏观与技术共振时才触发减仓。

**【铁律：禁止单日逆向跟风】**
严禁仅仅因为"单日/短期纳斯达克上涨、黄金下跌"的表象，就给出"卖出黄金"的建议。系统必须具备大周期全局观。

**【触发条件一：宏观复苏 + 牛市健康回调（核心上车信号）】**
只有当以下三个条件同时满足时，AI才能建议"减仓黄金，买入纳斯达克"：

1. **纳指趋势确认**：
   - 新闻和数据表明，纳斯达克在最近一个月左右呈现明确的上升态势
   - 甚至突破前高，确立多头趋势
   - 不是单日或几日的短期波动

2. **宏观基本面确认**：
   - 宏观新闻明确指向"全球经济出现明显的实质性回暖与复苏"
   - 不是单一数据或短期现象
   - 需要多个经济指标共同验证

3. **精准逢低切入（修正参数）**：
   - 在满足前两点的背景下，绝对不追高！
   - 系统需耐心等待纳斯达克出现"牛市级别的健康回调或深度洗盘"
   - 通常指从高点回撤 8% — 15% 的区间
   - 只有在这个回调区间，才可触发"卖出黄金以换取廉价纳指筹码"的指令

**【触发条件二：黄金逻辑逆转（滞涨套利信号）】**
当新闻和数据分析得出明确结论：

1. **黄金宏观趋势改变**：
   - 黄金的宏观上涨趋势发生实质性改变
   - 世界经济全面回暖、地缘避险情绪彻底消退
   - 导致"黄金上涨动能枯竭、预期涨幅极其有限"
   - 出现横盘或震荡下跌

2. **操作建议**：
   - 此时可以建议：逢高卖出"部分"黄金进行获利套现
   - 将这部分资金作为弹药，转移部署至纳斯达克阵地
   - 注意：是"部分"减仓，不是全部清仓

**【默认持仓策略】**
如果以上两个触发条件都不满足，默认建议：
- 保持当前黄金仓位不变
- 黄金作为战略防守底仓，长期持有
- 不要因为短期波动而频繁调整
- 强调"耐心等待"和"战略定力"

**【分析要求】**
在提供投资建议时，必须：
1. 明确说明当前是否满足"触发条件一"或"触发条件二"
2. 如果不满足，明确建议"保持当前黄金仓位，耐心等待"
3. 如果满足，详细说明满足哪些具体条件，以及建议的操作方式
4. 强调大周期视角，避免被短期噪音干扰`;

  // 加载用户自定义 Prompt
  useEffect(() => {
    const loadCustomPrompt = async () => {
      try {
        const userId = localStorage.getItem('userId') || 'guest';
        const prompt = await promptConfigService.getUserPrompt(userId, 'gold');
        if (prompt) {
          setCustomPrompt(prompt);
        }
      } catch (error) {
        console.error('加载自定义 Prompt 失败:', error);
      }
    };
    loadCustomPrompt();
  }, []);

  // 设置当前资产类型，带错误处理
  useEffect(() => {
    try {
      setCurrentAsset('gold');
    } catch (error) {
      console.error('设置资产类型失败:', error);
      setCriticalError('页面初始化失败');
    }
  }, [setCurrentAsset]);

  // 刷新价格数据
  const handleRefreshPrice = async () => {
    setRefreshingPrice(true);
    try {
      console.log('🔄 开始刷新黄金价格数据...');
      
      // 1. 清除前端转换缓存
      const { clearPriceCache } = await import('../hooks/usePriceDataWithConversion');
      clearPriceCache();
      console.log('✅ 已清除前端缓存');
      
      // 2. 清除priceService内部所有缓存
      const { priceService } = await import('../services/priceService');
      priceService.clearAllCache();
      console.log('✅ 已清除priceService缓存');
      
      // 3. 重新获取价格数据
      console.log('🔄 重新获取黄金价格数据...');
      const newPriceData = await priceService.fetchFiveDayPriceHistory('gold');
      console.log('✅ 获取到新的价格数据:', newPriceData.length, '条');
      
      // 4. 显示数据详情
      const latestPrice = newPriceData[newPriceData.length - 1]?.close || 0;
      const dataDetails = newPriceData.map(d => 
        `${d.date.toISOString().split('T')[0]}: $${d.close}`
      ).join('\n');
      
      alert(`✅ 价格数据已更新！\n\n最新价格: $${latestPrice}\n数据点数: ${newPriceData.length}\n\n详细数据:\n${dataDetails}`);
      
      // 5. 触发组件重新渲染（不刷新页面）
      setLastUpdated(new Date());
    } catch (error) {
      console.error('❌ 刷新黄金价格失败:', error);
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
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
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
              className="w-full px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium"
            >
              重新加载
            </button>
            <button
              onClick={() => {
                // 清除黄金相关的缓存
                try {
                  const keys = Object.keys(localStorage);
                  keys.forEach(key => {
                    if (key.includes('gold') || key.includes('market-analysis')) {
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
              <button
                onClick={() => setIsPromptEditorOpen(true)}
                className="px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 
                         bg-blue-50 dark:bg-blue-900/30 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50
                         transition-colors border border-blue-200 dark:border-blue-800"
              >
                ⚙️ 自定义策略
              </button>
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
              <DownloadPageButton 
                pageName="现货黄金分析" 
                targetId="overall-analysis-gold"
              />
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
              <div id="overall-analysis-gold">
                <OverallAnalysisCard 
                  analysis={overallAnalysis}
                  loading={analysisLoading || loading.analysis}
                />
              </div>
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
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      价格趋势
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      过去5天的黄金价格走势
                    </p>
                  </div>
                  <button
                    onClick={handleRefreshPrice}
                    disabled={refreshingPrice}
                    className="flex items-center space-x-1 px-3 py-1.5 text-xs text-yellow-700 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-lg hover:bg-yellow-200 dark:hover:bg-yellow-900/40 transition-colors disabled:opacity-50"
                    title="刷新黄金价格"
                  >
                    <svg className={`h-3.5 w-3.5 ${refreshingPrice ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>{refreshingPrice ? '刷新中' : '刷新价格'}</span>
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

      {/* Prompt 编辑器模态框 */}
      <PromptEditorModal
        isOpen={isPromptEditorOpen}
        onClose={() => setIsPromptEditorOpen(false)}
        assetType="gold"
        userId={localStorage.getItem('userId') || 'guest'}
        defaultPrompt={defaultGoldPrompt}
        onSave={(prompt) => {
          setCustomPrompt(prompt);
          // 刷新分析以应用新的 Prompt
          setLastUpdated(new Date());
        }}
      />
    </div>
  );
};

export default GoldAnalysisPage;