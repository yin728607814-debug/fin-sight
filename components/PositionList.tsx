/**
 * 持仓列表组件
 * 显示所有投资持仓
 */

import React from 'react';
import { Position } from '../services/portfolioService';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

/**
 * 持仓列表Props
 */
interface PositionListProps {
  positions: Position[];
  onEdit: (position: Position) => void;
  onDelete: (id: string) => void;
}

/**
 * 持仓列表组件
 */
export const PositionList: React.FC<PositionListProps> = ({
  positions,
  onEdit,
  onDelete
}) => {
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
   * 格式化日期
   */
  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('zh-CN');
  };

  if (positions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 dark:text-gray-500 mb-2">
          <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <p className="text-gray-600 dark:text-gray-400">暂无持仓</p>
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">点击"添加持仓"开始记录您的投资</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {positions.map((position) => {
        const isProfitable = (position.profitLoss || 0) >= 0;
        
        return (
          <div
            key={position.id}
            className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all"
          >
            {/* 头部 */}
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  {position.assetName}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  买入日期: {formatDate(position.buyDate)}
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => onEdit(position)}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
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
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                  title="删除"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* 数据网格 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">数量</div>
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {position.quantity}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">买入价格</div>
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  ${formatCurrency(position.buyPrice)}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">当前价格</div>
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  ${formatCurrency(position.currentPrice || position.buyPrice)}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">当前价值</div>
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  ${formatCurrency(position.currentValue || (position.quantity * position.buyPrice))}
                </div>
              </div>
            </div>

            {/* 盈亏 */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">盈亏</span>
                <div className="text-right">
                  <div className={`font-bold ${
                    isProfitable
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {isProfitable ? '+' : ''}${formatCurrency(Math.abs(position.profitLoss || 0))}
                  </div>
                  <div className={`text-sm ${
                    isProfitable
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {isProfitable ? '+' : ''}{(position.profitLossPercent || 0).toFixed(2)}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
