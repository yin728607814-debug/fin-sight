/**
 * ImpactIndicator组件 - 影响指示器
 * 显示新闻对市场的影响程度和方向
 */

import React from 'react';
import { ImpactIndicatorProps, ImpactType } from '../types';

/**
 * 影响指示器组件
 */
export const ImpactIndicator: React.FC<ImpactIndicatorProps> = ({ 
  impact, 
  confidence, 
  summary 
}) => {
  /**
   * 获取影响类型的样式配置
   */
  const getImpactConfig = (impactType: ImpactType) => {
    switch (impactType) {
      case 'positive':
        return {
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-800',
          iconColor: 'text-green-600',
          label: '利好',
          icon: (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
            </svg>
          )
        };
      case 'negative':
        return {
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800',
          iconColor: 'text-red-600',
          label: '利空',
          icon: (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
            </svg>
          )
        };
      default:
        return {
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-800',
          iconColor: 'text-gray-600',
          label: '中性',
          icon: (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd" />
            </svg>
          )
        };
    }
  };

  /**
   * 获取置信度等级
   */
  const getConfidenceLevel = (confidence: number) => {
    if (confidence >= 0.8) return { level: '高', color: 'text-green-600' };
    if (confidence >= 0.6) return { level: '中', color: 'text-yellow-600' };
    if (confidence >= 0.4) return { level: '低', color: 'text-orange-600' };
    return { level: '很低', color: 'text-red-600' };
  };

  const config = getImpactConfig(impact);
  const confidenceLevel = getConfidenceLevel(confidence);

  return (
    <div className={`inline-flex flex-col items-center p-3 rounded-lg border ${config.bgColor} ${config.borderColor} min-w-[120px]`}>
      {/* 影响图标和标签 */}
      <div className="flex items-center space-x-2 mb-2">
        <div className={config.iconColor}>
          {config.icon}
        </div>
        <span className={`text-sm font-semibold ${config.textColor}`}>
          {config.label}
        </span>
      </div>

      {/* 置信度显示 */}
      <div className="w-full mb-2">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-slate-600">置信度</span>
          <span className={`text-xs font-medium ${confidenceLevel.color}`}>
            {confidenceLevel.level}
          </span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-1.5">
          <div 
            className={`h-1.5 rounded-full transition-all duration-300 ${
              confidence >= 0.8 ? 'bg-green-500' :
              confidence >= 0.6 ? 'bg-yellow-500' :
              confidence >= 0.4 ? 'bg-orange-500' : 'bg-red-500'
            }`}
            style={{ width: `${Math.max(confidence * 100, 5)}%` }}
          />
        </div>
        <div className="text-center mt-1">
          <span className="text-xs text-slate-500">
            {(confidence * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      {/* 摘要提示 */}
      {summary && (
        <div className="relative group">
          <button className="text-xs text-slate-500 hover:text-slate-700 underline decoration-dotted">
            查看摘要
          </button>
          
          {/* 悬浮提示框 */}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 w-64">
            <div className="max-h-20 overflow-y-auto">
              {summary}
            </div>
            {/* 箭头 */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-900"></div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * 简化版影响指示器 - 用于列表显示
 */
export const CompactImpactIndicator: React.FC<ImpactIndicatorProps> = ({ 
  impact, 
  confidence 
}) => {
  const config = getImpactConfig(impact);

  return (
    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor} border ${config.borderColor}`}>
      <div className={`mr-1 ${config.iconColor}`}>
        {React.cloneElement(config.icon, { className: 'w-3 h-3' })}
      </div>
      <span>{config.label}</span>
      <span className="ml-1 text-slate-500">
        {(confidence * 100).toFixed(0)}%
      </span>
    </div>
  );
};

/**
 * 获取影响类型配置的辅助函数
 */
function getImpactConfig(impactType: ImpactType) {
  switch (impactType) {
    case 'positive':
      return {
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        textColor: 'text-green-800',
        iconColor: 'text-green-600',
        label: '利好',
        icon: (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
          </svg>
        )
      };
    case 'negative':
      return {
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-800',
        iconColor: 'text-red-600',
        label: '利空',
        icon: (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
          </svg>
        )
      };
    default:
      return {
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200',
        textColor: 'text-gray-800',
        iconColor: 'text-gray-600',
        label: '中性',
        icon: (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd" />
          </svg>
        )
      };
  }
}