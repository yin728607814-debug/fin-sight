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
import { goldPriceConverter } from '../services/goldPriceConverter';
import { usePriceData } from '../utils/context';

/**
 * 投资组合页面组件
 */
export const PortfolioPage: React.FC = () => {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { priceData: nasdaqPrices } = usePriceData('nasdaq');
  const { priceData: goldPrices } = usePriceData('gold');

  /**
   * 加载和计算投资组合
   */
  const loadPortfolio = () => {
    const positions = portfolioService.getPositions();
    
    // 获取最新价格
    const prices = new Map();
    if (nasdaqPrices.length > 0) {
      prices.set('nasdaq', nasdaqPrices[nasdaqPrices.length - 1].close);
    }
    if (goldPrices.length > 0) {
      // 黄金价格转换：美元/盎司 -> 人民币/克
      const goldUsdPerOz = goldPrices[goldPrices.length - 1].close;
      const goldCnyPerGram = goldPriceConverter.convertUsdPerOzToCnyPerGram(goldUsdPerOz);
      prices.set('gold', goldCnyPerGram);
    }

    const calculatedPortfolio = portfolioService.calculatePortfolio(positions, prices);
    setPortfolio(calculatedPortfolio);

    // 保存快照
    if (positions.length > 0) {
      portfolioService.savePortfolioSnapshot(calculatedPortfolio);
    }
  };

  /**
   * 初始加载
   */
  useEffect(() => {
    loadPortfolio();
  }, [nasdaqPrices, goldPrices]);

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
