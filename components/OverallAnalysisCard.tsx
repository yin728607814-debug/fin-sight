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
    },
    mixed: {
      bg: 'bg-yellow-50 border-yellow-200',
      text: 'text-yellow-800',
      icon: (
        <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
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

  // 根据影响类型选择渐变背景
  const gradientBg = {
    positive: 'from-emerald-50 via-green-50 to-teal-50',
    negative: 'from-rose-50 via-red-50 to-pink-50',
    neutral: 'from-slate-50 via-gray-50 to-zinc-50',
    mixed: 'from-yellow-50 via-amber-50 to-orange-50'
  };

  return (
    <div className={`relative rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br ${gradientBg[analysis.impact]}`}>
      {/* 玻璃态背景层 */}
      <div className="absolute inset-0 bg-white/40 backdrop-blur-xl"></div>
      
      {/* 装饰性渐变光晕 */}
      <div className={`absolute top-0 right-0 w-96 h-96 bg-gradient-to-br ${
        analysis.impact === 'positive' ? 'from-green-200/30 to-emerald-300/20' :
        analysis.impact === 'negative' ? 'from-red-200/30 to-rose-300/20' :
        analysis.impact === 'mixed' ? 'from-yellow-200/30 to-amber-300/20' :
        'from-blue-200/30 to-indigo-300/20'
      } rounded-full blur-3xl -translate-y-1/2 translate-x-1/2`}></div>
      
      {/* 内容层 */}
      <div className="relative p-8">
        {/* 标题栏 */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start space-x-4">
            <div className={`p-3 rounded-2xl ${
              analysis.impact === 'positive' ? 'bg-green-500/10 backdrop-blur-sm' :
              analysis.impact === 'negative' ? 'bg-red-500/10 backdrop-blur-sm' :
              analysis.impact === 'mixed' ? 'bg-yellow-500/10 backdrop-blur-sm' :
              'bg-gray-500/10 backdrop-blur-sm'
            }`}>
              {impactStyle.icon}
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-900 mb-1">
                {assetName} 整体市场分析
              </h3>
              <p className="text-sm text-slate-600 flex items-center space-x-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span>基于 {analysis.analyzedNewsCount} 条最新新闻</span>
                <span className="text-slate-400">·</span>
                <span>{new Date(analysis.timestamp).toLocaleString('zh-CN')}</span>
              </p>
            </div>
          </div>
          
          <div className="flex flex-col items-end space-y-2">
            <span className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold backdrop-blur-sm ${riskStyle.bg} ${riskStyle.text} shadow-lg`}>
              <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {riskStyle.label}
            </span>
            <span className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold bg-blue-500/10 text-blue-700 backdrop-blur-sm shadow-lg">
              <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              {timeHorizonLabels[analysis.timeHorizon]}
            </span>
          </div>
        </div>

        {/* 置信度指示器 */}
        <div className="mb-6 bg-white/50 backdrop-blur-sm rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-sm mb-3">
            <span className="text-slate-700 font-medium flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              分析置信度
            </span>
            <span className="font-bold text-lg text-slate-900">{(analysis.confidence * 100).toFixed(0)}%</span>
          </div>
          <div className="relative w-full h-3 bg-slate-200/50 rounded-full overflow-hidden">
            <div 
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-1000 ease-out shadow-lg"
              style={{ width: `${analysis.confidence * 100}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* 综合分析摘要 */}
        <div className="mb-6 bg-white/50 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
          <h4 className="text-base font-bold text-slate-900 mb-3 flex items-center">
            <span className="inline-block w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mr-3 shadow-lg">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
              </svg>
            </span>
            综合分析
          </h4>
          <p className="text-slate-700 leading-relaxed whitespace-pre-wrap text-sm">
            {analysis.summary}
          </p>
        </div>

        {/* 投资建议 */}
        <div className="mb-6 bg-gradient-to-br from-amber-50/80 to-orange-50/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-amber-200/50">
          <h4 className="text-base font-bold text-slate-900 mb-3 flex items-center">
            <span className="inline-block w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mr-3 shadow-lg">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
              </svg>
            </span>
            投资建议
          </h4>
          <p className="text-slate-800 leading-relaxed whitespace-pre-wrap text-sm font-medium">
            {analysis.investmentAdvice}
          </p>
        </div>

        {/* 关键影响因素 */}
        <div className="mb-6 bg-white/50 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
          <h4 className="text-base font-bold text-slate-900 mb-4 flex items-center">
            <span className="inline-block w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mr-3 shadow-lg">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clipRule="evenodd" />
              </svg>
            </span>
            关键影响因素
          </h4>
          <div className="grid gap-3">
            {analysis.keyFactors.map((factor, index) => (
              <div key={index} className="flex items-start group hover:bg-white/60 rounded-xl p-3 transition-all duration-200">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-sm font-bold mr-3 shadow-md group-hover:scale-110 transition-transform flex-shrink-0">
                  {index + 1}
                </span>
                <span className="text-slate-700 flex-1 text-sm leading-relaxed">{factor}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 趋势预测 */}
        <div className="bg-gradient-to-br from-indigo-50/80 to-purple-50/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-indigo-200/50">
          <h4 className="text-base font-bold text-slate-900 mb-3 flex items-center">
            <span className="inline-block w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mr-3 shadow-lg">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
            </span>
            趋势预测
          </h4>
          <p className="text-slate-800 leading-relaxed whitespace-pre-wrap text-sm font-medium">
            {analysis.predictedTrend}
          </p>
        </div>

        {/* 免责声明 */}
        <div className="mt-6 pt-5 border-t border-slate-300/50">
          <div className="flex items-center justify-center space-x-2 text-xs text-slate-500 bg-slate-100/50 backdrop-blur-sm rounded-xl px-4 py-3">
            <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>以上分析仅供参考，不构成投资建议。投资有风险，入市需谨慎。</span>
          </div>
        </div>
      </div>
    </div>
  );
};
