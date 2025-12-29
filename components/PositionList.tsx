/**
 * 持仓列表组件
 * 显示所有投资持仓
 */

import React from 'react';
import { Position } from '../services/portfolioService';
import { EnhancedPositionCard } from './EnhancedPositionCard';

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
      {positions.map((position) => (
        <EnhancedPositionCard
          key={position.id}
          position={position}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};
