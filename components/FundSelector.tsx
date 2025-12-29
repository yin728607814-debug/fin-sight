/**
 * 基金选择器组件
 * 用于选择纳斯达克100基金产品
 */

import React, { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { FundProduct } from '../types';
import { fundDataService } from '../services/fundDataService';

/**
 * 基金选择器Props
 */
interface FundSelectorProps {
  selectedFund?: FundProduct;
  onSelect: (fund: FundProduct) => void;
}

/**
 * 基金选择器组件
 */
export const FundSelector: React.FC<FundSelectorProps> = ({
  selectedFund,
  onSelect
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFunds, setFilteredFunds] = useState<FundProduct[]>([]);

  /**
   * 初始加载和搜索
   */
  useEffect(() => {
    const funds = fundDataService.searchFunds(searchQuery);
    setFilteredFunds(funds);
  }, [searchQuery]);

  /**
   * 处理基金选择
   */
  const handleSelect = (fund: FundProduct) => {
    onSelect(fund);
  };

  return (
    <div className="space-y-4">
      {/* 搜索框 */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="搜索基金名称或代码..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        />
      </div>

      {/* 基金列表 */}
      <div className="max-h-96 overflow-y-auto space-y-2">
        {filteredFunds.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>未找到匹配的基金</p>
            <p className="text-sm mt-2">请尝试其他搜索关键词</p>
          </div>
        ) : (
          filteredFunds.map((fund) => (
            <button
              key={fund.code}
              onClick={() => handleSelect(fund)}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                selectedFund?.code === fund.code
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* 基金名称 */}
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                      {fund.shortName}
                    </h3>
                    {selectedFund?.code === fund.code && (
                      <CheckCircleIcon className="h-5 w-5 text-blue-500" />
                    )}
                  </div>
                  
                  {/* 基金代码 */}
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    代码: {fund.code}
                  </p>
                  
                  {/* 基金公司和跟踪指数 */}
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                      {fund.company}
                    </span>
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                      {fund.trackingIndex}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* 完整名称（小字） */}
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                {fund.name}
              </p>
            </button>
          ))
        )}
      </div>

      {/* 提示信息 */}
      {selectedFund && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            已选择: <span className="font-semibold">{selectedFund.shortName}</span>
          </p>
        </div>
      )}
    </div>
  );
};
