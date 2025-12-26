/**
 * 投资组合总览组件
 * 显示投资组合的总体统计信息
 */

import React from 'react';
import { Portfolio } from '../services/portfolioService';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';

/**
 * 投资组合总览Props
 */
interface PortfolioSummaryProps {
  portfolio: Portfolio;
  loading?: boolean;
}

/**
 * 投资组合总览组件
 */
export const PortfolioSummary: React.FC<PortfolioSummaryProps> = ({
  portfolio,
  loading = false
}) => {
  const isProfitable = portfolio.totalProfitLoss >= 0;

  /**
   * 格式化货币
   */
  const formatCurrency = (value: number): string => {
    return value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  /**
   * 格式化百分比
   */
  const formatPercent = (value: number): string => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700 rounded-2xl p-6 text-white animate-pulse">
        <div className="h-6 bg-white/20 rounded w-32 mb-4"></div>
        <div className="h-10 bg-white/20 rounded w-48 mb-2"></div>
        <div className="h-4 bg-white/20 rounded w-24"></div>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-br ${
      isProfitable
        ? 'from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700'
        : 'from-red-500 to-rose-600 dark:from-red-600 dark:to-rose-700'
    } rounded-2xl p-6 text-white shadow-2xl`}>
      {/* 总价值 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white/80 text-sm font-medium">总价值</span>
          {isProfitable ? (
            <ArrowTrendingUpIcon className="h-5 w-5" />
          ) : (
            <ArrowTrendingDownIcon className="h-5 w-5" />
          )}
        </div>
        <div className="text-3xl font-bold">
          ${formatCurrency(portfolio.currentValue)}
        </div>
        <div className="text-white/80 text-sm mt-1">
          投资额: ${formatCurrency(portfolio.totalInvestment)}
        </div>
      </div>

      {/* 盈亏信息 */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/20">
        <div>
          <div className="text-white/80 text-xs mb-1">总盈亏</div>
          <div className="text-xl font-bold">
            ${formatCurrency(Math.abs(portfolio.totalProfitLoss))}
          </div>
        </div>
        <div>
          <div className="text-white/80 text-xs mb-1">收益率</div>
          <div className="text-xl font-bold">
            {formatPercent(portfolio.totalProfitLossPercent)}
          </div>
        </div>
      </div>

      {/* 更新时间 */}
      <div className="mt-4 pt-4 border-t border-white/20">
        <div className="text-white/60 text-xs">
          更新于 {new Date(portfolio.lastUpdated).toLocaleString('zh-CN')}
        </div>
      </div>
    </div>
  );
};
