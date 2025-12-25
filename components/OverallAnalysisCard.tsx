/**
 * OverallAnalysisCard组件 - 整体市场分析展示
 * 显示基于所有新闻的综合市场分析和投资建议
 */

import React from 'react';
import { OverallMarketAnalysis, ImpactType } from '../types';

interface OverallAnalysisCardProps {
  analysis: OverallMarketAnalysis | null;
  loading?: boolean;
}

/**
 * 整体分析卡片组件
 */
export const OverallAnalysisCard: React.FC<OverallAnalysisCardProps> = ({ 
  analysis, 
  loading = false 
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-slate-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-slate-200 rounded"></div>
            <div className="h-4 bg-slate-200 rounded w-5/6"></div>
            <div className="h-4 bg-slate-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return null;
  }

  const assetName = analysis.assetType === 'gold' ? '现货黄金' : '纳斯达克100';

  // 影响类型的样式映射
  const impactStyles: Record<ImpactType, { bg: string; text: string; icon: JSX.Element }> = {
    positive: {
      bg: 'bg-green-50 border-green-200',
      text: 'text-green-800',
      icon: (
        <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
        </svg>
      )
    },
    negative: {
      bg: 'bg-red-50 border-red-200',
      text: 'text-red-800',
      icon: (
        <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
        </svg>
      )
    },
    neutral: {
      bg: 'bg-gray-50 border-gray-200',
      text: 'text-gray-800',
      icon: (
        <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd" />
        </svg>
      )
    }
  };

  // 风险等级的样式映射
  const riskStyles = {
    low: { bg: 'bg-green-100', text: 'text-green-800', label: '低风险' },
    medium: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: '中等风险' },
    high: { bg: 'bg-red-100', text: 'text-red-800', label: '高风险' }
  };

  // 时间框架的映射
  const timeHorizonLabels = {
    short: '短期（1-7天）',
    medium: '中期（1-4周）',
    long: '长期（1-3月）'
  };

  const impactStyle = impactStyles[analysis.impact];
  const riskStyle = riskStyles[analysis.riskLevel];

  return (
    <div className={`rounded-lg shadow-sm border-2 p-6 ${impactStyle.bg}`}>
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          {impactStyle.icon}
          <div>
            <h3 className="text-xl font-bold text-slate-900">
              {assetName} 整体市场分析
            </h3>
            <p className="text-sm text-slate-600">
              基于 {analysis.analyzedNewsCount} 条最新新闻 · {new Date(analysis.timestamp).toLocaleString('zh-CN')}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${riskStyle.bg} ${riskStyle.text}`}>
            {riskStyle.label}
          </span>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            {timeHorizonLabels[analysis.timeHorizon]}
          </span>
        </div>
      </div>

      {/* 置信度指示器 */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-slate-600">分析置信度</span>
          <span className="font-medium text-slate-900">{(analysis.confidence * 100).toFixed(0)}%</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
            style={{ width: `${analysis.confidence * 100}%` }}
          ></div>
        </div>
      </div>

      {/* 综合分析摘要 */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-slate-900 mb-2">📊 综合分析</h4>
        <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
          {analysis.summary}
        </p>
      </div>

      {/* 投资建议 */}
      <div className="mb-4 bg-white bg-opacity-60 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-slate-900 mb-2 flex items-center">
          <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
            <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
          </svg>
          投资建议
        </h4>
        <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
          {analysis.investmentAdvice}
        </p>
      </div>

      {/* 关键影响因素 */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-slate-900 mb-2">🔑 关键影响因素</h4>
        <ul className="space-y-2">
          {analysis.keyFactors.map((factor, index) => (
            <li key={index} className="flex items-start">
              <span className="inline-block w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-medium flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                {index + 1}
              </span>
              <span className="text-slate-700 flex-1">{factor}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 趋势预测 */}
      <div className="bg-white bg-opacity-60 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-slate-900 mb-2 flex items-center">
          <svg className="w-5 h-5 mr-2 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
          </svg>
          趋势预测
        </h4>
        <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
          {analysis.predictedTrend}
        </p>
      </div>

      {/* 免责声明 */}
      <div className="mt-4 pt-4 border-t border-slate-300">
        <p className="text-xs text-slate-500 text-center">
          ⚠️ 以上分析仅供参考，不构成投资建议。投资有风险，入市需谨慎。
        </p>
      </div>
    </div>
  );
};
