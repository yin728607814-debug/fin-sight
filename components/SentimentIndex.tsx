/**
 * 情绪指数主组件
 * 整合情绪仪表盘、趋势图和详情弹窗
 */

import React, { useState, useEffect } from 'react';
import { SentimentGauge } from './SentimentGauge';
import { SentimentTrend } from './SentimentTrend';
import { SentimentDetails } from './SentimentDetails';
import { sentimentService, SentimentData, SentimentHistory } from '../services/sentimentService';
import { NewsAnalysis, AssetType } from '../types';
import { InformationCircleIcon } from '@heroicons/react/24/outline';

interface SentimentIndexProps {
  analyses?: NewsAnalysis[];
  assetType: AssetType;
  autoSave?: boolean; // 是否自动保存到历史记录
}

export const SentimentIndex: React.FC<SentimentIndexProps> = ({
  analyses,
  assetType,
  autoSave = true,
}) => {
  const [sentimentData, setSentimentData] = useState<SentimentData | null>(null);
  const [history, setHistory] = useState<SentimentHistory | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // 计算情绪指数
  useEffect(() => {
    try {
      if (analyses && Array.isArray(analyses) && analyses.length > 0) {
        const data = sentimentService.calculateSentiment(analyses);
        setSentimentData(data);

        // 自动保存到历史记录
        if (autoSave) {
          sentimentService.saveSentimentSnapshot(assetType, data);
        }
      } else {
        // 如果没有分析数据，设置为null
        setSentimentData(null);
      }
    } catch (error) {
      console.error('计算情绪指数失败:', error);
      setSentimentData(null);
    }
  }, [analyses, assetType, autoSave]);

  // 加载历史记录
  useEffect(() => {
    try {
      const historyData = sentimentService.getSentimentHistory(assetType, 7);
      // 确保返回的数据有效
      if (historyData && historyData.data && Array.isArray(historyData.data)) {
        setHistory(historyData);
      } else {
        setHistory(null);
      }
    } catch (error) {
      console.error('加载情绪历史失败:', error);
      setHistory(null);
    }
  }, [assetType, sentimentData]); // 当情绪数据更新时，重新加载历史

  if (!sentimentData) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600 animate-pulse"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <p className="mt-2 text-sm">正在计算情绪指数...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 情绪仪表盘 */}
      <div className="flex justify-center">
        <SentimentGauge data={sentimentData} size="md" />
      </div>

      {/* 查看详情按钮 */}
      <div className="flex justify-center">
        <button
          onClick={() => setShowDetails(true)}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
        >
          <InformationCircleIcon className="h-5 w-5 mr-2" />
          查看详细分析
        </button>
      </div>

      {/* 趋势图表 */}
      {history && history.data && Array.isArray(history.data) && history.data.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            7天情绪趋势
          </h3>
          <SentimentTrend history={history} />
        </div>
      )}

      {/* 详情弹窗 */}
      {showDetails && (
        <SentimentDetails
          data={sentimentData}
          onClose={() => setShowDetails(false)}
        />
      )}
    </div>
  );
};
