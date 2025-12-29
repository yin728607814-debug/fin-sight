/**
 * 增强的持仓卡片组件
 * 显示详细的持仓信息，包括收益、持有天数、定投状态等
 */

import React from 'react';
import { PencilIcon, TrashIcon, ClockIcon, CalendarIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';
import { Position } from '../services/portfolioService';

/**
 * 增强持仓卡片Props
 */
interface EnhancedPositionCardProps {
  position: Position;
  onEdit: (position: Position) => void;
  onDelete: (id: string) => void;
  dailyReturn?: number;
}

/**
 * 增强持仓卡片组件
 */
export const EnhancedPositionCard: React.FC<EnhancedPositionCardProps> = ({
  position,
  onEdit,
  onDelete,
  dailyReturn
}) => {
  const isProfitable = (position.profitLoss || 0) >= 0;
  const profitColor = isProfitable ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  const bgColor = isProfitable ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20';

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
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {position.fundName || position.assetName}
            </h3>
            {position.autoInvest?.enabled && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                定投中
              </span>
            )}
          </div>
          {position.fundCode && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              代码: {position.fundCode}
            </p>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            {position.assetType === 'gold' ? '现货黄金' : '纳斯达克100基金'}
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => onEdit(position)}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            title="编辑"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              if (window.confirm('确定要删除这个持仓吗？')) {
                onDelete(position.id);
              }
            }}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            title="删除"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 持仓信息网格 */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* 持仓数量 */}
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            {position.assetType === 'gold' ? '持仓克数' : '持仓份额'}
          </p>
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {position.quantity.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
            {position.assetType === 'gold' ? ' 克' : ' 份'}
          </p>
        </div>

        {/* 买入价格 */}
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">买入价格</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {formatCurrency(position.buyPrice)}
            {position.assetType === 'gold' && <span className="text-xs text-gray-500">/克</span>}
          </p>
        </div>

        {/* 持仓金额 */}
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">持仓金额</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {formatCurrency(position.investmentAmount || (position.quantity * position.buyPrice))}
          </p>
        </div>

        {/* 当前市值 */}
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">当前市值</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {position.currentValue ? formatCurrency(position.currentValue) : '-'}
          </p>
        </div>
      </div>

      {/* 收益信息 */}
      <div className={`p-3 rounded-lg ${bgColor} mb-4`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">持有收益</span>
          <div className="flex items-center space-x-1">
            {isProfitable ? (
              <ArrowTrendingUpIcon className={`h-4 w-4 ${profitColor}`} />
            ) : (
              <ArrowTrendingDownIcon className={`h-4 w-4 ${profitColor}`} />
            )}
            <span className={`text-lg font-bold ${profitColor}`}>
              {position.profitLoss ? formatCurrency(Math.abs(position.profitLoss)) : '-'}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600 dark:text-gray-400">收益率</span>
          <span className={`text-sm font-semibold ${profitColor}`}>
            {position.profitLossPercent !== undefined ? formatPercent(position.profitLossPercent) : '-'}
          </span>
        </div>
        {dailyReturn !== undefined && (
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-gray-600 dark:text-gray-400">日收益</span>
            <span className={`text-sm font-semibold ${dailyReturn >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatPercent(dailyReturn)}
            </span>
          </div>
        )}
        {position.annualizedReturn !== undefined && position.annualizedReturn !== 0 && (
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-gray-600 dark:text-gray-400">年化收益率</span>
            <span className={`text-sm font-semibold ${profitColor}`}>
              {formatPercent(position.annualizedReturn)}
            </span>
          </div>
        )}
      </div>

      {/* 底部信息 */}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <CalendarIcon className="h-3.5 w-3.5 mr-1" />
            <span>{new Date(position.buyDate).toLocaleDateString('zh-CN')}</span>
          </div>
          <div className="flex items-center">
            <ClockIcon className="h-3.5 w-3.5 mr-1" />
            <span>持有 {position.holdingDays || 0} 天</span>
          </div>
        </div>
        {position.autoInvest?.enabled && position.autoInvest.nextDate && (
          <div className="text-blue-600 dark:text-blue-400">
            下次: {new Date(position.autoInvest.nextDate).toLocaleDateString('zh-CN')}
          </div>
        )}
      </div>
    </div>
  );
};
