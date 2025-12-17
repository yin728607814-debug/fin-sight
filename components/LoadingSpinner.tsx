/**
 * LoadingSpinner组件 - 加载动画指示器
 * 提供不同大小的加载动画效果
 */

import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  color?: 'blue' | 'white' | 'gray';
}

/**
 * 加载动画组件
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className = '',
  color = 'blue'
}) => {
  /**
   * 获取尺寸样式
   */
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-4 h-4';
      case 'md':
        return 'w-6 h-6';
      case 'lg':
        return 'w-8 h-8';
      case 'xl':
        return 'w-12 h-12';
      default:
        return 'w-6 h-6';
    }
  };

  /**
   * 获取颜色样式
   */
  const getColorClasses = () => {
    switch (color) {
      case 'blue':
        return 'text-blue-600';
      case 'white':
        return 'text-white';
      case 'gray':
        return 'text-gray-600';
      default:
        return 'text-blue-600';
    }
  };

  return (
    <div className={`inline-block ${getSizeClasses()} ${getColorClasses()} ${className}`}>
      <svg 
        className="animate-spin" 
        fill="none" 
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle 
          className="opacity-25" 
          cx="12" 
          cy="12" 
          r="10" 
          stroke="currentColor" 
          strokeWidth="4"
        />
        <path 
          className="opacity-75" 
          fill="currentColor" 
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  );
};

/**
 * 带文本的加载指示器
 */
export const LoadingSpinnerWithText: React.FC<{
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ 
  text = '加载中...', 
  size = 'md',
  className = ''
}) => {
  return (
    <div className={`flex items-center justify-center space-x-2 ${className}`}>
      <LoadingSpinner size={size} />
      <span className="text-slate-600">{text}</span>
    </div>
  );
};

/**
 * 全屏加载遮罩
 */
export const LoadingOverlay: React.FC<{
  text?: string;
  show: boolean;
}> = ({ 
  text = '加载中...', 
  show 
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 shadow-xl">
        <LoadingSpinnerWithText text={text} size="lg" />
      </div>
    </div>
  );
};

/**
 * 页面级加载指示器
 */
export const PageLoading: React.FC<{
  text?: string;
}> = ({ 
  text = '页面加载中...' 
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <LoadingSpinner size="xl" className="mx-auto mb-4" />
        <p className="text-lg text-slate-600">{text}</p>
      </div>
    </div>
  );
};

/**
 * 卡片内加载指示器
 */
export const CardLoading: React.FC<{
  text?: string;
  height?: string;
}> = ({ 
  text = '加载中...', 
  height = 'h-32' 
}) => {
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-slate-200 ${height} flex items-center justify-center`}>
      <LoadingSpinnerWithText text={text} />
    </div>
  );
};

/**
 * 按钮内加载指示器
 */
export const ButtonLoading: React.FC<{
  text?: string;
}> = ({ 
  text = '处理中...' 
}) => {
  return (
    <div className="flex items-center space-x-2">
      <LoadingSpinner size="sm" color="white" />
      <span>{text}</span>
    </div>
  );
};

/**
 * 表格行加载指示器
 */
export const TableRowLoading: React.FC<{
  columns: number;
}> = ({ columns }) => {
  return (
    <tr>
      <td colSpan={columns} className="px-6 py-4 text-center">
        <LoadingSpinnerWithText text="加载数据中..." />
      </td>
    </tr>
  );
};

/**
 * 脉冲加载动画（骨架屏效果）
 */
export const PulseLoading: React.FC<{
  className?: string;
}> = ({ className = '' }) => {
  return (
    <div className={`animate-pulse bg-slate-200 rounded ${className}`} />
  );
};

/**
 * 新闻卡片骨架屏
 */
export const NewsCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 animate-pulse">
      <div className="flex items-start space-x-4">
        <div className="flex-1 space-y-3">
          <div className="flex items-center space-x-2">
            <PulseLoading className="h-4 w-16" />
            <PulseLoading className="h-4 w-20" />
          </div>
          <PulseLoading className="h-5 w-3/4" />
          <div className="space-y-2">
            <PulseLoading className="h-4 w-full" />
            <PulseLoading className="h-4 w-5/6" />
            <PulseLoading className="h-4 w-4/6" />
          </div>
        </div>
        <PulseLoading className="h-16 w-24" />
      </div>
    </div>
  );
};

/**
 * 图表骨架屏
 */
export const ChartSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 animate-pulse">
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="text-center space-y-2">
              <PulseLoading className="h-6 w-16 mx-auto" />
              <PulseLoading className="h-4 w-12 mx-auto" />
            </div>
          ))}
        </div>
        <PulseLoading className="h-80 w-full" />
      </div>
    </div>
  );
};