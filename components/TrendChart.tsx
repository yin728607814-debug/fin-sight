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
  // 处理图表数据 - 添加 key 作为依赖，确保强制刷新时重新计算
  const chartData = useMemo(() => {
    console.log('🔄 TrendChart: 重新计算图表数据', { 
      dataLength: data?.length, 
      assetType,
      firstDate: data?.[0]?.date,
      lastDate: data?.[data.length - 1]?.date 
    });
    
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

    // 确定线条颜色（基于最新日期的涨跌 - 中国股市习惯：红涨绿跌）
    const latestChange = sortedData.length > 1 
      ? sortedData[sortedData.length - 1].changePercent
      : 0;
    
    const lineColor = latestChange >= 0 ? '#ef4444' : '#10b981'; // 红色上涨，绿色下跌
    const fillColor = latestChange >= 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)';

    console.log('📊 TrendChart: 图表数据已生成', { 
      labels, 
      pricesCount: prices.length,
      latestPrice: prices[prices.length - 1],
      latestChange 
    });

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

  // 图表配置选项 - 移动端和平板优化
  const options: ChartOptions<'line'> = useMemo(() => {
    const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
    const isMobile = window.innerWidth < 768;
    
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top' as const,
          labels: {
            font: {
              size: isMobile ? 10 : isTablet ? 11 : 12,
              family: 'Inter, system-ui, sans-serif'
            },
            color: '#64748b',
            padding: isMobile ? 10 : isTablet ? 15 : 20,
            usePointStyle: true,
            pointStyle: 'circle'
          }
        },
        title: {
          display: true,
          text: `${ASSET_NAMES[assetType]} - ${timeRange}天价格趋势`,
          font: {
            size: isMobile ? 14 : isTablet ? 15 : 16,
            weight: 'bold',
            family: 'Inter, system-ui, sans-serif'
          },
          color: '#1e293b',
          padding: {
            top: 10,
            bottom: isMobile ? 15 : isTablet ? 18 : 20
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          borderColor: '#374151',
          borderWidth: 1,
          cornerRadius: 8,
          displayColors: false,
          titleFont: {
            size: isMobile ? 12 : isTablet ? 13 : 14
          },
          bodyFont: {
            size: isMobile ? 11 : isTablet ? 12 : 12
          },
          padding: isMobile ? 8 : isTablet ? 10 : 12,
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
              size: isMobile ? 9 : isTablet ? 10 : 10,
              family: 'Inter, system-ui, sans-serif'
            },
            maxRotation: isMobile ? 45 : isTablet ? 30 : 0,
            minRotation: 0,
            maxTicksLimit: isMobile ? 5 : isTablet ? 6 : 8
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
              size: isMobile ? 9 : isTablet ? 10 : 11,
              family: 'Inter, system-ui, sans-serif'
            },
            maxTicksLimit: isMobile ? 6 : isTablet ? 7 : 8,
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
          hoverBorderWidth: 3,
          radius: isMobile ? 3 : isTablet ? 3.5 : 4,
          hoverRadius: isMobile ? 5 : isTablet ? 5.5 : 6
        },
        line: {
          borderWidth: isMobile ? 2 : isTablet ? 2.5 : 2,
          tension: 0.4
        }
      }
    };
  }, [assetType, timeRange, data]);

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

  // 获取数据来源信息
  const dataSourceInfo = useMemo(() => {
    if (!data || data.length === 0) return null;
    
    const sources = [...new Set(data.map(d => d.source))];
    const latestData = data[data.length - 1];
    const lastUpdated = latestData?.lastUpdated ? new Date(latestData.lastUpdated) : new Date();
    
    return {
      sources,
      lastUpdated,
      isReal: latestData?.isReal || false,
      dataPoints: data.length
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
      {/* 统计信息头部 - 移动端和平板优化 */}
      {stats && (
        <div className="mb-6">
          {/* 移动端：2x2网格，平板：2x2网格，桌面：1x4网格 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-4">
            <div className="bg-slate-50 rounded-lg p-3 md:p-4 lg:p-3 text-center min-h-[80px] md:min-h-[90px] lg:min-h-[90px] flex flex-col justify-center touch-manipulation">
              <div className="text-xs text-slate-500 uppercase tracking-wide mb-1 md:mb-2 leading-tight">当前价格</div>
              <div className="text-sm md:text-base lg:text-sm font-bold text-slate-900 leading-tight">
                <span className="block break-all">
                  {stats.current.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 md:p-4 lg:p-3 text-center min-h-[80px] md:min-h-[90px] lg:min-h-[90px] flex flex-col justify-center touch-manipulation">
              <div className="text-xs text-slate-500 uppercase tracking-wide mb-1 md:mb-2 leading-tight">总变化</div>
              <div className={`text-sm md:text-base lg:text-sm font-bold leading-tight ${stats.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                <span className="block break-all">
                  {stats.isPositive ? '+' : ''}{stats.change.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 md:p-4 lg:p-3 text-center min-h-[80px] md:min-h-[90px] lg:min-h-[90px] flex flex-col justify-center touch-manipulation">
              <div className="text-xs text-slate-500 uppercase tracking-wide mb-1 md:mb-2 leading-tight">涨跌幅</div>
              <div className={`text-sm md:text-base lg:text-sm font-bold leading-tight ${stats.isPositive ? 'text-red-600' : 'text-green-600'}`}>
                <span className="block break-all">
                  {stats.isPositive ? '+' : ''}{stats.changePercent.toFixed(2)}%
                </span>
              </div>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 md:p-4 lg:p-3 text-center min-h-[80px] md:min-h-[90px] lg:min-h-[90px] flex flex-col justify-center touch-manipulation">
              <div className="text-xs text-slate-500 uppercase tracking-wide mb-1 md:mb-2 leading-tight">区间</div>
              <div className="text-xs md:text-sm lg:text-xs font-semibold text-slate-700 leading-tight">
                <div className="flex flex-col lg:flex-row items-center justify-center lg:space-x-1 space-y-1 lg:space-y-0">
                  <span className="break-all">{stats.low.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
                  <span className="text-slate-400 hidden lg:inline">-</span>
                  <span className="text-slate-400 lg:hidden">至</span>
                  <span className="break-all">{stats.high.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 图表区域 - 移动端优化 */}
      <div className="h-64 md:h-72 lg:h-80 w-full touch-manipulation">
        <Line data={chartData} options={options} />
      </div>

      {/* 数据来源透明度信息 - 移动端优化 */}
      {dataSourceInfo && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between text-xs text-slate-500 gap-3 md:gap-2">
            <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4">
              <div className="flex items-center space-x-1 touch-manipulation">
                <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                <span className="break-all">数据来源: {dataSourceInfo.sources.join(', ')}</span>
              </div>
              <div className="flex items-center space-x-1 touch-manipulation">
                <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <span className="break-all">更新时间: {dataSourceInfo.lastUpdated.toLocaleString('zh-CN')}</span>
              </div>
            </div>
            <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4">
              <div className="flex items-center space-x-1 touch-manipulation">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${dataSourceInfo.isReal ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                <span>{dataSourceInfo.isReal ? '真实数据' : '模拟数据'}</span>
              </div>
              <div className="flex items-center space-x-1 touch-manipulation">
                <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1zM3 16a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
                </svg>
                <span>{dataSourceInfo.dataPoints} 个数据点</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};