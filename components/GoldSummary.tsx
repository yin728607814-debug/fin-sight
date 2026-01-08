/**
 * 黄金持仓总览组件
 * 显示黄金持仓的汇总信息，包括总克数、均价、当前价格和总收益
 */

import React from 'react';
import { GoldStats } from '../types';

/**
 * 黄金总览Props
 */
interface GoldSummaryProps {
  goldStats: GoldStats;
}

/**
 * 黄金持仓总览组件
 */
export const GoldSummary: React.FC<GoldSummaryProps> = ({ goldStats }) => {
  const isProfitable = goldStats.profitLoss >= 0;
  // 中国股市习惯：红涨绿跌
  const profitColor = isProfitable ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400';

  /**
   * 格式化货币
   */
  const formatCurrency = (value: number): string => {
    return `¥${value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  /**
   * 格式化百分比
   */
  const formatPercent = (value: number): string => {
    const percent = goldStats.investment > 0 ? (value / goldStats.investment) * 100 : 0;
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
  };

  if (goldStats.count === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-2xl shadow-lg border border-yellow-200 dark:border-yellow-800 p-6">
      {/* 标题 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
          <svg className="h-5 w-5 mr-2 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
          </svg>
          黄金持仓总览
        </h3>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {goldStats.count} 笔持仓
        </span>
      </div>

      {/* 数据网格 */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* 总克数 */}
        <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">持仓总克数</p>
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {goldStats.totalGrams.toLocaleString('zh-CN', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
            <span className="text-sm font-normal text-gray-500 ml-1">克</span>
          </p>
        </div>

        {/* 均价 */}
        <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">持仓均价</p>
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {formatCurrency(goldStats.averagePrice)}
            <span className="text-sm font-normal text-gray-500">/克</span>
          </p>
        </div>

        {/* 当前价格 */}
        <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">当前价格</p>
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {goldStats.currentPrice > 0 ? formatCurrency(goldStats.currentPrice) : '-'}
            {goldStats.currentPrice > 0 && <span className="text-sm font-normal text-gray-500">/克</span>}
          </p>
        </div>

        {/* 总投资 */}
        <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">总投资</p>
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {formatCurrency(goldStats.investment)}
          </p>
        </div>
      </div>

      {/* 收益信息 */}
      <div className="bg-white/70 dark:bg-gray-800/70 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">总收益</span>
          <div className="text-right">
            <div className={`text-2xl font-bold ${profitColor}`}>
              {isProfitable ? '+' : ''}{formatCurrency(Math.abs(goldStats.profitLoss))}
            </div>
            <div className={`text-sm font-semibold ${profitColor}`}>
              {formatPercent(goldStats.profitLoss)}
            </div>
          </div>
        </div>
        
        {/* 价格差异 */}
        {goldStats.currentPrice > 0 && (
          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
            <span>价格差异</span>
            <span className={profitColor}>
              {isProfitable ? '+' : ''}{formatCurrency(Math.abs(goldStats.currentPrice - goldStats.averagePrice))}/克
            </span>
          </div>
        )}
      </div>

      {/* 提示信息 */}
      <div className="mt-4 p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
        <p className="text-xs text-yellow-800 dark:text-yellow-300">
          💡 价格单位为人民币/克，收益基于持仓均价和当前价格计算
        </p>
      </div>
    </div>
  );
};
