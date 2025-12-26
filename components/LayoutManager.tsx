/**
 * 布局管理器组件
 */

import React, { useState } from 'react';
import { 
  PlusIcon, 
  TrashIcon, 
  ArrowPathIcon,
  CheckIcon 
} from '@heroicons/react/24/outline';
import { dashboardService, DashboardLayout } from '../services/dashboardService';

interface LayoutManagerProps {
  currentLayout: DashboardLayout;
  onLayoutChange: (layout: DashboardLayout) => void;
}

/**
 * 布局管理器
 */
export const LayoutManager: React.FC<LayoutManagerProps> = ({
  currentLayout,
  onLayoutChange,
}) => {
  const [layouts, setLayouts] = useState<DashboardLayout[]>(dashboardService.getLayouts());
  const [isCreating, setIsCreating] = useState(false);
  const [newLayoutName, setNewLayoutName] = useState('');

  /**
   * 创建新布局
   */
  const handleCreateLayout = () => {
    if (!newLayoutName.trim()) return;
    
    const newLayout = dashboardService.createLayout(newLayoutName.trim());
    setLayouts(dashboardService.getLayouts());
    setNewLayoutName('');
    setIsCreating(false);
    onLayoutChange(newLayout);
  };

  /**
   * 切换布局
   */
  const handleSwitchLayout = (layout: DashboardLayout) => {
    dashboardService.setCurrentLayout(layout.id);
    onLayoutChange(layout);
  };

  /**
   * 删除布局
   */
  const handleDeleteLayout = (layoutId: string) => {
    if (layoutId === 'default') {
      alert('默认布局不能删除');
      return;
    }
    
    if (!confirm('确定要删除这个布局吗？')) return;
    
    dashboardService.deleteLayout(layoutId);
    setLayouts(dashboardService.getLayouts());
    
    if (currentLayout.id === layoutId) {
      const defaultLayout = dashboardService.getDefaultLayout();
      onLayoutChange(defaultLayout);
    }
  };

  /**
   * 重置为默认布局
   */
  const handleResetToDefault = () => {
    if (!confirm('确定要重置为默认布局吗？这将覆盖当前布局。')) return;
    
    const defaultLayout = dashboardService.resetToDefault();
    setLayouts(dashboardService.getLayouts());
    onLayoutChange(defaultLayout);
  };

  return (
    <div className="space-y-4">
      {/* 当前布局 */}
      <div className="p-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl border border-blue-200/50 dark:border-blue-700/50">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">当前布局</div>
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {currentLayout.name}
            </div>
          </div>
          <button
            onClick={handleResetToDefault}
            className="flex items-center px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white/60 dark:bg-gray-800/60 rounded-lg hover:bg-white/80 dark:hover:bg-gray-800/80 transition-colors"
          >
            <ArrowPathIcon className="h-4 w-4 mr-1" />
            重置
          </button>
        </div>
      </div>

      {/* 布局列表 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            所有布局
          </h3>
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center px-3 py-2 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            新建
          </button>
        </div>

        {/* 新建布局表单 */}
        {isCreating && (
          <div className="p-3 bg-white/40 dark:bg-gray-800/40 rounded-lg border border-white/20 dark:border-gray-700/20">
            <div className="flex gap-2">
              <input
                type="text"
                value={newLayoutName}
                onChange={(e) => setNewLayoutName(e.target.value)}
                placeholder="输入布局名称"
                className="flex-1 px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && handleCreateLayout()}
              />
              <button
                onClick={handleCreateLayout}
                disabled={!newLayoutName.trim()}
                className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <CheckIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  setIsCreating(false);
                  setNewLayoutName('');
                }}
                className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        )}

        {/* 布局列表 */}
        {layouts.map(layout => (
          <div
            key={layout.id}
            className={`p-3 rounded-lg border transition-all ${
              layout.id === currentLayout.id
                ? 'bg-blue-50/50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700'
                : 'bg-white/40 dark:bg-gray-800/40 border-white/20 dark:border-gray-700/20 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <div className="flex items-center justify-between">
              <button
                onClick={() => handleSwitchLayout(layout)}
                className="flex-1 text-left"
              >
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {layout.name}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {layout.items.length} 个卡片
                </div>
              </button>
              
              {layout.id !== 'default' && (
                <button
                  onClick={() => handleDeleteLayout(layout.id)}
                  className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                  title="删除布局"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
