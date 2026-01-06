/**
 * 定投计划创建/编辑模态框
 */

import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { 
  AutoInvestPlan, 
  InvestFrequency, 
  autoInvestService 
} from '../services/autoInvestService';

interface AutoInvestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  assetType: 'nasdaq' | 'astock';
  fundName?: string;
  userId: string;
  existingPlan?: AutoInvestPlan | null;
}

export const AutoInvestModal: React.FC<AutoInvestModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  assetType,
  fundName: initialFundName,
  userId,
  existingPlan
}) => {
  const [fundName, setFundName] = useState(initialFundName || '');
  const [investAmount, setInvestAmount] = useState('');
  const [frequency, setFrequency] = useState<InvestFrequency>('monthly');
  const [investDay, setInvestDay] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 当模态框打开时，重置或填充表单
  useEffect(() => {
    if (isOpen) {
      if (existingPlan) {
        // 编辑模式：填充现有数据
        setFundName(existingPlan.fund_name);
        setInvestAmount(existingPlan.invest_amount.toString());
        setFrequency(existingPlan.frequency);
        setInvestDay(existingPlan.invest_day || 1);
      } else {
        // 创建模式：重置表单
        setFundName(initialFundName || '');
        setInvestAmount('');
        setFrequency('monthly');
        setInvestDay(1);
      }
      setError(null);
    }
  }, [isOpen, existingPlan, initialFundName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 验证
    if (!fundName.trim()) {
      setError('请输入基金名称');
      return;
    }

    const amount = parseFloat(investAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('请输入有效的定投金额');
      return;
    }

    if (frequency === 'weekly' && (investDay < 1 || investDay > 7)) {
      setError('每周定投日期必须在1-7之间');
      return;
    }

    if (frequency === 'monthly' && (investDay < 1 || investDay > 28)) {
      setError('每月定投日期必须在1-28之间');
      return;
    }

    setIsSubmitting(true);

    try {
      if (existingPlan) {
        // 更新现有计划
        await autoInvestService.updatePlan(existingPlan.id, {
          fund_name: fundName.trim(),
          invest_amount: amount,
          frequency,
          invest_day: frequency === 'daily' ? null : investDay
        });
      } else {
        // 创建新计划
        await autoInvestService.createPlan({
          user_id: userId,
          asset_type: assetType,
          fund_name: fundName.trim(),
          invest_amount: amount,
          frequency,
          invest_day: frequency === 'daily' ? null : investDay
        });
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error('保存定投计划失败:', err);
      setError(err instanceof Error ? err.message : '保存失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const assetLabel = assetType === 'nasdaq' ? '纳斯达克100' : 'A股基金';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* 背景遮罩 */}
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />

        {/* 模态框内容 */}
        <div className="relative w-full max-w-md transform rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-2xl transition-all">
          {/* 标题栏 */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {existingPlan ? '编辑定投计划' : '创建定投计划'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* 表单 */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 资产类型（只读） */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                资产类型
              </label>
              <div className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-gray-100">
                {assetLabel}
              </div>
            </div>

            {/* 基金名称 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                基金名称 *
              </label>
              <input
                type="text"
                value={fundName}
                onChange={(e) => setFundName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="例如：纳斯达克100ETF"
                disabled={!!initialFundName}
              />
            </div>

            {/* 定投金额 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                定投金额（元）*
              </label>
              <input
                type="number"
                value={investAmount}
                onChange={(e) => setInvestAmount(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="例如：100"
                min="0"
                step="0.01"
              />
            </div>

            {/* 定投频率 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                定投频率 *
              </label>
              <select
                value={frequency}
                onChange={(e) => {
                  setFrequency(e.target.value as InvestFrequency);
                  // 重置日期为默认值
                  if (e.target.value === 'weekly') {
                    setInvestDay(1); // 周一
                  } else if (e.target.value === 'monthly') {
                    setInvestDay(1); // 每月1号
                  }
                }}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="daily">每天</option>
                <option value="weekly">每周</option>
                <option value="monthly">每月</option>
              </select>
            </div>

            {/* 定投日期（仅周/月显示） */}
            {frequency === 'weekly' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  每周定投日 *
                </label>
                <select
                  value={investDay}
                  onChange={(e) => setInvestDay(parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={1}>周一</option>
                  <option value={2}>周二</option>
                  <option value={3}>周三</option>
                  <option value={4}>周四</option>
                  <option value={5}>周五</option>
                  <option value={6}>周六</option>
                  <option value={7}>周日</option>
                </select>
              </div>
            )}

            {frequency === 'monthly' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  每月定投日 *
                </label>
                <input
                  type="number"
                  value={investDay}
                  onChange={(e) => setInvestDay(parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="1"
                  max="28"
                  placeholder="1-28"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  建议选择1-28号，避免月末日期不存在的问题
                </p>
              </div>
            )}

            {/* 错误提示 */}
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* 按钮组 */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                disabled={isSubmitting}
              >
                取消
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                {isSubmitting ? '保存中...' : existingPlan ? '保存' : '创建'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
