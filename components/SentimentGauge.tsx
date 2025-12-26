/**
 * 情绪仪表盘组件
 * 显示0-100的情绪分数和可视化仪表盘
 */

import React from 'react';
import { SentimentData, sentimentService } from '../services/sentimentService';

interface SentimentGaugeProps {
  data: SentimentData;
  size?: 'sm' | 'md' | 'lg';
}

export const SentimentGauge: React.FC<SentimentGaugeProps> = ({ 
  data, 
  size = 'md' 
}) => {
  const colors = sentimentService.getSentimentColor(data.level);
  const description = sentimentService.getSentimentDescription(data.level);
  const isExtreme = sentimentService.isExtremeValue(data.score);

  // 尺寸配置
  const sizeConfig = {
    sm: { gauge: 120, stroke: 8, text: 'text-2xl', label: 'text-xs' },
    md: { gauge: 160, stroke: 10, text: 'text-3xl', label: 'text-sm' },
    lg: { gauge: 200, stroke: 12, text: 'text-4xl', label: 'text-base' },
  };

  const config = sizeConfig[size];
  const radius = (config.gauge - config.stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (data.score / 100) * circumference;

  // 计算颜色（渐变从红到黄到绿）
  const getGaugeColor = (score: number): string => {
    if (score >= 60) return '#10b981'; // 绿色
    if (score >= 40) return '#f59e0b'; // 黄色
    return '#ef4444'; // 红色
  };

  const gaugeColor = getGaugeColor(data.score);

  return (
    <div className="flex flex-col items-center">
      {/* 仪表盘 */}
      <div className="relative" style={{ width: config.gauge, height: config.gauge }}>
        <svg
          width={config.gauge}
          height={config.gauge}
          className="transform -rotate-90"
        >
          {/* 背景圆环 */}
          <circle
            cx={config.gauge / 2}
            cy={config.gauge / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={config.stroke}
            className="text-gray-200 dark:text-gray-700"
          />
          {/* 进度圆环 */}
          <circle
            cx={config.gauge / 2}
            cy={config.gauge / 2}
            r={radius}
            fill="none"
            stroke={gaugeColor}
            strokeWidth={config.stroke}
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* 中心文字 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className={`${config.text} font-bold ${colors.text}`}>
            {data.score}
          </div>
          <div className={`${config.label} text-gray-600 dark:text-gray-400 mt-1`}>
            情绪指数
          </div>
        </div>
      </div>

      {/* 描述 */}
      <div className="mt-4 text-center">
        <div className={`inline-flex items-center px-3 py-1 rounded-full ${colors.bg} ${colors.text} text-sm font-medium`}>
          {description}
        </div>
      </div>

      {/* 极值预警 */}
      {isExtreme && (
        <div className="mt-3 flex items-center text-xs text-amber-600 dark:text-amber-400">
          <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          极端情绪预警
        </div>
      )}

      {/* 分布统计 */}
      <div className="mt-4 w-full max-w-xs">
        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-2">
          <span>情绪分布</span>
          <span>{data.newsCount} 条新闻</span>
        </div>
        <div className="flex h-2 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
          {data.distribution.positive > 0 && (
            <div
              className="bg-green-500 dark:bg-green-600"
              style={{ width: `${data.distribution.positive}%` }}
              title={`正面: ${data.distribution.positive}%`}
            />
          )}
          {data.distribution.neutral > 0 && (
            <div
              className="bg-yellow-500 dark:bg-yellow-600"
              style={{ width: `${data.distribution.neutral}%` }}
              title={`中性: ${data.distribution.neutral}%`}
            />
          )}
          {data.distribution.negative > 0 && (
            <div
              className="bg-red-500 dark:bg-red-600"
              style={{ width: `${data.distribution.negative}%` }}
              title={`负面: ${data.distribution.negative}%`}
            />
          )}
        </div>
        <div className="flex justify-between mt-2 text-xs">
          <span className="text-green-600 dark:text-green-400">
            利好 {data.distribution.positive}%
          </span>
          <span className="text-yellow-600 dark:text-yellow-400">
            中性 {data.distribution.neutral}%
          </span>
          <span className="text-red-600 dark:text-red-400">
            利空 {data.distribution.negative}%
          </span>
        </div>
      </div>
    </div>
  );
};
