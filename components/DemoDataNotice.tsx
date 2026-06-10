/**
 * 数据获取失败提示组件
 * 当API调用失败时显示明确的错误信息和重试选项
 */

import React from 'react';

interface DataFetchErrorProps {
  dataType: 'news' | 'price' | 'analysis';
  error?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  showFallbackOption?: boolean;
  onUseFallback?: () => void;
}

export const DataFetchError: React.FC<DataFetchErrorProps> = ({ 
  dataType,
  error,
  onRetry,
  onDismiss,
  showFallbackOption = false,
  onUseFallback
}) => {
  const getDataTypeText = () => {
    switch (dataType) {
      case 'news': return '新闻数据';
      case 'price': return '价格数据';
      case 'analysis': return '分析数据';
      default: return '数据';
    }
  };

  const getErrorMessage = () => {
    if (error) return error;
    
    switch (dataType) {
      case 'news':
        return '无法获取最新的市场新闻，可能是网络连接问题或API服务暂时不可用。';
      case 'price':
        return '无法获取实时价格数据，可能是数据源服务暂时不可用。';
      case 'analysis':
        return '无法完成新闻分析，可能是分析服务暂时不可用。';
      default:
        return '数据获取失败，请检查网络连接后重试。';
    }
  };

  const getSuggestions = () => {
    const common = [
      '检查网络连接是否正常',
      '稍后再试，服务可能暂时繁忙'
    ];

    switch (dataType) {
      case 'news':
        return [
          ...common,
          '新闻API可能达到调用限制',
          '尝试切换到其他资产类型'
        ];
      case 'price':
        return [
          ...common,
          '价格数据源可能维护中',
          '尝试刷新页面重新加载'
        ];
      case 'analysis':
        return [
          ...common,
          'AI分析服务可能暂时过载',
          '可以先查看原始新闻内容'
        ];
      default:
        return common;
    }
  };

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">
            {getDataTypeText()}获取失败
          </h3>
          <div className="mt-2 text-sm text-red-700">
            <p>{getErrorMessage()}</p>
            
            <div className="mt-3">
              <p className="font-medium">建议解决方案：</p>
              <ul className="mt-1 list-disc list-inside space-y-1">
                {getSuggestions().map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            </div>

            {/* 操作按钮 */}
            <div className="mt-4 flex flex-wrap gap-2">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-red-800 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                >
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  重试获取
                </button>
              )}
              
              {showFallbackOption && onUseFallback && (
                <button
                  onClick={onUseFallback}
                  className="inline-flex items-center px-3 py-1.5 border border-red-300 text-xs font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                >
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  使用备用数据
                </button>
              )}
            </div>
          </div>
        </div>
        {onDismiss && (
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                onClick={onDismiss}
                className="inline-flex bg-red-50 rounded-md p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-50 focus:ring-red-600 transition-colors"
              >
                <span className="sr-only">关闭</span>
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * 演示数据提示组件（已弃用，使用DataFetchError替代）
 * 当使用演示数据时显示提示信息
 */

interface DemoDataNoticeProps {
  onDismiss?: () => void;
}

export const DemoDataNotice: React.FC<DemoDataNoticeProps> = ({ onDismiss }) => {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-blue-800">
            当前使用演示数据
          </h3>
          <div className="mt-2 text-sm text-blue-700">
            <p>
              由于浏览器安全限制，News API无法在客户端直接调用。当前显示的是演示数据用于功能展示。
            </p>
            <div className="mt-2">
              <p className="font-medium">获取真实数据的方法：</p>
              <ul className="mt-1 list-disc list-inside space-y-1">
                <li>部署到 Cloudflare Pages 生产环境</li>
                <li>使用服务器端代理</li>
                <li>在服务器环境中运行应用</li>
              </ul>
            </div>
          </div>
        </div>
        {onDismiss && (
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                onClick={onDismiss}
                className="inline-flex bg-blue-50 rounded-md p-1.5 text-blue-500 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-blue-50 focus:ring-blue-600"
              >
                <span className="sr-only">关闭</span>
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
