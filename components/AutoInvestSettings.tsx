/**
 * 定投设置组件
 * 用于配置定期定额投资计划
 */

import React, { useState, useEffect } from 'react';
import { AutoInvestPlan } from '../types';

/**
 * 定投设置Props
 */
interface AutoInvestSettingsProps {
  autoInvest?: AutoInvestPlan;
  onChange: (autoInvest: AutoInvestPlan | undefined) => void;
}

/**
 * 定投设置组件
 */
export const AutoInvestSettings: React.FC<AutoInvestSettingsProps> = ({
  autoInvest,
  onChange
}) => {
  const [enabled, setEnabled] = useState(autoInvest?.enabled || false);
  const [amount, setAmount] = useState(autoInvest?.amount?.toString() || '');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'quarterly'>(
    autoInvest?.frequency || 'monthly'
  );
  const [startDate, setStartDate] = useState(
    autoInvest?.startDate 
      ? new Date(autoInvest.startDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  /**
   * 当 autoInvest prop 改变时，重置状态
   */
  useEffect(() => {
    setEnabled(autoInvest?.enabled || false);
    setAmount(autoInvest?.amount?.toString() || '');
    setFrequency(autoInvest?.frequency || 'monthly');
    setStartDate(
      autoInvest?.startDate 
        ? new Date(autoInvest.startDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0]
    );
    setErrors({});
  }, [autoInvest]);

  /**
   * 验证表单
   */
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (enabled) {
      if (!amount || parseFloat(amount) <= 0) {
        newErrors.amount = '定投金额必须大于0';
      }

      if (!startDate) {
        newErrors.startDate = '请选择首次扣款日期';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * 更新定投计划
   */
  useEffect(() => {
    if (!enabled) {
      onChange(undefined);
      return;
    }

    if (!validateForm()) {
      return;
    }

    const startDateObj = new Date(startDate);
    const nextDate = new Date(startDate);

    onChange({
      enabled: true,
      amount: parseFloat(amount),
      frequency,
      startDate: startDateObj,
      nextDate
    });
  }, [enabled, amount, frequency, startDate]);

  /**
   * 处理开关切换
   */
  const handleToggle = (checked: boolean) => {
    setEnabled(checked);
    if (!checked) {
      setErrors({});
    }
  };

  /**
   * 获取频率描述
   */
  const getFrequencyDescription = (freq: 'daily' | 'weekly' | 'monthly' | 'quarterly'): string => {
    switch (freq) {
      case 'daily':
        return '每天';
      case 'weekly':
        return '每周';
      case 'monthly':
        return '每月';
      case 'quarterly':
        return '每季度';
    }
  };

  return (
    <div className="space-y-4">
      {/* 定投开关 */}
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            启用定投计划
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            设置定期定额投资，系统将提醒您按时投资
          </p>
        </div>
        <button
          type="button"
          onClick={() => handleToggle(!enabled)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            enabled
              ? 'bg-blue-500 dark:bg-blue-600'
              : 'bg-gray-200 dark:bg-gray-700'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              enabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* 定投设置（仅在启用时显示） */}
      {enabled && (
        <div className="space-y-4 pt-2 border-t border-gray-200 dark:border-gray-700">
          {/* 定投金额 */}
          <div>
            <label htmlFor="autoInvestAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              定投金额（元）
            </label>
            <input
              type="number"
              id="autoInvestAmount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              step="1"
              min="0"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                errors.amount
                  ? 'border-red-500 dark:border-red-400'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="例如: 1000"
            />
            {errors.amount && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.amount}</p>
            )}
          </div>

          {/* 定投周期 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              定投周期
            </label>
            <div className="grid grid-cols-4 gap-3">
              <button
                type="button"
                onClick={() => setFrequency('daily')}
                className={`px-4 py-2 rounded-lg border-2 transition-all ${
                  frequency === 'daily'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
                }`}
              >
                每天
              </button>
              <button
                type="button"
                onClick={() => setFrequency('weekly')}
                className={`px-4 py-2 rounded-lg border-2 transition-all ${
                  frequency === 'weekly'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
                }`}
              >
                每周
              </button>
              <button
                type="button"
                onClick={() => setFrequency('monthly')}
                className={`px-4 py-2 rounded-lg border-2 transition-all ${
                  frequency === 'monthly'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
                }`}
              >
                每月
              </button>
              <button
                type="button"
                onClick={() => setFrequency('quarterly')}
                className={`px-4 py-2 rounded-lg border-2 transition-all ${
                  frequency === 'quarterly'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
                }`}
              >
                每季度
              </button>
            </div>
          </div>

          {/* 首次扣款日期 */}
          <div>
            <label htmlFor="autoInvestStartDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              首次扣款日期
            </label>
            <input
              type="date"
              id="autoInvestStartDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                errors.startDate
                  ? 'border-red-500 dark:border-red-400'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
            />
            {errors.startDate && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.startDate}</p>
            )}
          </div>

          {/* 定投预览 */}
          {amount && parseFloat(amount) > 0 && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm text-green-800 dark:text-green-300">
                <span className="font-semibold">定投计划:</span> {getFrequencyDescription(frequency)}投资 ¥{parseFloat(amount).toLocaleString()} 元
              </p>
              <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                首次扣款: {new Date(startDate).toLocaleDateString('zh-CN')}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
