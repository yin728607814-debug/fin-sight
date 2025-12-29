/**
 * 添加持仓弹窗组件
 * 用于添加新的投资持仓
 */

import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { AssetType, AutoInvestPlan } from '../types';
import { Position } from '../services/portfolioService';
import { AutoInvestSettings } from './AutoInvestSettings';

/**
 * 添加持仓弹窗Props
 */
interface AddPositionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (position: Omit<Position, 'id'>) => void;
}

/**
 * 添加持仓弹窗组件
 */
export const AddPositionModal: React.FC<AddPositionModalProps> = ({
  isOpen,
  onClose,
  onAdd
}) => {
  const [assetType, setAssetType] = useState<AssetType>('nasdaq');
  
  // 纳斯达克字段
  const [fundName, setFundName] = useState('');
  const [nasdaqInvestment, setNasdaqInvestment] = useState('');
  const [nasdaqProfit, setNasdaqProfit] = useState('');
  const [autoInvest, setAutoInvest] = useState<AutoInvestPlan | undefined>();
  
  // 黄金字段
  const [goldGrams, setGoldGrams] = useState('');
  const [goldInvestment, setGoldInvestment] = useState('');
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  /**
   * 验证表单
   */
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (assetType === 'nasdaq') {
      if (!fundName.trim()) {
        newErrors.fundName = '请输入基金名称';
      }
      if (!nasdaqInvestment || parseFloat(nasdaqInvestment) <= 0) {
        newErrors.investment = '持仓金额必须大于0';
      }
      if (!nasdaqProfit || parseFloat(nasdaqProfit) === 0) {
        newErrors.profit = '请输入持仓收益';
      }
    } else {
      if (!goldGrams || parseFloat(goldGrams) <= 0) {
        newErrors.grams = '克数必须大于0';
      }
      if (!goldInvestment || parseFloat(goldInvestment) <= 0) {
        newErrors.investment = '持仓金额必须大于0';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * 处理提交
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const now = new Date();

    if (assetType === 'nasdaq') {
      onAdd({
        assetType: 'nasdaq',
        assetName: fundName.trim(),
        fundName: fundName.trim(),
        investmentAmount: parseFloat(nasdaqInvestment),
        profitLoss: parseFloat(nasdaqProfit),
        autoInvest,
        createdAt: now,
        updatedAt: now
      });
    } else {
      const grams = parseFloat(goldGrams);
      const investment = parseFloat(goldInvestment);
      const averagePrice = investment / grams;
      
      onAdd({
        assetType: 'gold',
        assetName: '现货黄金',
        quantity: grams,
        averageBuyPrice: averagePrice,
        investmentAmount: investment,
        profitLoss: 0, // 初始收益为0，后续根据当前价格计算
        createdAt: now,
        updatedAt: now
      });
    }

    // 重置表单
    resetForm();
    onClose();
  };

  /**
   * 重置表单
   */
  const resetForm = () => {
    setFundName('');
    setNasdaqInvestment('');
    setNasdaqProfit('');
    setGoldGrams('');
    setGoldInvestment('');
    setAutoInvest(undefined);
    setErrors({});
  };

  /**
   * 处理资产类型切换
   */
  const handleAssetTypeChange = (newType: AssetType) => {
    setAssetType(newType);
    resetForm();
  };

  /**
   * 处理关闭
   */
  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* 背景遮罩 */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />

      {/* 弹窗内容 */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* 头部 */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              添加持仓
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* 表单 */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 资产类型选择 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                资产类型
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleAssetTypeChange('nasdaq')}
                  className={`px-4 py-3 rounded-lg border-2 transition-all ${
                    assetType === 'nasdaq'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  纳斯达克100
                </button>
                <button
                  type="button"
                  onClick={() => handleAssetTypeChange('gold')}
                  className={`px-4 py-3 rounded-lg border-2 transition-all ${
                    assetType === 'gold'
                      ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  现货黄金
                </button>
              </div>
            </div>

            {/* 纳斯达克表单 */}
            {assetType === 'nasdaq' && (
              <>
                {/* 基金名称 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    基金名称
                  </label>
                  <input
                    type="text"
                    value={fundName}
                    onChange={(e) => setFundName(e.target.value)}
                    placeholder="例如：广发纳斯达克100ETF联接(QDII)C人民币"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 ${
                      errors.fundName ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.fundName && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.fundName}</p>
                  )}
                </div>

                {/* 持仓金额 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    持仓金额（元）
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={nasdaqInvestment}
                    onChange={(e) => setNasdaqInvestment(e.target.value)}
                    placeholder="例如：10000"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 ${
                      errors.investment ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.investment && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.investment}</p>
                  )}
                </div>

                {/* 持仓收益 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    持仓收益（元）
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={nasdaqProfit}
                    onChange={(e) => setNasdaqProfit(e.target.value)}
                    placeholder="例如：500（可以是负数）"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 ${
                      errors.profit ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.profit && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.profit}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    盈利输入正数，亏损输入负数
                  </p>
                </div>

                {/* 定投设置 */}
                <AutoInvestSettings
                  value={autoInvest}
                  onChange={setAutoInvest}
                />
              </>
            )}

            {/* 黄金表单 */}
            {assetType === 'gold' && (
              <>
                {/* 克数 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    持仓克数
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={goldGrams}
                    onChange={(e) => setGoldGrams(e.target.value)}
                    placeholder="例如：10"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 ${
                      errors.grams ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.grams && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.grams}</p>
                  )}
                </div>

                {/* 持仓金额 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    持仓金额（元）
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={goldInvestment}
                    onChange={(e) => setGoldInvestment(e.target.value)}
                    placeholder="例如：5200"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 ${
                      errors.investment ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.investment && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.investment}</p>
                  )}
                  {goldGrams && goldInvestment && parseFloat(goldGrams) > 0 && parseFloat(goldInvestment) > 0 && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      均价：¥{(parseFloat(goldInvestment) / parseFloat(goldGrams)).toFixed(2)}/克
                    </p>
                  )}
                </div>
              </>
            )}

            {/* 按钮 */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                添加
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
