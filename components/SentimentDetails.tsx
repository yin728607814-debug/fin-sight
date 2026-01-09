/**
 * 情绪详情弹窗组件
 * 显示详细的情绪分析信息
 */

import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { SentimentData } from '../services/sentimentService';

interface SentimentDetailsProps {
  data: SentimentData;
  onClose: () => void;
}

export const SentimentDetails: React.FC<SentimentDetailsProps> = ({
  data,
  onClose,
}) => {
  // 安全检查：确保数据完整
  if (!data || !data.distribution) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* 背景遮罩 */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* 弹窗内容 */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full p-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* 关闭按钮 */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>

          {/* 标题 */}
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            情绪分析详情
          </h2>

          {/* 情绪分数 */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                综合情绪指数
              </span>
              <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {data.score}
              </span>
            </div>
            <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  data.score >= 60
                    ? 'bg-green-500'
                    : data.score >= 40
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${data.score}%` }}
              />
            </div>
          </div>

          {/* 情绪分布 */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
              情绪分布
            </h3>
            <div className="space-y-3">
              {/* 正面 */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    利好消息
                  </span>
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">
                    {data.distribution.positive}%
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 dark:bg-green-600 transition-all duration-500"
                    style={{ width: `${data.distribution.positive}%` }}
                  />
                </div>
              </div>

              {/* 中性 */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    中性消息
                  </span>
                  <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                    {data.distribution.neutral}%
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-500 dark:bg-yellow-600 transition-all duration-500"
                    style={{ width: `${data.distribution.neutral}%` }}
                  />
                </div>
              </div>

              {/* 负面 */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    利空消息
                  </span>
                  <span className="text-sm font-medium text-red-600 dark:text-red-400">
                    {data.distribution.negative}%
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 dark:bg-red-600 transition-all duration-500"
                    style={{ width: `${data.distribution.negative}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 关键影响因素 */}
          {data.keyFactors && Array.isArray(data.keyFactors) && data.keyFactors.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                关键影响因素
              </h3>
              <ul className="space-y-2">
                {data.keyFactors.map((factor, index) => (
                  <li
                    key={index}
                    className="flex items-start text-sm text-gray-700 dark:text-gray-300"
                  >
                    <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full mr-2 text-xs font-medium">
                      {index + 1}
                    </span>
                    <span className="flex-1">{factor}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 统计信息 */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>分析新闻数量</span>
              <span className="font-medium">{data.newsCount} 条</span>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mt-2">
              <span>更新时间</span>
              <span className="font-medium">
                {(() => {
                  try {
                    return new Date(data.timestamp).toLocaleString('zh-CN');
                  } catch (error) {
                    return '未知时间';
                  }
                })()}
              </span>
            </div>
          </div>

          {/* 关闭按钮 */}
          <div className="mt-6">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-medium"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
