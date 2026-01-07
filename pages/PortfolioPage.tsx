/**
 * 投资组合页面
 * 管理和追踪投资组合
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftIcon, PlusIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { ThemeToggle } from '../components/ThemeToggle';
import { PositionList } from '../components/PositionList';
import { PortfolioChart } from '../components/PortfolioChart';
import { AddPositionModal } from '../components/AddPositionModal';
import { EditPositionModal } from '../components/EditPositionModal';
import { GoldSummary } from '../components/GoldSummary';
import { MigrationPrompt } from '../components/MigrationPrompt';
import { portfolioService, Position, Portfolio } from '../services/portfolioService';
import { usePriceDataWithConversion } from '../hooks/usePriceDataWithConversion';
import { usePortfolioWithSupabase } from '../hooks/usePortfolioWithSupabase';
import { useAStockFundData } from '../hooks/useAStockFundData';
import { aStockFundService } from '../services/aStockFundService';

/**
 * 投资组合页面组件
 */
export const PortfolioPage: React.FC = () => {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [previousPrices, setPreviousPrices] = useState<Map<string, number>>(new Map());
  const [lastPriceUpdate, setLastPriceUpdate] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showMigration, setShowMigration] = useState(true);
  const [lastDbUpdate, setLastDbUpdate] = useState<Date | null>(null);
  
  // Tab状态：用于区分黄金、纳斯达克和A股
  const [activeTab, setActiveTab] = useState<'all' | 'nasdaq' | 'gold' | 'astock'>('all');
  const [summaryTab, setSummaryTab] = useState<'all' | 'nasdaq' | 'gold' | 'astock'>('all');


  // 使用增强的价格数据hook（自动处理黄金价格转换）
  const nasdaq = usePriceDataWithConversion('nasdaq');
  const gold = usePriceDataWithConversion('gold');
  
  // 使用 Supabase 后端存储
  const {
    positions: supabasePositions,
    loading: supabaseLoading,
    error: supabaseError,
    isSupabaseEnabled,
    addPosition: addSupabasePosition,
    updatePosition: updateSupabasePosition,
    deletePosition: deleteSupabasePosition,
    refetch: refetchSupabase,
    exportPositions: exportSupabasePositions
  } = usePortfolioWithSupabase();
  
  // 获取A股基金名称列表（使用useMemo避免无限循环）
  const aStockFundNames = React.useMemo(() => {
    return supabasePositions
      .filter(p => p.assetType === 'astock' && p.fundName)
      .map(p => p.fundName!);
  }, [supabasePositions]);
  
  // 使用A股基金数据Hook（启用智能刷新）
  const { fundDataMap: aStockData } = useAStockFundData(
    aStockFundNames,
    true, // 启用智能刷新
    undefined // 使用智能刷新逻辑，不指定手动间隔
  );

  /**
   * 加载和计算投资组合（不更新数据库）
   */
  const loadPortfolio = async () => {
    // 使用 Supabase 数据
    const positions = isSupabaseEnabled ? supabasePositions : portfolioService.getPositions();
    
    // 获取最新价格（已自动转换）
    const prices = new Map();
    if (nasdaq.currentPrice !== null) {
      prices.set('nasdaq', nasdaq.currentPrice);
    }
    if (gold.currentPrice !== null) {
      // 黄金价格已经转换为人民币/克
      prices.set('gold', gold.currentPrice);
    }

    // 获取前一次价格（用于计算当日收益）
    const prevPrices = new Map();
    if (previousPrices.has('nasdaq')) {
      prevPrices.set('nasdaq', previousPrices.get('nasdaq'));
    }
    if (previousPrices.has('gold')) {
      prevPrices.set('gold', previousPrices.get('gold'));
    }

    // 计算投资组合
    let calculatedPortfolio = portfolioService.calculatePortfolio(
      positions, 
      prices,
      prevPrices.size > 0 ? prevPrices : undefined
    );
    
    // 为A股基金添加当日收益数据
    if (aStockData.size > 0) {
      calculatedPortfolio = {
        ...calculatedPortfolio,
        positions: calculatedPortfolio.positions.map(position => {
          if (position.assetType === 'astock' && position.fundName) {
            const fundData = aStockData.get(position.fundName);
            if (fundData) {
              const dailyProfit = aStockFundService.calculateDailyProfit(
                position.investmentAmount,
                fundData.dailyReturn
              );
              return {
                ...position,
                dailyProfitLoss: dailyProfit,
                dailyChange: fundData.dailyReturn
              };
            }
          }
          return position;
        })
      };
    }
    
    setPortfolio(calculatedPortfolio);

    // 保存快照
    if (positions.length > 0) {
      portfolioService.savePortfolioSnapshot(calculatedPortfolio);
    }

    // 更新价格更新时间
    if (prices.size > 0 || aStockData.size > 0) {
      setLastPriceUpdate(new Date());
    }

    // 更新前一次价格记录
    if (prices.size > 0) {
      const newPreviousPrices = new Map(previousPrices);
      prices.forEach((price, assetType) => {
        newPreviousPrices.set(assetType, price);
      });
      setPreviousPrices(newPreviousPrices);
    }
  };

  /**
   * 更新黄金持仓收益到数据库
   */
  const updateGoldProfitToDb = async () => {
    if (!isSupabaseEnabled || !portfolio || gold.currentPrice === null) {
      return;
    }

    const goldPositions = portfolio.positions.filter(p => p.assetType === 'gold');
    
    let hasUpdates = false;
    for (const position of goldPositions) {
      // 只有当收益发生变化时才更新（使用更严格的比较，避免浮点数精度问题）
      const originalPosition = supabasePositions.find(p => p.id === position.id);
      if (originalPosition) {
        const profitDiff = Math.abs((originalPosition.profitLoss || 0) - (position.profitLoss || 0));
        const valueDiff = Math.abs((originalPosition.currentValue || 0) - (position.currentValue || 0));
        
        // 只有当差异大于 0.01 元时才更新
        if (profitDiff > 0.01 || valueDiff > 0.01) {
          try {
            await updateSupabasePosition(position.id, {
              profitLoss: position.profitLoss,
              currentValue: position.currentValue
            });
            hasUpdates = true;
          } catch (error) {
            console.error('更新黄金持仓收益失败:', error);
          }
        }
      }
    }

    if (hasUpdates) {
      setLastDbUpdate(new Date());
    }
  };

  /**
   * 手动刷新黄金收益到数据库
   */
  const handleRefreshGoldProfit = async () => {
    setIsRefreshing(true);
    try {
      await updateGoldProfitToDb();
    } catch (error) {
      console.error('刷新黄金收益失败:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  /**
   * 更新A股持仓收益到数据库
   */
  const updateAStockProfitToDb = async () => {
    if (!isSupabaseEnabled || !portfolio || aStockData.size === 0) {
      return;
    }

    const aStockPositions = portfolio.positions.filter(p => p.assetType === 'astock');
    
    let hasUpdates = false;
    for (const position of aStockPositions) {
      if (!position.fundName) continue;
      
      const fundData = aStockData.get(position.fundName);
      if (!fundData) continue;

      // 计算当日收益
      const dailyProfit = aStockFundService.calculateDailyProfit(
        position.investmentAmount,
        fundData.dailyReturn
      );

      // 检查是否需要更新（当日收益变化超过0.01元）
      const originalPosition = supabasePositions.find(p => p.id === position.id);
      if (originalPosition) {
        const currentDailyProfit = originalPosition.dailyProfitLoss || 0;
        const profitDiff = Math.abs(currentDailyProfit - dailyProfit);
        
        // 只有当差异大于 0.01 元时才更新
        if (profitDiff > 0.01) {
          try {
            await updateSupabasePosition(position.id, {
              dailyProfitLoss: dailyProfit,
              dailyChange: fundData.dailyReturn
            });
            hasUpdates = true;
          } catch (error) {
            console.error('更新A股持仓收益失败:', error);
          }
        }
      }
    }

    if (hasUpdates) {
      setLastDbUpdate(new Date());
    }
  };

  /**
   * 手动刷新A股收益到数据库
   */
  const handleRefreshAStockProfit = async () => {
    setIsRefreshing(true);
    try {
      await updateAStockProfitToDb();
    } catch (error) {
      console.error('刷新A股收益失败:', error);
    } finally {
      setIsRefreshing(false);
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
  /**
   * 初始加载
   */
  useEffect(() => {
    loadPortfolio();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nasdaq.currentPrice, gold.currentPrice, supabasePositions, aStockData]);

  /**
   * 每10秒自动更新黄金收益到数据库
   */
  useEffect(() => {
    if (!isSupabaseEnabled || !portfolio) {
      return;
    }

    // 设置定时器，每10秒执行一次（不立即执行，避免频繁更新）
    const intervalId = setInterval(() => {
      updateGoldProfitToDb();
    }, 10000); // 10秒

    // 清理定时器
    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gold.currentPrice, isSupabaseEnabled]); // 移除 portfolio 依赖，只在价格变化时重置定时器

  /**
   * 智能更新A股收益到数据库
   * - 交易时间内（工作日 9:30-15:00）：每2分钟更新一次
   * - 收盘后（15:00-15:30）：每5分钟更新一次
   * - 其他时间：不更新
   */
  useEffect(() => {
    if (!isSupabaseEnabled || !portfolio || aStockData.size === 0) {
      return;
    }

    const checkAndUpdate = () => {
      const now = new Date();
      const day = now.getDay();
      const hour = now.getHours();
      const minute = now.getMinutes();
      const currentTime = hour * 60 + minute;

      // 周末不更新
      if (day === 0 || day === 6) {
        return null;
      }

      // 交易时间内（9:30-15:00）：每2分钟更新
      const marketOpen = 9 * 60 + 30; // 9:30
      const marketClose = 15 * 60; // 15:00
      const afterMarketClose = 15 * 60 + 30; // 15:30

      if (currentTime >= marketOpen && currentTime < marketClose) {
        // 交易时间内：2分钟更新一次
        return 2 * 60 * 1000;
      } else if (currentTime >= marketClose && currentTime < afterMarketClose) {
        // 收盘后30分钟内：5分钟更新一次
        return 5 * 60 * 1000;
      }

      // 其他时间不更新
      return null;
    };

    const setupNextUpdate = () => {
      const interval = checkAndUpdate();
      if (interval) {
        const intervalId = setInterval(() => {
          updateAStockProfitToDb();
        }, interval);
        return intervalId;
      }
      return null;
    };

    let intervalId = setupNextUpdate();

    // 每分钟检查一次是否需要调整更新间隔
    const checkIntervalId = setInterval(() => {
      if (intervalId) {
        clearInterval(intervalId);
      }
      intervalId = setupNextUpdate();
    }, 60 * 1000);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
      clearInterval(checkIntervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aStockData.size, isSupabaseEnabled]); // 当A股数据变化或启用状态变化时重置定时器

  /**
   * 添加持仓
   */
  const handleAddPosition = async (position: Omit<Position, 'id'>) => {
    try {
      if (isSupabaseEnabled) {
        // 使用 Supabase
        await addSupabasePosition(position);
      } else {
        // 使用本地存储
        portfolioService.addPosition(position);
      }
      loadPortfolio();
    } catch (error) {
      console.error('添加持仓失败:', error);
      alert('添加持仓失败：' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  /**
   * 编辑持仓
   */
  const handleEditPosition = async (id: string, updates: Partial<Position>) => {
    try {
      if (isSupabaseEnabled) {
        // 使用 Supabase
        await updateSupabasePosition(id, updates);
      } else {
        // 使用本地存储
        portfolioService.updatePosition(id, updates);
      }
      loadPortfolio();
      setSelectedPosition(null);
    } catch (error) {
      console.error('更新持仓失败:', error);
      alert('更新持仓失败：' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  /**
   * 删除持仓
   */
  const handleDeletePosition = async (id: string) => {
    try {
      if (isSupabaseEnabled) {
        // 使用 Supabase
        await deleteSupabasePosition(id);
      } else {
        // 使用本地存储
        portfolioService.deletePosition(id);
      }
      loadPortfolio();
    } catch (error) {
      console.error('删除持仓失败:', error);
      alert('删除持仓失败：' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  /**
   * 导出投资组合
   */
  const handleExport = () => {
    let jsonData: string;
    
    if (isSupabaseEnabled) {
      // 使用 Supabase 导出
      jsonData = exportSupabasePositions();
    } else {
      // 使用本地存储导出
      jsonData = portfolioService.exportPortfolio();
    }
    
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

  // 根据Tab过滤持仓
  const filteredPositions = portfolio?.positions.filter(pos => {
    if (activeTab === 'all') return true;
    return pos.assetType === activeTab;
  }) || [];

  // 计算分类统计
  const getAssetStats = (assetType: 'nasdaq' | 'gold' | 'astock' | 'all') => {
    if (!portfolio) return null;
    
    if (assetType === 'all') {
      return {
        totalInvestment: portfolio.totalInvestment,
        currentValue: portfolio.currentValue,
        totalProfitLoss: portfolio.totalProfitLoss,
        totalProfitLossPercent: portfolio.totalProfitLossPercent
      };
    }
    
    const positions = portfolio.positions.filter(p => p.assetType === assetType);
    const totalInvestment = positions.reduce((sum, p) => sum + p.investmentAmount, 0);
    const currentValue = positions.reduce((sum, p) => sum + (p.currentValue || p.investmentAmount), 0);
    const totalProfitLoss = currentValue - totalInvestment;
    const totalProfitLossPercent = totalInvestment > 0 ? (totalProfitLoss / totalInvestment) * 100 : 0;
    
    return {
      totalInvestment,
      currentValue,
      totalProfitLoss,
      totalProfitLossPercent
    };
  };

  const currentStats = getAssetStats(summaryTab);

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
                to="/home"
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
                {isSupabaseEnabled && (
                  <span className="ml-3 px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                    云端同步
                  </span>
                )}
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

      {/* 迁移提示 */}
      {isSupabaseEnabled && showMigration && (
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <MigrationPrompt onMigrationComplete={() => {
            setShowMigration(false);
            refetchSupabase();
          }} />
        </div>
      )}

      {/* Supabase 错误提示 */}
      {supabaseError && (
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start">
              <svg className="h-5 w-5 text-red-600 dark:text-red-500 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-300">
                  数据同步错误
                </h3>
                <div className="mt-2 text-sm text-red-700 dark:text-red-400">
                  {supabaseError}
                </div>
              </div>
              <button
                onClick={() => refetchSupabase()}
                className="ml-3 px-3 py-1.5 text-xs font-medium text-red-800 dark:text-red-300 bg-red-100 dark:bg-red-900/40 rounded hover:bg-red-200 dark:hover:bg-red-900/60 transition-colors"
              >
                重试
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 加载状态 */}
      {supabaseLoading && (
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="animate-spin h-5 w-5 text-blue-600 dark:text-blue-400 mr-3" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-sm text-blue-800 dark:text-blue-300">
                正在从云端加载数据...
              </span>
            </div>
          </div>
        </div>
      )}

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
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>价格更新: {lastPriceUpdate.toLocaleString('zh-CN')}</span>
              </div>
              {lastDbUpdate && isSupabaseEnabled && (
                <div className="flex items-center space-x-2">
                  <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>数据库同步: {lastDbUpdate.toLocaleString('zh-CN')}</span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {isSupabaseEnabled && portfolio.positions.some(p => p.assetType === 'gold') && (
                <button
                  onClick={handleRefreshGoldProfit}
                  disabled={isRefreshing}
                  className="flex items-center space-x-1 px-3 py-1.5 text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors disabled:opacity-50"
                  title="更新黄金收益到数据库"
                >
                  <svg className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>{isRefreshing ? '同步中' : '同步黄金'}</span>
                </button>
              )}
              {isSupabaseEnabled && portfolio.positions.some(p => p.assetType === 'astock') && (
                <button
                  onClick={handleRefreshAStockProfit}
                  disabled={isRefreshing}
                  className="flex items-center space-x-1 px-3 py-1.5 text-xs text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors disabled:opacity-50"
                  title="更新A股收益到数据库"
                >
                  <svg className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>{isRefreshing ? '同步中' : '同步A股'}</span>
                </button>
              )}
              <button
                onClick={handleRefreshPrices}
                disabled={isRefreshing}
                className="flex items-center space-x-1 px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 bg-white/60 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded hover:bg-white/80 dark:hover:bg-gray-800/80 transition-colors disabled:opacity-50"
              >
                <svg className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>{isRefreshing ? '刷新中' : '刷新价格'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* 左侧：总览和图表 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 投资组合总览 - 添加Tab切换 */}
            {portfolio && (
              <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/20 overflow-hidden">
                {/* Tab导航 */}
                <div className="flex border-b border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setSummaryTab('all')}
                    className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                      summaryTab === 'all'
                        ? 'text-green-600 dark:text-green-400 border-b-2 border-green-600 dark:border-green-400 bg-green-50/50 dark:bg-green-900/20'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                  >
                    全部资产
                  </button>
                  <button
                    onClick={() => setSummaryTab('nasdaq')}
                    className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                      summaryTab === 'nasdaq'
                        ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50/50 dark:bg-blue-900/20'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                  >
                    纳斯达克100
                  </button>
                  <button
                    onClick={() => setSummaryTab('astock')}
                    className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                      summaryTab === 'astock'
                        ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400 bg-purple-50/50 dark:bg-purple-900/20'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                  >
                    A股基金
                  </button>
                  <button
                    onClick={() => setSummaryTab('gold')}
                    className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                      summaryTab === 'gold'
                        ? 'text-yellow-600 dark:text-yellow-400 border-b-2 border-yellow-600 dark:border-yellow-400 bg-yellow-50/50 dark:bg-yellow-900/20'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                  >
                    现货黄金
                  </button>
                </div>
                
                {/* 统计数据 */}
                <div className="p-6">
                  {currentStats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">总投资</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          ¥{currentStats.totalInvestment.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">当前市值</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          ¥{currentStats.currentValue.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">总盈亏</p>
                        <p className={`text-2xl font-bold ${
                          currentStats.totalProfitLoss >= 0 
                            ? 'text-red-600 dark:text-red-400' 
                            : 'text-green-600 dark:text-green-400'
                        }`}>
                          {currentStats.totalProfitLoss >= 0 ? '+' : ''}¥{currentStats.totalProfitLoss.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">收益率</p>
                        <p className={`text-2xl font-bold ${
                          currentStats.totalProfitLossPercent >= 0 
                            ? 'text-red-600 dark:text-red-400' 
                            : 'text-green-600 dark:text-green-400'
                        }`}>
                          {currentStats.totalProfitLossPercent >= 0 ? '+' : ''}{currentStats.totalProfitLossPercent.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 图表 */}
            {portfolio && portfolio.positions.length > 0 && (
              <PortfolioChart portfolio={portfolio} history={history} />
            )}

            {/* 持仓列表 - 添加Tab切换 */}
            <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/20 overflow-hidden">
              {/* Tab导航 */}
              <div className="flex border-b border-gray-200 dark:border-gray-700 px-6 pt-6">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-4 py-2 text-sm font-medium transition-colors rounded-t-lg ${
                    activeTab === 'all'
                      ? 'text-green-600 dark:text-green-400 bg-white dark:bg-gray-700 border-t border-l border-r border-gray-200 dark:border-gray-600'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  全部 ({portfolio?.positions.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab('nasdaq')}
                  className={`px-4 py-2 text-sm font-medium transition-colors rounded-t-lg ml-2 ${
                    activeTab === 'nasdaq'
                      ? 'text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-700 border-t border-l border-r border-gray-200 dark:border-gray-600'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  纳斯达克 ({portfolio?.positions.filter(p => p.assetType === 'nasdaq').length || 0})
                </button>
                <button
                  onClick={() => setActiveTab('astock')}
                  className={`px-4 py-2 text-sm font-medium transition-colors rounded-t-lg ml-2 ${
                    activeTab === 'astock'
                      ? 'text-purple-600 dark:text-purple-400 bg-white dark:bg-gray-700 border-t border-l border-r border-gray-200 dark:border-gray-600'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  A股 ({portfolio?.positions.filter(p => p.assetType === 'astock').length || 0})
                </button>
                <button
                  onClick={() => setActiveTab('gold')}
                  className={`px-4 py-2 text-sm font-medium transition-colors rounded-t-lg ml-2 ${
                    activeTab === 'gold'
                      ? 'text-yellow-600 dark:text-yellow-400 bg-white dark:bg-gray-700 border-t border-l border-r border-gray-200 dark:border-gray-600'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  黄金 ({portfolio?.positions.filter(p => p.assetType === 'gold').length || 0})
                </button>
                <div className="flex-1"></div>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="flex items-center px-4 py-2 bg-green-500 dark:bg-green-600 text-white rounded-lg hover:bg-green-600 dark:hover:bg-green-700 transition-colors shadow-sm mb-2"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  添加持仓
                </button>
              </div>
              
              <div className="p-6">
                {portfolio && (
                  <PositionList
                    positions={filteredPositions}
                    onEdit={(position) => {
                      setSelectedPosition(position);
                      setIsEditModalOpen(true);
                    }}
                    onDelete={handleDeletePosition}
                  />
                )}
              </div>
            </div>
          </div>

          {/* 右侧：统计信息 */}
          <div className="space-y-6">
            {/* 黄金持仓总览 */}
            {portfolio && (() => {
              const goldStats = portfolioService.getGoldStats(portfolio);
              return goldStats.count > 0 ? <GoldSummary goldStats={goldStats} /> : null;
            })()}

            {/* 统计卡片 - 按资产类型区分 */}
            {portfolio && portfolio.positions.length > 0 && (
              <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/20 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  统计信息
                </h2>
                <div className="space-y-6">
                  {/* 总体统计 */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">总体</h3>
                    <div className="space-y-2">
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
                              <span className="font-semibold text-red-600 dark:text-red-400">
                                {stats.profitablePositions}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600 dark:text-gray-400">亏损持仓</span>
                              <span className="font-semibold text-green-600 dark:text-green-400">
                                {stats.losingPositions}
                              </span>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  {/* 纳斯达克统计 */}
                  {(() => {
                    const nasdaqStats = portfolioService.getNasdaqStats(portfolio);
                    return nasdaqStats.count > 0 ? (
                      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <h3 className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-3">纳斯达克100</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">持仓数</span>
                            <span className="font-semibold text-gray-900 dark:text-gray-100">
                              {nasdaqStats.count}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">投资金额</span>
                            <span className="font-semibold text-gray-900 dark:text-gray-100">
                              ¥{nasdaqStats.investment.toLocaleString('zh-CN', { maximumFractionDigits: 0 })}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">当前市值</span>
                            <span className="font-semibold text-gray-900 dark:text-gray-100">
                              ¥{nasdaqStats.currentValue.toLocaleString('zh-CN', { maximumFractionDigits: 0 })}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">盈亏</span>
                            <span className={`font-semibold ${
                              nasdaqStats.profitLoss >= 0 
                                ? 'text-red-600 dark:text-red-400' 
                                : 'text-green-600 dark:text-green-400'
                            }`}>
                              {nasdaqStats.profitLoss >= 0 ? '+' : ''}¥{nasdaqStats.profitLoss.toLocaleString('zh-CN', { maximumFractionDigits: 0 })}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : null;
                  })()}

                  {/* 黄金统计 */}
                  {(() => {
                    const goldStats = portfolioService.getGoldStats(portfolio);
                    return goldStats.count > 0 ? (
                      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <h3 className="text-sm font-medium text-yellow-600 dark:text-yellow-400 mb-3">现货黄金</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">持仓数</span>
                            <span className="font-semibold text-gray-900 dark:text-gray-100">
                              {goldStats.count}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">总克数</span>
                            <span className="font-semibold text-gray-900 dark:text-gray-100">
                              {goldStats.totalGrams.toFixed(2)}g
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">投资金额</span>
                            <span className="font-semibold text-gray-900 dark:text-gray-100">
                              ¥{goldStats.investment.toLocaleString('zh-CN', { maximumFractionDigits: 0 })}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">当前市值</span>
                            <span className="font-semibold text-gray-900 dark:text-gray-100">
                              ¥{goldStats.currentValue.toLocaleString('zh-CN', { maximumFractionDigits: 0 })}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">盈亏</span>
                            <span className={`font-semibold ${
                              goldStats.profitLoss >= 0 
                                ? 'text-red-600 dark:text-red-400' 
                                : 'text-green-600 dark:text-green-400'
                            }`}>
                              {goldStats.profitLoss >= 0 ? '+' : ''}¥{goldStats.profitLoss.toLocaleString('zh-CN', { maximumFractionDigits: 0 })}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : null;
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
