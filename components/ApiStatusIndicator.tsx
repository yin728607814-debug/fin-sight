/**
 * API状态指示器组件
 * 显示各个API的配置状态
 */

import React, { useState, useEffect } from 'react';
import { CheckCircleIcon, ExclamationTriangleIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface ApiStatus {
  name: string;
  key: string;
  status: 'configured' | 'placeholder' | 'missing';
  url?: string;
}

export const ApiStatusIndicator: React.FC = () => {
  const [apiStatuses, setApiStatuses] = useState<ApiStatus[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const checkApiStatuses = () => {
      const statuses: ApiStatus[] = [
        {
          name: 'News API',
          key: 'NEWS_API_KEY',
          status: getApiKeyStatus(process.env.NEWS_API_KEY),
          url: 'https://newsapi.org/'
        },
        {
          name: 'Alpha Vantage API',
          key: 'ALPHA_VANTAGE_API_KEY', 
          status: getApiKeyStatus(process.env.ALPHA_VANTAGE_API_KEY),
          url: 'https://www.alphavantage.co/'
        },
        {
          name: 'Gemini AI API',
          key: 'GEMINI_API_KEY',
          status: getApiKeyStatus(process.env.GEMINI_API_KEY),
          url: 'https://ai.google.dev/'
        }
      ];
      
      setApiStatuses(statuses);
    };

    checkApiStatuses();
  }, []);

  const getApiKeyStatus = (apiKey: string | undefined): 'configured' | 'placeholder' | 'missing' => {
    if (!apiKey || apiKey === '') {
      return 'missing';
    }
    
    if (apiKey.includes('your_') || 
        apiKey.includes('demo') || 
        apiKey.includes('placeholder') ||
        apiKey === 'demo') {
      return 'placeholder';
    }
    
    return 'configured';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'configured':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'placeholder':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'missing':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <XCircleIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'configured':
        return '已配置';
      case 'placeholder':
        return '需要配置';
      case 'missing':
        return '缺失';
      default:
        return '未知';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'configured':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'placeholder':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'missing':
        return 'text-red-700 bg-red-50 border-red-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const configuredCount = apiStatuses.filter(api => api.status === 'configured').length;
  const totalCount = apiStatuses.length;
  const allConfigured = configuredCount === totalCount;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div 
        className="px-4 py-3 cursor-pointer flex items-center justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          {allConfigured ? (
            <CheckCircleIcon className="h-5 w-5 text-green-500" />
          ) : (
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
          )}
          <span className="font-medium text-gray-900">
            API配置状态 ({configuredCount}/{totalCount})
          </span>
        </div>
        <svg 
          className={`h-5 w-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {isExpanded && (
        <div className="border-t border-gray-200 px-4 py-3">
          <div className="space-y-3">
            {apiStatuses.map((api) => (
              <div key={api.key} className={`p-3 rounded-lg border ${getStatusColor(api.status)}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(api.status)}
                    <div>
                      <div className="font-medium">{api.name}</div>
                      <div className="text-sm opacity-75">
                        状态: {getStatusText(api.status)}
                      </div>
                    </div>
                  </div>
                  {api.status !== 'configured' && api.url && (
                    <a
                      href={api.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium hover:underline"
                    >
                      获取密钥
                    </a>
                  )}
                </div>
                
                {api.status === 'placeholder' && (
                  <div className="mt-2 text-sm">
                    <p>请将真实的API密钥添加到 .env 文件中的 {api.key} 字段</p>
                  </div>
                )}
                
                {api.status === 'missing' && (
                  <div className="mt-2 text-sm">
                    <p>缺少API密钥，请访问 <a href={api.url} target="_blank" rel="noopener noreferrer" className="underline">{api.url}</a> 获取</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {!allConfigured && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <svg className="h-5 w-5 text-blue-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-blue-700">
                  <p className="font-medium mb-1">配置真实API密钥以获取真实数据：</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>访问上述链接获取API密钥</li>
                    <li>将密钥添加到项目根目录的 .env 文件中</li>
                    <li>重启开发服务器 (npm run dev)</li>
                  </ol>
                  <p className="mt-2">
                    详细指南请查看项目根目录的 <code className="bg-blue-100 px-1 rounded">API_KEYS_GUIDE.md</code> 文件
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};