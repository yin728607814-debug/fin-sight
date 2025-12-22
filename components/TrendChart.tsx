/**
 * TrendChart组件 - 价格趋势图表展示
 * 使用Chart.js显示价格数据的趋势图表
 */

import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  TooltipItem
} from 'chart.js';
import { TrendChartProps, ASSET_NAMES } from '../types';

// 注册Chart.js组件
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

/**
 * 价格趋势图表组件
 */
export const TrendChart: React.FC<TrendChartProps> = ({ 
  data, 
  assetType, 
  timeRange 
}) => {
  // 处理图表数据
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        labels: [],
        datasets: []
      };
    }

    // 按日期排序
    const sortedData = [...data].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const labels = sortedData.map(item => 
      new Date(item.date).toLocaleDateString('zh-CN', {
        month: 'short',
        day: 'numeric'
      })
    );

    const prices = sortedData.map(item => item.close);
    // const changes = sortedData.map(item => item.changePercent);

    // 确定线条颜色（基于整体趋势）
    const overallChange = sortedData.length > 1 
      ? sortedData[sortedData.length - 1].close - sortedData[0].close
      : 0;
    
    const lineColor = overallChange >= 0 ? '#10b981' : '#ef4444'; // 绿色上涨，红色下跌
    const fillColor = overallChange >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)';

    return {
      labels,
      datasets: [
        {
          label: `${ASSET_NAMES[assetType]}价格`,
          data: prices,
          borderColor: lineColor,
          backgroundColor: fillColor,
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: lineColor,
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        }
      ]
    };
  }, [data, assetType]);

  // 图表配置选项
  const options: ChartOptions<'line'> = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          font: {
            size: 12,
            family: 'Inter, system-ui, sans-serif'
          },
          color: '#64748b'
        }
      },
      title: {
        display: true,
        text: `${ASSET_NAMES[assetType]} - ${timeRange}天价格趋势`,
        font: {
          size: 16,
          weight: 'bold',
          family: 'Inter, system-ui, sans-serif'
        },
        color: '#1e293b'
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#374151',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: function(context: TooltipItem<'line'>) {
            const dataIndex = context.dataIndex;
            const priceData = data[dataIndex];
            
            if (!priceData) return '';

            const price = context.parsed.y;
            const change = priceData.change;
            const changePercent = priceData.changePercent;
            
            return [
              `价格: ${price?.toFixed(2) || 'N/A'}`,
              `变化: ${change >= 0 ? '+' : ''}${change.toFixed(2)}`,
              `涨跌幅: ${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%`
            ];
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: '#f1f5f9',
          drawBorder: false
        },
        ticks: {
          color: '#64748b',
          font: {
            size: 10,
            family: 'Inter, system-ui, sans-serif'
          },
          maxRotation: 0,
          minRotation: 0
        }
      },
      y: {
        grid: {
          color: '#f1f5f9',
          drawBorder: false
        },
        ticks: {
          color: '#64748b',
          font: {
            size: 11,
            family: 'Inter, system-ui, sans-serif'
          },
          callback: function(value) {
            return typeof value === 'number' ? value.toFixed(2) : value;
          }
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    },
    elements: {
      point: {
        hoverBackgroundColor: '#ffffff',
        hoverBorderWidth: 3
      }
    }
  }), [assetType, timeRange, data]);

  // 计算统计信息
  const stats = useMemo(() => {
    if (!data || data.length === 0) {
      return null;
    }

    const sortedData = [...data].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const latest = sortedData[sortedData.length - 1];
    const earliest = sortedData[0];
    const high = Math.max(...sortedData.map(d => d.high));
    const low = Math.min(...sortedData.map(d => d.low));
    const totalChange = latest.close - earliest.close;
    const totalChangePercent = (totalChange / earliest.close) * 100;

    return {
      current: latest.close,
      change: totalChange,
      changePercent: totalChangePercent,
      high,
      low,
      isPositive: totalChange >= 0
    };
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="text-center py-8">
          <div className="text-slate-400 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-slate-500">暂无价格数据</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      {/* 统计信息头部 */}
      {stats && (
        <div className="mb-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-50 rounded-lg p-3 text-center min-w-0">
              <div className="text-xs text-slate-500 uppercase tracking-wide mb-2">当前价格</div>
              <div className="text-sm font-bold text-slate-900 whitespace-nowrap overflow-hidden">
                <span className="block truncate">
                  {stats.current.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 text-center min-w-0">
              <div className="text-xs text-slate-500 uppercase tracking-wide mb-2">总变化</div>
              <div className={`text-sm font-bold whitespace-nowrap overflow-hidden ${stats.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                <span className="block truncate">
                  {stats.isPositive ? '+' : ''}{stats.change.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 text-center min-w-0">
              <div className="text-xs text-slate-500 uppercase tracking-wide mb-2">涨跌幅</div>
              <div className={`text-sm font-bold whitespace-nowrap overflow-hidden ${stats.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                <span className="block truncate">
                  {stats.isPositive ? '+' : ''}{stats.changePercent.toFixed(2)}%
                </span>
              </div>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 text-center min-w-0">
              <div className="text-xs text-slate-500 uppercase tracking-wide mb-2">区间</div>
              <div className="text-xs font-semibold text-slate-700 whitespace-nowrap overflow-hidden">
                <div className="truncate">
                  {stats.low.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </div>
                <div className="text-xs text-slate-400">-</div>
                <div className="truncate">
                  {stats.high.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 图表区域 */}
      <div className="h-72 w-full">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};