/**
 * 情绪指数卡片
 */

import React, { useState, useEffect } from 'react';
import { useAnalysis } from '../../utils/context';
import { sentimentService, SentimentData } from '../../services/sentimentService';
import { DashboardCard } from '../DashboardCard';

interface SentimentCardProps {
  onRemove?: () => void;
}

export const SentimentCard: React.FC<SentimentCardProps> = ({ onRemove }) => {
  const [selectedAsset, setSelectedAsset] = useState<'nasdaq' | 'gold'>('nasdaq');
  const { analyses, loading } = useAnalysis(selectedAsset);
  const [sentiment, setSentiment] = useState<SentimentData | null>(null);

  useEffect(() => {
    if (analyses && analyses.length > 0) {
      const data = sentimentService.calculateSentiment(analyses);
      setSentiment(data);
    } else {
      setSentiment(null);
    }
  }, [analyses]);

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600 dark:text-green-400';
    if (score >= 40) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 70) return '乐观';
    if (score >= 40) return '中性';
    return '悲观';
  };

  return (
    <DashboardCard title="情绪指数" onRemove={onRemove}>
      <div className="space-y-4">
        {/* 资产选择器 */}
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedAsset('nasdaq')}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              selectedAsset === 'nasdaq'
                ? 'bg-blue-500 text-white'
                : 'bg-white/50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300'
            }`}
          >
            纳斯达克
          </button>
          <button
            onClick={() => setSelectedAsset('gold')}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              selectedAsset === 'gold'
                ? 'bg-yellow-500 text-white'
                : 'bg-white/50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300'
            }`}
          >
            黄金
          </button>
        </div>

        {/* 情绪分数 */}
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              加载中...
            </p>
          </div>
        ) : sentiment ? (
          <div className="text-center py-4">
            <div className={`text-5xl font-bold ${getScoreColor(sentiment.score)}`}>
              {sentiment.score}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              {getScoreLabel(sentiment.score)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              基于 {sentiment.newsCount} 条新闻分析
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              暂无{selectedAsset === 'nasdaq' ? '纳斯达克' : '黄金'}情绪数据
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-600">
              请先访问{selectedAsset === 'nasdaq' ? '纳斯达克' : '黄金'}页面加载新闻
            </p>
          </div>
        )}
      </div>
    </DashboardCard>
  );
};
