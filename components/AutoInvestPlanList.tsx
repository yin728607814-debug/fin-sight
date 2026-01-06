/**
 * 定投计划列表组件
 */

import React from 'react';
import { TrashIcon, PauseIcon, PlayIcon } from '@heroicons/react/24/outline';
import { AutoInvestPlan, autoInvestService } from '../services/autoInvestService';

interface AutoInvestPlanListProps {
  plans: AutoInvestPlan[];
  onUpdate: () => void;
}

export const AutoInvestPlanList: React.FC<AutoInvestPlanListProps> = ({ plans, onUpdate }) => {
  const handleToggle = async (planId: string, currentStatus: boolean) => {
    try {
      await autoInvestService.togglePlan(planId, !currentStatus);
      onUpdate();
    } catch (error) {
      console.error('切换定投计划状态失败:', error);
      alert('操作失败，请重试');
    }
  };

  const handleDelete = async (planId: string, fundName: string) => {
    if (!confirm(`确定要删除「${fundName}」的定投计划吗？`)) {
      return;
    }

    try {
      await autoInvestService.deletePlan(planId);
      onUpdate();
    } catch (error) {
      console.error('删除定投计划失败:', error);
      alert('删除失败，请重试');
    }
  };

  if (plans.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        暂无定投计划
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {plans.map((plan) => (
        <div
          key={plan.id}
          className={`p-4 rounded-lg border ${
            plan.is_enabled
              ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
              : 'bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-600 opacity-60'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  {plan.fund_name}
                </h4>
                {!plan.is_enabled && (
                  <span className="px-2 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                    已暂停
                  </span>
                )}
              </div>
              
              <div className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <div>
                  定投金额：
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    ¥{plan.invest_amount.toLocaleString()}
                  </span>
                </div>
                <div>
                  定投频率：
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {autoInvestService.getFrequencyLabel(plan.frequency, plan.invest_day)}
                  </span>
                </div>
                {plan.next_execution_date && (
                  <div>
                    下次执行：
                    <span className="font-medium text-blue-600 dark:text-blue-400">
                      {new Date(plan.next_execution_date).toLocaleDateString('zh-CN')}
                    </span>
                  </div>
                )}
                {plan.last_execution_date && (
                  <div className="text-xs text-gray-500 dark:text-gray-500">
                    上次执行：{new Date(plan.last_execution_date).toLocaleDateString('zh-CN')}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2 ml-4">
              <button
                onClick={() => handleToggle(plan.id, plan.is_enabled)}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                title={plan.is_enabled ? '暂停定投' : '启用定投'}
              >
                {plan.is_enabled ? (
                  <PauseIcon className="h-5 w-5" />
                ) : (
                  <PlayIcon className="h-5 w-5" />
                )}
              </button>
              
              <button
                onClick={() => handleDelete(plan.id, plan.fund_name)}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                title="删除定投计划"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
