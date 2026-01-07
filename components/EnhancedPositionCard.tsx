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
          {/* 纳斯达克基金和A股基金：基金名称为主标题 */}
          {(position.assetType === 'nasdaq' || position.assetType === 'astock') && position.fundName ? (
            <>
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1.5">
                {position.fundName}
              </h3>
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded border ${
                  position.assetType === 'nasdaq' 
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                    : 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800'
                }`}>
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                  </svg>
                  {position.assetType === 'nasdaq' ? '纳斯达克100' : 'A股基金'}
                </span>
                {position.autoInvest?.enabled && (
                  <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded border border-green-300 dark:border-green-700">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    定投中
                  </span>
                )}
              </div>
            </>
          ) : (
            /* 黄金或其他资产：资产名称为主标题 */
            <>
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1.5">
                {position.assetName}
              </h3>
              <div className="flex items-center space-x-2">
                {position.assetType === 'gold' && (
                  <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded border bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                    </svg>
                    现货黄金
                  </span>
                )}
                {position.autoInvest?.enabled && (
                  <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded border border-green-300 dark:border-green-700">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    定投中
                  </span>
                )}
              </div>
            </>
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

        {/* 纳斯达克和A股基金：当日收益 */}
        {(position.assetType === 'nasdaq' || position.assetType === 'astock') && position.dailyProfitLoss !== undefined && position.dailyChange !== undefined && (
          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-600 dark:text-gray-400">当日收益</span>
              <span className={`text-sm font-semibold ${position.dailyProfitLoss >= 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                {position.dailyProfitLoss >= 0 ? '+' : ''}
                {formatCurrency(Math.abs(position.dailyProfitLoss))}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600 dark:text-gray-400">当天收益率</span>
              <span className={`text-sm font-bold ${position.dailyChange >= 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                {position.dailyChange >= 0 ? '+' : ''}{position.dailyChange.toFixed(2)}%
              </span>
            </div>
            {position.assetType === 'nasdaq' && (
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 italic">
                * QDII基金估值仅供参考
              </div>
            )}
          </div>
        )}
      </div>

      {/* 底部信息 */}
      {position.autoInvest?.enabled && position.autoInvest.nextDate && (
        <div className="text-xs text-blue-600 dark:text-blue-400">
          下次定投: {new Date(position.autoInvest.nextDate).toLocaleDateString('zh-CN')} · 
          ¥{position.autoInvest.amount.toLocaleString()} · 
          {position.autoInvest.frequency === 'daily' && '每天'}
          {position.autoInvest.frequency === 'weekly' && '每周'}
          {position.autoInvest.frequency === 'monthly' && '每月'}
          {position.autoInvest.frequency === 'quarterly' && '每季度'}
        </div>
      )}
    </div>
  );
};
