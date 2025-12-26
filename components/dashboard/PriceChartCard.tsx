/**
 * 价格走势卡片
 */

import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { usePriceData } from '../../utils/context';
import { DashboardCard } from '../DashboardCard';

interface PriceChartCardProps {
  onRemove?: () => void;
}

export const PriceChartCard: React.FC<PriceChartCardProps> = ({ onRemove }) => {
  const [selectedAsset, setSelectedAsset] = useState<'nasdaq' | 'gold'>('nasdaq');
  const { priceData } = usePriceData(selectedAsset);
  
  const chartData = priceData.slice(-30).map(item => ({
    date: new Date(item.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
    price: item.close,
  }));

  return (
    <DashboardCard title="价格走势" onRemove={onRemove}>
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

        {/* 图表 */}
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10 }}
                stroke="#9CA3AF"
              />
              <YAxis
                tick={{ fontSize: 10 }}
                stroke="#9CA3AF"
                domain={['auto', 'auto']}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke={selectedAsset === 'nasdaq' ? '#3B82F6' : '#EAB308'}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
            暂无数据
          </p>
        )}
      </div>
    </DashboardCard>
  );
};
