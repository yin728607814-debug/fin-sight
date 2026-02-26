/**
 * 投资组合卡片
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { positionService } from '../../services/positionService';
import { DashboardCard } from '../DashboardCard';

interface PortfolioCardProps {
  onRemove?: () => void;
}

export const PortfolioCard: React.FC<PortfolioCardProps> = ({ onRemove }) => {
  const [loading, setLoading] = useState(true);
  const [totalInvestment, setTotalInvestment] = useState(0);
  const [totalValue, setTotalValue] = useState(0);
  const [totalProfitLoss, setTotalProfitLoss] = useState(0);
  const [positionCount, setPositionCount] = useState(0);

  useEffect(() => {
    loadPortfolioData();
  }, []);

  const loadPortfolioData = async () => {
    try {
      setLoading(true);
      const positions = await positionService.getPositions();
      
      if (positions.length === 0) {
        setPositionCount(0);
        setLoading(false);
        return;
      }

      // 计算总投资、当前价值和收益
      const investment = positions.reduce((sum, p) => sum + p.investment_amount, 0);
      const profitLoss = positions.reduce((sum, p) => sum + p.profit_loss, 0);
      const value = investment + profitLoss;

      setTotalInvestment(investment);
      setTotalValue(value);
      setTotalProfitLoss(profitLoss);
      setPositionCount(positions.length);
    } catch (error) {
      console.error('加载投资组合数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const profitLossPercent = totalInvestment > 0 
    ? (totalProfitLoss / totalInvestment) * 100 
    : 0;

  return (
    <DashboardCard title="投资组合" onRemove={onRemove}>
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">加载中...</p>
        </div>
      ) : positionCount > 0 ? (
        <div className="space-y-4">
          {/* 总览 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-white/50 dark:bg-gray-700/50 rounded-lg">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">总投资</div>
              <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                ¥{totalInvestment.toLocaleString('zh-CN', { maximumFractionDigits: 0 })}
              </div>
            </div>
            <div className="p-3 bg-white/50 dark:bg-gray-700/50 rounded-lg">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">当前价值</div>
              <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                ¥{totalValue.toLocaleString('zh-CN', { maximumFractionDigits: 0 })}
              </div>
            </div>
          </div>

          {/* 收益 */}
          <div className="p-3 bg-white/50 dark:bg-gray-700/50 rounded-lg">
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">总收益</div>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-bold ${
                totalProfitLoss >= 0
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-green-600 dark:text-green-400'
              }`}>
                {totalProfitLoss >= 0 ? '+' : ''}¥{Math.abs(totalProfitLoss).toLocaleString('zh-CN', { maximumFractionDigits: 2 })}
              </span>
              <span className={`text-sm ${
                profitLossPercent >= 0
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-green-600 dark:text-green-400'
              }`}>
                ({profitLossPercent >= 0 ? '+' : ''}{profitLossPercent.toFixed(2)}%)
              </span>
            </div>
          </div>

          {/* 持仓数量 */}
          <div className="text-xs text-gray-600 dark:text-gray-400 text-center">
            共 {positionCount} 个持仓
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
