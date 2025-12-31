/**
 * LoadingSpinner组件 - 加载动画指示器
 * 提供不同大小和样式的加载动画效果
 */

import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  color?: 'blue' | 'white' | 'gray' | 'gradient';
  variant?: 'spinner' | 'dots' | 'pulse' | 'ring';
}

/**
 * 加载动画组件 - 现代化设计
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className = '',
  color = 'blue',
  variant = 'ring'
}) => {
  /**
   * 获取尺寸样式
   */
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-4 h-4';
      case 'md':
        return 'w-8 h-8';
      case 'lg':
        return 'w-12 h-12';
      case 'xl':
        return 'w-16 h-16';
      default:
        return 'w-8 h-8';
    }
  };

  /**
   * 获取颜色样式
   */
  const getColorClasses = () => {
    switch (color) {
      case 'blue':
        return 'border-blue-500';
      case 'white':
        return 'border-white';
      case 'gray':
        return 'border-gray-400';
      case 'gradient':
        return 'border-transparent';
      default:
        return 'border-blue-500';
    }
  };

  // 渐变色环形加载器（最高端）
  if (variant === 'ring') {
    return (
      <div className={`inline-block ${getSizeClasses()} ${className}`}>
        <div className="relative w-full h-full">
          {/* 背景环 */}
          <div className="absolute inset-0 rounded-full border-2 border-gray-200 dark:border-gray-700 opacity-20"></div>
          {/* 渐变旋转环 */}
          <div 
            className="absolute inset-0 rounded-full animate-spin"
            style={{
              background: 'conic-gradient(from 0deg, transparent 0%, rgb(59, 130, 246) 100%)',
              mask: 'radial-gradient(farthest-side, transparent calc(100% - 2px), white 0)',
              WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 2px), white 0)',
              animationDuration: '1s',
              animationTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          ></div>
        </div>
      </div>
    );
  }

  // 脉冲点加载器（柔和）
  if (variant === 'pulse') {
    const dotSize = size === 'sm' ? 'w-1.5 h-1.5' : size === 'lg' ? 'w-3 h-3' : size === 'xl' ? 'w-4 h-4' : 'w-2 h-2';
    return (
      <div className={`inline-flex items-center space-x-1.5 ${className}`}>
        <div className={`${dotSize} bg-blue-500 rounded-full animate-pulse`} style={{ animationDelay: '0ms', animationDuration: '1.4s' }}></div>
        <div className={`${dotSize} bg-blue-500 rounded-full animate-pulse`} style={{ animationDelay: '200ms', animationDuration: '1.4s' }}></div>
        <div className={`${dotSize} bg-blue-500 rounded-full animate-pulse`} style={{ animationDelay: '400ms', animationDuration: '1.4s' }}></div>
      </div>
    );
  }

  // 跳动点加载器（轻盈）
  if (variant === 'dots') {
    const dotSize = size === 'sm' ? 'w-1.5 h-1.5' : size === 'lg' ? 'w-3 h-3' : size === 'xl' ? 'w-4 h-4' : 'w-2 h-2';
    return (
      <div className={`inline-flex items-center space-x-1.5 ${className}`}>
        <div className={`${dotSize} bg-blue-500 rounded-full animate-bounce`} style={{ animationDelay: '0ms' }}></div>
        <div className={`${dotSize} bg-blue-500 rounded-full animate-bounce`} style={{ animationDelay: '150ms' }}></div>
        <div className={`${dotSize} bg-blue-500 rounded-full animate-bounce`} style={{ animationDelay: '300ms' }}></div>
      </div>
    );
  }

  // 默认旋转加载器（经典但优化）
  return (
    <div className={`inline-block ${getSizeClasses()} ${getColorClasses()} ${className}`}>
      <svg 
        className="animate-spin" 
        fill="none" 
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        style={{ animationDuration: '0.8s', animationTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' }}
      >
        <circle 
          className="opacity-20" 
          cx="12" 
          cy="12" 
          r="10" 
          stroke="currentColor" 
          strokeWidth="3"
        />
        <path 
          className="opacity-90" 
          fill="currentColor" 
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  );
};

/**
 * 带文本的加载指示器 - 现代化设计
 */
export const LoadingSpinnerWithText: React.FC<{
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  variant?: 'spinner' | 'dots' | 'pulse' | 'ring';
}> = ({ 
  text = '加载中...', 
  size = 'md',
  className = '',
  variant = 'ring'
}) => {
  return (
    <div className={`flex flex-col items-center justify-center space-y-3 ${className}`}>
      <LoadingSpinner size={size} variant={variant} />
      <span className="text-sm text-gray-600 dark:text-gray-400 font-medium animate-pulse">{text}</span>
    </div>
  );
};

/**
 * 全屏加载遮罩 - 高端设计
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
    <div className="fixed inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 transition-all duration-300">
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/20 dark:border-gray-700/20">
        <LoadingSpinnerWithText text={text} size="lg" variant="ring" />
      </div>
    </div>
  );
};

/**
 * 页面级加载指示器 - 优雅设计
 */
export const PageLoading: React.FC<{
  text?: string;
}> = ({ 
  text = '页面加载中...' 
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="text-center">
        <LoadingSpinner size="xl" variant="ring" className="mx-auto mb-6" />
        <p className="text-lg text-gray-700 dark:text-gray-300 font-medium animate-pulse">{text}</p>
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