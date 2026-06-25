/**
 * AI智能问答助手页面
 * 提供基于Gemini AI的投资咨询服务
 */

import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeftIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { ChatWindow } from '../components/ChatWindow';
import { ThemeToggle } from '../components/ThemeToggle';
import { ChatContext } from '../services/chatService';
import { useNews, usePriceData } from '../utils/context';
import { AssetType } from '../types';
import { sentimentService } from '../services/sentimentService';

/**
 * AI聊天页面Props
 */
interface AIChatPageProps {}

/**
 * AI聊天页面组件
 */
export const AIChatPage: React.FC<AIChatPageProps> = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [assetType, setAssetType] = useState<AssetType>(
    (searchParams.get('asset') as AssetType) || 'nasdaq'
  );
  
  const { news } = useNews(assetType);
  const { priceData } = usePriceData(assetType);

  /**
   * 构建聊天上下文
   */
  const buildChatContext = async (): Promise<ChatContext> => {
    // 获取当前价格和变化
    const latestPrice = priceData.length > 0 ? priceData[priceData.length - 1] : null;
    
    // 获取情绪分数
    let sentimentScore: number | undefined;
    try {
      const history = await sentimentService.getSentimentHistory(assetType, 1);
      if (history?.data && history.data.length > 0) {
        sentimentScore = history.data[0].score;
      }
    } catch (error) {
      console.error('获取情绪分数失败:', error);
    }

    return {
      assetType,
      recentNews: news.slice(0, 5).map(n => ({
        title: n.title,
        content: n.content
      })),
      currentPrice: latestPrice?.close,
      priceChange: latestPrice?.changePercent,
      sentimentScore
    };
  };

  const [chatContext, setChatContext] = useState<ChatContext>({
    assetType,
    recentNews: [],
    currentPrice: undefined,
    priceChange: undefined,
    sentimentScore: undefined
  });

  /**
   * 当资产类型或数据变化时更新上下文
   */
  useEffect(() => {
    const updateContext = async () => {
      const newContext = await buildChatContext();
      setChatContext(newContext);
    };
    updateContext();
  }, [assetType, news, priceData]);

  /**
   * 切换资产类型
   */
  const handleAssetChange = (newAssetType: AssetType) => {
    setAssetType(newAssetType);
    setSearchParams({ asset: newAssetType });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* 装饰性背景 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-400/20 dark:bg-purple-600/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-400/20 dark:bg-pink-600/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-blue-400/10 dark:bg-blue-600/5 rounded-full blur-3xl"></div>
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
                <SparklesIcon className="h-6 w-6 mr-3 text-purple-500 dark:text-purple-400" />
                AI 投资顾问
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* 资产切换 */}
              <div className="flex items-center space-x-2 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/40 dark:border-gray-700/40 rounded-lg p-1">
                <button
                  onClick={() => handleAssetChange('nasdaq')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                    assetType === 'nasdaq'
                      ? 'bg-blue-500 dark:bg-blue-600 text-white shadow-sm'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  纳斯达克
                </button>
                <button
                  onClick={() => handleAssetChange('gold')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                    assetType === 'gold'
                      ? 'bg-yellow-500 dark:bg-yellow-600 text-white shadow-sm'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  黄金
                </button>
              </div>
              
              <div className="relative z-[9998]">
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
          {/* 左侧：信息面板 */}
          <div className="lg:col-span-1 space-y-6">
            {/* 当前市场状态 */}
            <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/20 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                当前市场
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">资产</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {assetType === 'gold' ? '现货黄金' : assetType === 'astock' ? '上证指数' : '纳斯达克100'}
                  </span>
                </div>
                {chatContext.currentPrice && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">当前价格</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {chatContext.currentPrice.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                {chatContext.priceChange !== undefined && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">24h变化</span>
                    <span className={`font-semibold ${
                      chatContext.priceChange >= 0 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {chatContext.priceChange >= 0 ? '+' : ''}{chatContext.priceChange.toFixed(2)}%
                    </span>
                  </div>
                )}
                {chatContext.sentimentScore !== undefined && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">市场情绪</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {chatContext.sentimentScore.toFixed(0)}分
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">新闻数量</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {news.length}条
                  </span>
                </div>
              </div>
            </div>

            {/* 快速导航 */}
            <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/20 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                快速导航
              </h2>
              <div className="space-y-3">
                <Link
                  to={`/${assetType}`}
                  className="block w-full text-left px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm rounded-xl hover:bg-white/70 dark:hover:bg-gray-700/70 transition-all"
                >
                  查看{assetType === 'gold' ? '黄金' : assetType === 'astock' ? 'A股' : '纳斯达克'}分析
                </Link>
                <Link
                  to="/"
                  className="block w-full text-left px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm rounded-xl hover:bg-white/70 dark:hover:bg-gray-700/70 transition-all"
                >
                  返回首页
                </Link>
              </div>
            </div>

            {/* 使用提示 */}
            <div className="bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 backdrop-blur-xl rounded-2xl shadow-2xl border border-purple-200 dark:border-purple-800 p-6">
              <h2 className="text-lg font-semibold text-purple-900 dark:text-purple-200 mb-3">
                💡 使用提示
              </h2>
              <ul className="space-y-2 text-sm text-purple-800 dark:text-purple-300">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>询问市场趋势和走势预测</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>了解新闻对价格的影响</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>获取投资建议和风险提示</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>点击快速问题快速开始</span>
                </li>
              </ul>
            </div>
          </div>

          {/* 右侧：聊天窗口 */}
          <div className="lg:col-span-3">
            <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/20 overflow-hidden" style={{ height: 'calc(100vh - 12rem)' }}>
              <ChatWindow 
                context={chatContext}
                onContextUpdate={setChatContext}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AIChatPage;
