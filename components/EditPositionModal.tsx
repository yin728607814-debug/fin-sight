/**
 * 编辑持仓弹窗组件
 * 用于编辑现有的投资持仓
 */

import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Position } from '../services/portfolioService';
import { AutoInvestSettings } from './AutoInvestSettings';
import { AutoInvestPlan } from '../types';

/**
 * 编辑持仓弹窗Props
 */
interface EditPositionModalProps {
  isOpen: boolean;
  position: Position | null;
  onClose: () => void;
  onSave: (id: string, updates: Partial<Position>) => void;
}

/**
 * 编辑持仓弹窗组件
 */
export const EditPositionModal: React.FC<EditPositionModalProps> = ({
  isOpen,
  position,
  onClose,
  onSave
}) => {
  // 纳斯达克字段
  const [nasdaqInvestment, setNasdaqInvestment] = useState('');
  const [nasdaqProfit, setNasdaqProfit] = useState('');
  const [autoInvest, setAutoInvest] = useState<AutoInvestPlan | undefined>();
  
  // 黄金字段
  const [goldGrams, setGoldGrams] = useState('');
  const [goldInvestment, setGoldInvestment] = useState('');
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  /**
   * 当position变化时更新表单
   */
  useEffect(() => {
    if (position) {
      if (position.assetType === 'nasdaq') {
        setNasdaqInvestment(position.investmentAmount.toString());
        setNasdaqProfit(position.profitLoss.toString());
        setAutoInvest(position.autoInvest);
      } else if (position.assetType === 'gold') {
        setGoldGrams(position.quantity?.toString() || '');
        setGoldInvestment(position.investmentAmount.toString());
      }
    }
  }, [position]);

  /**
   * 验证表单
   */
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!position) return false;

    if (position.assetType === 'nasdaq') {
      if (!nasdaqInvestment || parseFloat(nasdaqInvestment) <= 0) {
        newErrors.investment = '持仓金额必须大于0';
      }
      if (nasdaqProfit === '' || isNaN(parseFloat(nasdaqProfit))) {
        newErrors.profit = '请输入持仓收益';
      }
    } else if (position.assetType === 'gold') {
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

    if (!position || !validateForm()) {
      return;
    }

    if (position.assetType === 'nasdaq') {
      onSave(position.id, {
        investmentAmount: parseFloat(nasdaqInvestment),
        profitLoss: parseFloat(nasdaqProfit),
        autoInvest,
        updatedAt: new Date()
      });
    } else if (position.assetType === 'gold') {
      const grams = parseFloat(goldGrams);
      const investment = parseFloat(goldInvestment);
      const averagePrice = investment / grams;
      
      onSave(position.id, {
        quantity: grams,
        averageBuyPrice: averagePrice,
        investmentAmount: investment,
        updatedAt: new Date()
      });
    }

    setErrors({});
    onClose();
  };

  /**
   * 处理关闭
   */
  const handleClose = () => {
    setErrors({});
    onClose();
  };

  if (!isOpen || !position) return null;

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
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                编辑持仓
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {position.assetName}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* 表单 */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 纳斯达克表单 */}
            {position.assetType === 'nasdaq' && (
              <>
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
                  autoInvest={autoInvest}
                  onChange={setAutoInvest}
                />
              </>
            )}

            {/* 黄金表单 */}
            {position.assetType === 'gold' && (
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
                className="flex-1 px-4 py-2 bg-blue-500 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors shadow-sm"
              >
                保存
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
