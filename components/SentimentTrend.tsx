/**
 * 情绪趋势图表组件
 * 显示过去7天的情绪指数趋势
 */

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { SentimentHistory } from '../services/sentimentService';

interface SentimentTrendProps {
  history: SentimentHistory;
}

export const SentimentTrend: React.FC<SentimentTrendProps> = ({ history }) => {
  // 格式化日期显示
  const formatDate = (dateStr: string | Date | any): string => {
    try {
      let date: Date;
      
      if (dateStr instanceof Date) {
        date = dateStr;
      } else if (typeof dateStr === 'string') {
        date = new Date(dateStr);
      } else if (dateStr && typeof dateStr === 'object' && 'getTime' in dateStr) {
        date = new Date(dateStr.getTime());
      } else {
        return '无效日期';
      }
      
      if (isNaN(date.getTime())) {
        return '无效日期';
      }
      
      return `${date.getMonth() + 1}/${date.getDate()}`;
    } catch (error) {
      return '无效日期';
    }
  };

  // 准备图表数据 - 过滤无效数据
  const chartData = history.data
    .filter((item) => {
      if (!item || typeof item !== 'object') {
        return false;
      }
      if (!item.date || typeof item.score !== 'number') {
        return false;
      }
      return true;
    })
    .map((item) => ({
      date: formatDate(item.date),
      score: item.score,
      fullDate: typeof item.date === 'string' ? item.date : String(item.date),
    }));

  // 自定义 Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const score = data.score;
      let level = '中性';
      let color = 'text-yellow-600';

      if (score >= 60) {
        level = '乐观';
        color = 'text-green-600';
      } else if (score <= 40) {
        level = '悲观';
        color = 'text-red-600';
      }

      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">{data.fullDate}</p>
          <p className={`text-lg font-bold ${color}`}>
            {score} 分
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{level}</p>
        </div>
      );
    }
    return null;
  };

  // 如果没有数据
  if (!chartData || chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600"
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
          <p className="mt-2 text-sm">暂无历史数据</p>
          <p className="text-xs mt-1">数据将在分析新闻后自动记录</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
        >
          <CartesianGrid 
            strokeDasharray="3 3" 
            className="stroke-gray-200 dark:stroke-gray-700" 
          />
          <XAxis
            dataKey="date"
            tick={{ fill: 'currentColor' }}
            className="text-gray-600 dark:text-gray-400 text-xs"
          />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 20, 40, 60, 80, 100]}
            tick={{ fill: 'currentColor' }}
            className="text-gray-600 dark:text-gray-400 text-xs"
          />
          <Tooltip content={<CustomTooltip />} />
          
          {/* 参考线 */}
          <ReferenceLine
            y={60}
            stroke="#10b981"
            strokeDasharray="3 3"
            strokeOpacity={0.3}
            label={{ value: '乐观', position: 'right', fill: '#10b981', fontSize: 10 }}
          />
          <ReferenceLine
            y={40}
            stroke="#ef4444"
            strokeDasharray="3 3"
            strokeOpacity={0.3}
            label={{ value: '悲观', position: 'right', fill: '#ef4444', fontSize: 10 }}
          />

          {/* 趋势线 */}
          <Line
            type="monotone"
            dataKey="score"
            stroke="#3b82f6"
            strokeWidth={3}
            dot={{
              fill: '#3b82f6',
              strokeWidth: 2,
              r: 4,
            }}
            activeDot={{
              r: 6,
              fill: '#3b82f6',
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
