/**
 * 仪表盘卡片容器组件
 */

import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface DashboardCardProps {
  title: string;
  children: React.ReactNode;
  onRemove?: () => void;
  className?: string;
}

/**
 * 仪表盘卡片容器
 */
export const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  children,
  onRemove,
  className = '',
}) => {
  return (
    <div className={`h-full flex flex-col bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-xl shadow-lg border border-white/20 dark:border-gray-700/20 overflow-hidden ${className}`}>
      {/* 卡片头部 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200/50 dark:border-gray-700/50">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h3>
        {onRemove && (
          <button
            onClick={onRemove}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            title="移除卡片"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        )}
      </div>
      
      {/* 卡片内容 */}
      <div className="flex-1 overflow-auto p-4">
        {children}
      </div>
    </div>
  );
};
