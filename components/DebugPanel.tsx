/**
 * 调试面板组件
 * 显示API调用的实时状态和错误信息
 */

import React, { useState } from 'react';
import { newsService } from '../services';

export const DebugPanel: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [apiStatus, setApiStatus] = useState({
    news: 'unknown',
    prices: 'unknown',
    analysis: 'unknown',
    newsService: 'unknown'
  });

  const testNewsAPI = async () => {
    setApiStatus(prev => ({ ...prev, news: 'testing' }));
    
    try {
      // 使用 Cloudflare Pages Function 代理端点
      const response = await fetch('/sina-news-proxy?category=finance&num=5');
      
      const data = await response.json();
      
      if (!response.ok || data.status === 'error') {
        console.error('News API Error:', data);
        setApiStatus(prev => ({ ...prev, news: `error: ${data.message || response.status}` }));
      } else {
        const count = data.totalResults || data.articles?.length || 0;
        console.log('News API Success:', count, 'articles');
        setApiStatus(prev => ({ ...prev, news: `success: ${count} articles` }));
      }
    } catch (error: any) {
      console.error('News API Request Failed:', error);
      setApiStatus(prev => ({ ...prev, news: `failed: ${error.message}` }));
    }
  };

  const testPriceProxy = async () => {
    setApiStatus(prev => ({ ...prev, prices: 'testing' }));
    
    try {
      const response = await fetch('/alpha-vantage-proxy?symbol=nasdaq&days=5&source=yfinance');
      const data = await response.json();
      
      if (!response.ok || data.error) {
        console.error('Price proxy error:', data);
        setApiStatus(prev => ({ ...prev, prices: `error: ${data.error || response.status}` }));
      } else {
        const count = data.priceData?.length || 0;
        console.log('Price proxy success:', data);
        setApiStatus(prev => ({ ...prev, prices: `success: ${count} points` }));
      }
    } catch (error: any) {
      console.error('Price proxy request failed:', error);
      setApiStatus(prev => ({ ...prev, prices: `failed: ${error.message}` }));
    }
  };

  const testNewsService = async () => {
    setApiStatus(prev => ({ ...prev, newsService: 'testing' }));
    
    try {
      console.log('Testing NewsService directly...');
      const news = await newsService.fetchMarketNews('nasdaq', 5);
      console.log('NewsService result:', news);
      setApiStatus(prev => ({ ...prev, newsService: `success: ${news.length} items` }));
    } catch (error: any) {
      console.error('NewsService failed:', error);
      setApiStatus(prev => ({ ...prev, newsService: `failed: ${error.message}` }));
    }
  };

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsVisible(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-700 transition-colors"
        >
          🔧 调试
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-4 w-80">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-gray-900">API调试面板</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <h4 className="font-medium text-sm text-gray-700">环境信息:</h4>
          <div className="text-xs text-gray-600">
            <div>环境: {typeof window !== 'undefined' ? '浏览器' : '服务器'}</div>
            <div>API 代理: Cloudflare Pages Functions</div>
            {typeof window !== 'undefined' && (
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                <div className="text-yellow-800 font-medium">浏览器环境说明:</div>
                <div className="text-yellow-700">News API不支持浏览器直接调用，当前使用演示数据</div>
              </div>
            )}
          </div>
        </div>

        <div>
          <h4 className="font-medium text-sm text-gray-700">API测试:</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm">News API:</span>
              <div className="flex items-center space-x-2">
                <span className={`text-xs px-2 py-1 rounded ${
                  apiStatus.news === 'unknown' ? 'bg-gray-100 text-gray-600' :
                  apiStatus.news === 'testing' ? 'bg-yellow-100 text-yellow-600' :
                  apiStatus.news.startsWith('success') ? 'bg-green-100 text-green-600' :
                  'bg-red-100 text-red-600'
                }`}>
                  {apiStatus.news}
                </span>
                <button
                  onClick={testNewsAPI}
                  disabled={apiStatus.news === 'testing'}
                  className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded hover:bg-blue-200 disabled:opacity-50"
                >
                  测试
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm">价格代理:</span>
              <div className="flex items-center space-x-2">
                <span className={`text-xs px-2 py-1 rounded ${
                  apiStatus.prices === 'unknown' ? 'bg-gray-100 text-gray-600' :
                  apiStatus.prices === 'testing' ? 'bg-yellow-100 text-yellow-600' :
                  apiStatus.prices.startsWith('success') ? 'bg-green-100 text-green-600' :
                  'bg-red-100 text-red-600'
                }`}>
                  {apiStatus.prices}
                </span>
                <button
                  onClick={testPriceProxy}
                  disabled={apiStatus.prices === 'testing'}
                  className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded hover:bg-blue-200 disabled:opacity-50"
                >
                  测试
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm">NewsService:</span>
              <div className="flex items-center space-x-2">
                <span className={`text-xs px-2 py-1 rounded ${
                  apiStatus.newsService === 'unknown' ? 'bg-gray-100 text-gray-600' :
                  apiStatus.newsService === 'testing' ? 'bg-yellow-100 text-yellow-600' :
                  apiStatus.newsService.startsWith('success') ? 'bg-green-100 text-green-600' :
                  'bg-red-100 text-red-600'
                }`}>
                  {apiStatus.newsService}
                </span>
                <button
                  onClick={testNewsService}
                  disabled={apiStatus.newsService === 'testing'}
                  className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded hover:bg-blue-200 disabled:opacity-50"
                >
                  测试
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="text-xs text-gray-500">
          打开浏览器控制台查看详细日志
        </div>
      </div>
    </div>
  );
};
