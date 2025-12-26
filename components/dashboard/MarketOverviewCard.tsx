/**
 * 市场概览卡片
 */

import React from 'react';
import { usePriceData } from '../../utils/context';
import { DashboardCard } from '../DashboardCard';

interface MarketOverviewCardProps {
  onRemove?: () => void;
}

export const MarketOverviewCard: React.FC<MarketOverviewCardProps> = ({ onRemove }) => {
  const { priceData: nasdaqPrices } = usePriceData('nasdaq');
  const { priceData: goldPrices } = usePriceData('gold');

  const getLatestPrice = (prices: any[]) => {
    if (prices.length === 0) return null;
    return prices[prices.length - 1];
  };

  const calculateChange = (prices: any[]) => {
    if (prices.length < 2) return { value: 0, percentage: 0 };
    const latest = prices[prices.length - 1];
    const previous = prices[prices.length - 2];
    const value = latest.close - previous.close;
    const percentage = (value / previous.close) * 100;
    return { value, percentage };
  };

  const nasdaqLatest = getLatestPrice(nasdaqPrices);
  const goldLatest = getLatestPrice(goldPrices);
  const nasdaqChange = calculateChange(nasdaqPrices);
  const goldChange = calculateChange(goldPrices);

  return (
    <DashboardCard title="市场概览" onRemove={onRemove}>
      <div className="grid grid-cols-2 gap-4">
        {/* 纳斯达克 */}
        <div className="p-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-lg">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">纳斯达克</div>
          {nasdaqLatest ? (
            <>
              <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {nasdaqLatest.close.toLocaleString()}
              </div>
              <div className={`text-sm font-medium ${
                nasdaqChange.value >= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {nasdaqChange.value >= 0 ? '+' : ''}{nasdaqChange.value.toFixed(2)} 
                ({nasdaqChange.percentage >= 0 ? '+' : ''}{nasdaqChange.percentage.toFixed(2)}%)
              </div>
            </>
          ) : (
            <div className="text-sm text-gray-500 dark:text-gray-400">暂无数据</div>
          )}
        </div>

        {/* 黄金 */}
        <div className="p-4 bg-yellow-50/50 dark:bg-yellow-900/20 rounded-lg">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">黄金</div>
          {goldLatest ? (
            <>
              <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                ${goldLatest.close.toLocaleString()}
              </div>
              <div className={`text-sm font-medium ${
                goldChange.value >= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {goldChange.value >= 0 ? '+' : ''}${goldChange.value.toFixed(2)} 
                ({goldChange.percentage >= 0 ? '+' : ''}{goldChange.percentage.toFixed(2)}%)
              </div>
            </>
          ) : (
            <div className="text-sm text-gray-500 dark:text-gray-400">暂无数据</div>
          )}
        </div>
      </div>
    </DashboardCard>
  );
};
