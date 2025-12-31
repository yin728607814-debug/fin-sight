/**
 * 增强的持仓卡片组件
 * 显示详细的持仓信息，包括收益、定投状态等
 */

import React from 'react';
import { PencilIcon, TrashIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';
import { Position } from '../services/portfolioService';

/**
 * 增强持仓卡片Props
 */
interface EnhancedPositionCardProps {
  position: Position;
  onEdit: (position: Position) => void;
  onDelete: (id: string) => void;
}

/**
 * 增强持仓卡片组件
 */
export const EnhancedPositionCard: React.FC<EnhancedPositionCardProps> = ({
  position,
  onEdit,
  onDelete
}) => {
  const isProfitable = (position.profitLoss || 0) >= 0;
  // 中国股市习惯：红涨绿跌
  const profitColor = isProfitable ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400';
  const bgColor = isProfitable ? 'bg-red-50 dark:bg-red-900/20' : 'bg-green-50 dark:bg-green-900/20';

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
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-5 hover:shadow-lg transition-shadow">
      {/* 头部：资产名称和操作按钮 */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {position.assetName}
            </h3>
            {position.autoInvest?.enabled && (
              <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                定投中
              </span>
            )}
          </div>
          {position.assetType === 'nasdaq' && position.fundName && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {position.fundName}
            </p>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onEdit(position)}
            className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            title="编辑"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => onDelete(position.id)}
            className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            title="删除"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* 基本信息 */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* 持仓金额 */}
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">持仓金额</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {formatCurrency(position.investmentAmount)}
          </p>
        </div>

        {/* 当前市值 */}
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">当前市值</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {position.currentValue ? formatCurrency(position.currentValue) : '-'}
          </p>
        </div>

        {/* 黄金特有：克数和均价 */}
        {position.assetType === 'gold' && position.quantity && position.averageBuyPrice && (
          <>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">持仓克数</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {position.quantity.toFixed(2)} 克
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">持仓均价</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {formatCurrency(position.averageBuyPrice)}/克
              </p>
            </div>
          </>
        )}
      </div>

      {/* 收益信息 */}
      <div className={`p-3 rounded-lg ${bgColor} mb-4`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">持仓收益</span>
          <div className="flex items-center space-x-1">
            {isProfitable ? (
              <ArrowTrendingUpIcon className={`h-4 w-4 ${profitColor}`} />
            ) : (
              <ArrowTrendingDownIcon className={`h-4 w-4 ${profitColor}`} />
            )}
            <span className={`text-lg font-bold ${profitColor}`}>
              {formatCurrency(Math.abs(position.profitLoss))}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600 dark:text-gray-400">收益率</span>
          <span className={`text-sm font-semibold ${profitColor}`}>
            {position.profitLossPercent !== undefined ? formatPercent(position.profitLossPercent) : '-'}
          </span>
        </div>

        {/* 纳斯达克特有：当日收益 */}
        {position.assetType === 'nasdaq' && position.dailyProfitLoss !== undefined && position.dailyChange !== undefined && (
          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600 dark:text-gray-400">当日收益</span>
              <div className="text-right">
                <span className={`text-sm font-semibold ${position.dailyProfitLoss >= 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                  {position.dailyProfitLoss >= 0 ? '+' : ''}
                  {formatCurrency(Math.abs(position.dailyProfitLoss))}
                </span>
                <span className={`text-xs ml-1 ${position.dailyChange >= 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                  ({position.dailyChange >= 0 ? '+' : ''}{formatPercent(position.dailyChange)})
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 底部信息 */}
      {position.autoInvest?.enabled && position.autoInvest.nextDate && (
        <div className="text-xs text-blue-600 dark:text-blue-400">
          下次定投: {new Date(position.autoInvest.nextDate).toLocaleDateString('zh-CN')} · 
          ¥{position.autoInvest.amount.toLocaleString()} · 
          {position.autoInvest.frequency === 'weekly' && '每周'}
          {position.autoInvest.frequency === 'monthly' && '每月'}
          {position.autoInvest.frequency === 'quarterly' && '每季度'}
        </div>
      )}
    </div>
  );
};
