/**
 * 添加持仓弹窗组件
 * 用于添加新的投资持仓
 */

import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { AssetType } from '../types';
import { Position } from '../services/portfolioService';

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
  const [quantity, setQuantity] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [buyDate, setBuyDate] = useState(new Date().toISOString().split('T')[0]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  /**
   * 验证表单
   */
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!quantity || parseFloat(quantity) <= 0) {
      newErrors.quantity = '数量必须大于0';
    }

    if (!buyPrice || parseFloat(buyPrice) <= 0) {
      newErrors.buyPrice = '买入价格必须大于0';
    }

    if (!buyDate) {
      newErrors.buyDate = '请选择买入日期';
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

    const assetName = assetType === 'gold' ? '现货黄金' : '纳斯达克100';

    onAdd({
      assetType,
      assetName,
      quantity: parseFloat(quantity),
      buyPrice: parseFloat(buyPrice),
      buyDate: new Date(buyDate)
    });

    // 重置表单
    setQuantity('');
    setBuyPrice('');
    setBuyDate(new Date().toISOString().split('T')[0]);
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
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 资产类型 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                资产类型
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAssetType('nasdaq')}
                  className={`px-4 py-3 rounded-lg border-2 transition-all ${
                    assetType === 'nasdaq'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
                >
                  纳斯达克100
                </button>
                <button
                  type="button"
                  onClick={() => setAssetType('gold')}
                  className={`px-4 py-3 rounded-lg border-2 transition-all ${
                    assetType === 'gold'
                      ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                      : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
                >
                  现货黄金
                </button>
              </div>
            </div>

            {/* 数量 */}
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                数量
              </label>
              <input
                type="number"
                id="quantity"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                step="0.01"
                min="0"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                  errors.quantity
                    ? 'border-red-500 dark:border-red-400'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="请输入数量"
              />
              {errors.quantity && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.quantity}</p>
              )}
            </div>

            {/* 买入价格 */}
            <div>
              <label htmlFor="buyPrice" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                买入价格
              </label>
              <input
                type="number"
                id="buyPrice"
                value={buyPrice}
                onChange={(e) => setBuyPrice(e.target.value)}
                step="0.01"
                min="0"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                  errors.buyPrice
                    ? 'border-red-500 dark:border-red-400'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="请输入买入价格"
              />
              {errors.buyPrice && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.buyPrice}</p>
              )}
            </div>

            {/* 买入日期 */}
            <div>
              <label htmlFor="buyDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                买入日期
              </label>
              <input
                type="date"
                id="buyDate"
                value={buyDate}
                onChange={(e) => setBuyDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                  errors.buyDate
                    ? 'border-red-500 dark:border-red-400'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              {errors.buyDate && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.buyDate}</p>
              )}
            </div>

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
                添加
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
