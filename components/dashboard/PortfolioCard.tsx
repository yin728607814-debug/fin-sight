/**
 * 投资组合卡片
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { portfolioService, Portfolio } from '../../services/portfolioService';
import { usePriceData } from '../../utils/context';
import { DashboardCard } from '../DashboardCard';

interface PortfolioCardProps {
  onRemove?: () => void;
}

export const PortfolioCard: React.FC<PortfolioCardProps> = ({ onRemove }) => {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const { priceData: nasdaqPrices } = usePriceData('nasdaq');
  const { priceData: goldPrices } = usePriceData('gold');

  useEffect(() => {
    const positions = portfolioService.getPositions();
    
    if (positions.length === 0) {
      setPortfolio(null);
      return;
    }
    
    const prices = new Map();
    if (nasdaqPrices.length > 0) {
      prices.set('nasdaq', nasdaqPrices[nasdaqPrices.length - 1].close);
    }
    if (goldPrices.length > 0) {
      prices.set('gold', goldPrices[goldPrices.length - 1].close);
    }

    const calculatedPortfolio = portfolioService.calculatePortfolio(positions, prices);
    setPortfolio(calculatedPortfolio);
  }, [nasdaqPrices, goldPrices]);

  return (
    <DashboardCard title="投资组合" onRemove={onRemove}>
      {portfolio && portfolio.positions.length > 0 ? (
        <div className="space-y-4">
          {/* 总览 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-white/50 dark:bg-gray-700/50 rounded-lg">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">总投资</div>
              <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                ${portfolio.totalInvested.toLocaleString()}
              </div>
            </div>
            <div className="p-3 bg-white/50 dark:bg-gray-700/50 rounded-lg">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">当前价值</div>
              <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                ${portfolio.currentValue.toLocaleString()}
              </div>
            </div>
          </div>

          {/* 收益 */}
          <div className="p-3 bg-white/50 dark:bg-gray-700/50 rounded-lg">
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">总收益</div>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-bold ${
                portfolio.totalReturn >= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {portfolio.totalReturn >= 0 ? '+' : ''}${portfolio.totalReturn.toLocaleString()}
              </span>
              <span className={`text-sm ${
                portfolio.returnPercentage >= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}>
                ({portfolio.returnPercentage >= 0 ? '+' : ''}{portfolio.returnPercentage.toFixed(2)}%)
              </span>
            </div>
          </div>

          <Link
            to="/portfolio"
            className="block text-center text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            查看详情 →
          </Link>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            还没有添加投资组合
          </p>
          <Link
            to="/portfolio"
            className="inline-block px-4 py-2 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 transition-colors"
          >
            开始添加
          </Link>
        </div>
      )}
    </DashboardCard>
  );
};
