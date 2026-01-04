/**
 * 投资组合图表组件
 * 显示资产分布饼图和收益曲线（支持分资产类型显示）
 */

import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { Portfolio, PortfolioHistory } from '../services/portfolioService';
import { portfolioService } from '../services/portfolioService';

/**
 * 投资组合图表Props
 */
interface PortfolioChartProps {
  portfolio: Portfolio;
  history: PortfolioHistory[];
}

/**
 * 投资组合图表组件
 */
export const PortfolioChart: React.FC<PortfolioChartProps> = ({
  portfolio,
  history
}) => {
  const [activeChart, setActiveChart] = useState<'allocation' | 'performance'>('allocation');

  // 资产分布数据
  const allocationData = portfolioService.getAssetAllocation(portfolio);
  
  // 颜色配置
  const COLORS = {
    nasdaq: '#3B82F6', // blue-500
    gold: '#F59E0B'    // amber-500
  };

  /**
   * 计算分资产类型的历史数据
   * 从持仓数据推算每个资产类型的历史价值
   */
  const calculateAssetHistory = () => {
    // 获取当前各资产的投资
    const nasdaqPositions = portfolio.positions.filter(p => p.assetType === 'nasdaq');
    const goldPositions = portfolio.positions.filter(p => p.assetType === 'gold');
    
    const nasdaqInvestment = nasdaqPositions.reduce((sum, p) => sum + p.investmentAmount, 0);
    const goldInvestment = goldPositions.reduce((sum, p) => sum + p.investmentAmount, 0);
    
    // 为历史数据添加分资产类型的值（按比例推算）
    return history.map(item => {
      const totalValue = item.value;
      
      // 按当前投资比例分配历史价值
      const nasdaqRatio = (nasdaqInvestment + goldInvestment) > 0 ? nasdaqInvestment / (nasdaqInvestment + goldInvestment) : 0;
      const goldRatio = 1 - nasdaqRatio;
      
      const nasdaqHistValue = totalValue * nasdaqRatio;
      const goldHistValue = totalValue * goldRatio;
      
      return {
        ...item,
        nasdaqValue: nasdaqHistValue,
        goldValue: goldHistValue
      };
    });
  };

  const enhancedHistory = calculateAssetHistory();

  /**
   * 格式化货币
   */
  const formatCurrency = (value: number): string => {
    return `¥${value.toLocaleString('zh-CN', { maximumFractionDigits: 0 })}`;
  };

  /**
   * 格式化日期
   */
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  return (
    <div className="space-y-4">
      {/* 切换按钮 */}
      <div className="flex space-x-2 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
        <button
          onClick={() => setActiveChart('allocation')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeChart === 'allocation'
              ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
        >
          资产分布
        </button>
        <button
          onClick={() => setActiveChart('performance')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeChart === 'performance'
              ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
        >
          收益曲线
        </button>
      </div>

      {/* 图表内容 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        {activeChart === 'allocation' ? (
          // 资产分布饼图
          <div>
            {allocationData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={allocationData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry: any) => `${entry.percentage.toFixed(1)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {allocationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[entry.assetType]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number | undefined) => value !== undefined ? formatCurrency(value) : ''}
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #e5e7eb',
                        borderRadius: '0.5rem'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                
                {/* 图例 */}
                <div className="mt-4 space-y-2">
                  {allocationData.map((item) => (
                    <div key={item.assetType} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: COLORS[item.assetType] }}
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {item.assetName}
                        </span>
                      </div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {formatCurrency(item.value)} ({item.percentage.toFixed(1)}%)
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                暂无数据
              </div>
            )}
          </div>
        ) : (
          // 收益曲线 - 分资产类型显示
          <div>
            {enhancedHistory.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={enhancedHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatDate}
                      stroke="#9ca3af"
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis
                      tickFormatter={formatCurrency}
                      stroke="#9ca3af"
                      style={{ fontSize: '12px' }}
                    />
                    <Tooltip
                      formatter={(value: number | undefined) => value !== undefined ? formatCurrency(value) : ''}
                      labelFormatter={(label) => `日期: ${label}`}
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #e5e7eb',
                        borderRadius: '0.5rem'
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="value"
                      name="总价值"
                      stroke="#10B981"
                      strokeWidth={2}
                      dot={{ fill: '#10B981', r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="nasdaqValue"
                      name="纳斯达克"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      dot={{ fill: '#3B82F6', r: 3 }}
                      strokeDasharray="5 5"
                    />
                    <Line
                      type="monotone"
                      dataKey="goldValue"
                      name="黄金"
                      stroke="#F59E0B"
                      strokeWidth={2}
                      dot={{ fill: '#F59E0B', r: 3 }}
                      strokeDasharray="5 5"
                    />
                  </LineChart>
                </ResponsiveContainer>
                <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
                  * 虚线表示各资产类型的价值走势（按当前持仓比例推算）
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                暂无历史数据
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
