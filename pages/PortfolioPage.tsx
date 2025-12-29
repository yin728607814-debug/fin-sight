/**
 * 投资组合页面
 * 管理和追踪投资组合
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftIcon, PlusIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { ThemeToggle } from '../components/ThemeToggle';
import { PortfolioSummary } from '../components/PortfolioSummary';
import { PositionList } from '../components/PositionList';
import { PortfolioChart } from '../components/PortfolioChart';
import { AddPositionModal } from '../components/AddPositionModal';
import { EditPositionModal } from '../components/EditPositionModal';
import { GoldSummary } from '../components/GoldSummary';
import { portfolioService, Position, Portfolio } from '../services/portfolioService';
import { usePriceDataWithConversion } from '../hooks/usePriceDataWithConversion';

/**
 * 投资组合页面组件
 */
export const PortfolioPage: React.FC = () => {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [previousPrices, setPreviousPrices] = useState<Map<string, number>>(new Map());
  const [dailyReturns, setDailyReturns] = useState<Map<string, number>>(new Map());
  const [lastPriceUpdate, setLastPriceUpdate] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 使用增强的价格数据hook（自动处理黄金价格转换）
  const nasdaq = usePriceDataWithConversion('nasdaq');
  const gold = usePriceDataWithConversion('gold');

  /**
   * 加载和计算投资组合
   */
  const loadPortfolio = () => {
    const positions = portfolioService.getPositions();
    
    // 获取最新价格（已自动转换）
    const prices = new Map();
    if (nasdaq.currentPrice !== null) {
      prices.set('nasdaq', nasdaq.currentPrice);
    }
    if (gold.currentPrice !== null) {
      // 黄金价格已经转换为人民币/克
      prices.set('gold', gold.currentPrice);
    }

    const calculatedPortfolio = portfolioService.calculatePortfolio(positions, prices);
    setPortfolio(calculatedPortfolio);

    // 保存快照
    if (positions.length > 0) {
      portfolioService.savePortfolioSnapshot(calculatedPortfolio);
    }

    // 更新价格更新时间
    if (prices.size > 0) {
      setLastPriceUpdate(new Date());
    }
  };

  /**
   * 手动刷新价格
   */
  const handleRefreshPrices = async () => {
    setIsRefreshing(true);
    try {
      // 触发页面刷新以重新获取价格
      await new Promise(resolve => setTimeout(resolve, 500));
      window.location.reload();
    } catch (error) {
      console.error('刷新失败:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  /**
   * 计算日收益
   * 对比当前价格和前一次价格
   */
  const calculateDailyReturns = () => {
    if (!portfolio) return;

    const newDailyReturns = new Map<string, number>();

    portfolio.positions.forEach(position => {
      const currentPrice = position.currentPrice;
      const previousPrice = previousPrices.get(position.id);

      if (currentPrice && previousPrice && previousPrice !== currentPrice) {
        const dailyReturn = ((currentPrice - previousPrice) / previousPrice) * 100;
        newDailyReturns.set(position.id, dailyReturn);
      }
    });

    setDailyReturns(newDailyReturns);
  };

  /**
   * 更新前一次价格记录
   */
  const updatePreviousPrices = () => {
    if (!portfolio) return;

    const newPreviousPrices = new Map<string, number>();
    portfolio.positions.forEach(position => {
      if (position.currentPrice) {
        newPreviousPrices.set(position.id, position.currentPrice);
      }
    });

    setPreviousPrices(newPreviousPrices);
  };

  /**
   * 初始加载
   */
  useEffect(() => {
    loadPortfolio();
  }, [nasdaq.currentPrice, gold.currentPrice]);

  /**
   * 价格变化时计算日收益
   */
  useEffect(() => {
    if (portfolio && previousPrices.size > 0) {
      calculateDailyReturns();
    }
    updatePreviousPrices();
  }, [nasdaq.currentPrice, gold.currentPrice]);

  /**
   * 初始化前一次价格
   */
  useEffect(() => {
    if (portfolio && previousPrices.size === 0) {
      updatePreviousPrices();
    }
  }, [portfolio]);

  /**
   * 添加持仓
   */
  const handleAddPosition = (position: Omit<Position, 'id'>) => {
    portfolioService.addPosition(position);
    loadPortfolio();
  };

  /**
   * 编辑持仓
   */
  const handleEditPosition = (id: string, updates: Partial<Position>) => {
    portfolioService.updatePosition(id, updates);
    loadPortfolio();
    setSelectedPosition(null);
  };

  /**
   * 删除持仓
   */
  const handleDeletePosition = (id: string) => {
    portfolioService.deletePosition(id);
    loadPortfolio();
  };

  /**
   * 导出投资组合
   */
  const handleExport = () => {
    const jsonData = portfolioService.exportPortfolio();
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `portfolio_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const history = portfolioService.getPortfolioHistory(30);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* 装饰性背景 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-400/20 dark:bg-green-600/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-400/20 dark:bg-emerald-600/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-teal-400/10 dark:bg-teal-600/5 rounded-full blur-3xl"></div>
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
                <svg className="h-6 w-6 mr-3 text-green-500 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                投资组合
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={handleExport}
                disabled={!portfolio || portfolio.positions.length === 0}
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/40 dark:border-gray-700/40 rounded-lg hover:bg-white/80 dark:hover:bg-gray-800/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                title="导出投资组合"
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                导出
              </button>
              <div className="relative z-[9998]">
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 价格错误提示 */}
      {(nasdaq.hasError || gold.hasError) && (
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-start">
              <svg className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                  价格数据获取异常
                </h3>
                <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-400 space-y-1">
                  {nasdaq.hasError && (
                    <p>• 纳斯达克: {nasdaq.conversionError || nasdaq.error || '数据获取失败'}</p>
                  )}
                  {gold.hasError && (
                    <p>• 黄金: {gold.conversionError || gold.error || '数据获取失败'}</p>
                  )}
                  <p className="mt-2">系统将使用上次成功获取的价格数据。您可以刷新页面重试。</p>
                  {lastPriceUpdate && (
                    <p className="text-xs mt-1">
                      上次更新: {lastPriceUpdate.toLocaleString('zh-CN')}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={handleRefreshPrices}
                disabled={isRefreshing}
                className="ml-3 px-3 py-1.5 text-xs font-medium text-yellow-800 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-900/40 rounded hover:bg-yellow-200 dark:hover:bg-yellow-900/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRefreshing ? '刷新中...' : '刷新'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 价格更新时间显示（无错误时） */}
      {!nasdaq.hasError && !gold.hasError && lastPriceUpdate && portfolio && portfolio.positions.length > 0 && (
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-2">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>价格更新时间: {lastPriceUpdate.toLocaleString('zh-CN')}</span>
            </div>
            <button
              onClick={handleRefreshPrices}
              disabled={isRefreshing}
              className="flex items-center space-x-1 px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors disabled:opacity-50"
            >
              <svg className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>{isRefreshing ? '刷新中' : '手动刷新'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* 左侧：总览和图表 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 投资组合总览 */}
            {portfolio && <PortfolioSummary portfolio={portfolio} />}

            {/* 图表 */}
            {portfolio && portfolio.positions.length > 0 && (
              <PortfolioChart portfolio={portfolio} history={history} />
            )}

            {/* 持仓列表 */}
            <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/20 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  持仓列表
                </h2>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="flex items-center px-4 py-2 bg-green-500 dark:bg-green-600 text-white rounded-lg hover:bg-green-600 dark:hover:bg-green-700 transition-colors shadow-sm"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  添加持仓
                </button>
              </div>
              
              {portfolio && (
                <PositionList
                  positions={portfolio.positions}
                  onEdit={(position) => {
                    setSelectedPosition(position);
                    setIsEditModalOpen(true);
                  }}
                  onDelete={handleDeletePosition}
                  dailyReturns={dailyReturns}
                />
              )}
            </div>
          </div>

          {/* 右侧：统计信息 */}
          <div className="space-y-6">
            {/* 黄金持仓总览 */}
            {portfolio && (() => {
              const goldStats = portfolioService.getGoldStats(portfolio);
              return goldStats.count > 0 ? <GoldSummary goldStats={goldStats} /> : null;
            })()}

            {/* 统计卡片 */}
            {portfolio && portfolio.positions.length > 0 && (
              <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/20 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  统计信息
                </h2>
                <div className="space-y-4">
                  {(() => {
                    const stats = portfolioService.getStatistics(portfolio);
                    return (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400">总持仓数</span>
                          <span className="font-semibold text-gray-900 dark:text-gray-100">
                            {stats.totalPositions}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400">盈利持仓</span>
                          <span className="font-semibold text-green-600 dark:text-green-400">
                            {stats.profitablePositions}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400">亏损持仓</span>
                          <span className="font-semibold text-red-600 dark:text-red-400">
                            {stats.losingPositions}
                          </span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* 快速导航 */}
            <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/20 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                快速导航
              </h2>
              <div className="space-y-3">
                <Link
                  to="/nasdaq"
                  className="block w-full text-left px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm rounded-xl hover:bg-white/70 dark:hover:bg-gray-700/70 transition-all"
                >
                  纳斯达克分析
                </Link>
                <Link
                  to="/gold"
                  className="block w-full text-left px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm rounded-xl hover:bg-white/70 dark:hover:bg-gray-700/70 transition-all"
                >
                  黄金分析
                </Link>
                <Link
                  to="/ai-chat"
                  className="block w-full text-left px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm rounded-xl hover:bg-white/70 dark:hover:bg-gray-700/70 transition-all"
                >
                  AI投资顾问
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 弹窗 */}
      <AddPositionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddPosition}
      />
      
      <EditPositionModal
        isOpen={isEditModalOpen}
        position={selectedPosition}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedPosition(null);
        }}
        onSave={handleEditPosition}
      />
    </div>
  );
};

export default PortfolioPage;
