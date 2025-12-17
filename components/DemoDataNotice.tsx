/**
 * 演示数据提示组件
 * 当使用演示数据时显示提示信息
 */

import React from 'react';

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
                <li>部署到生产环境（如 Netlify、Vercel）</li>
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