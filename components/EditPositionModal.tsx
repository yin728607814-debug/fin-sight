/**
 * 编辑持仓弹窗组件
 * 用于编辑现有的投资持仓
 */

import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Position } from '../services/portfolioService';

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
  const [quantity, setQuantity] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [buyDate, setBuyDate] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  /**
   * 当position变化时更新表单
   */
  useEffect(() => {
    if (position) {
      setQuantity(position.quantity.toString());
      setBuyPrice(position.buyPrice.toString());
      setBuyDate(new Date(position.buyDate).toISOString().split('T')[0]);
    }
  }, [position]);

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

    if (!position || !validateForm()) {
      return;
    }

    onSave(position.id, {
      quantity: parseFloat(quantity),
      buyPrice: parseFloat(buyPrice),
      buyDate: new Date(buyDate)
    });

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
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 数量 */}
            <div>
              <label htmlFor="edit-quantity" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                数量
              </label>
              <input
                type="number"
                id="edit-quantity"
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
              <label htmlFor="edit-buyPrice" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                买入价格
              </label>
              <input
                type="number"
                id="edit-buyPrice"
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
              <label htmlFor="edit-buyDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                买入日期
              </label>
              <input
                type="date"
                id="edit-buyDate"
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
                保存
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
