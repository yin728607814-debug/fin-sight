/**
 * 个性化仪表盘页面
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Cog6ToothIcon,
  PlusIcon,
  XMarkIcon,
  ArrowLeftIcon 
} from '@heroicons/react/24/outline';
import { ThemeToggle } from '../components/ThemeToggle';
import { DashboardGrid } from '../components/DashboardGrid';
import { CardSelector } from '../components/CardSelector';
import { LayoutManager } from '../components/LayoutManager';
import { dashboardService, DashboardLayout, LayoutItem } from '../services/dashboardService';

/**
 * 仪表盘页面
 */
export const DashboardPage: React.FC = () => {
  const [currentLayout, setCurrentLayout] = useState<DashboardLayout>(() =>
    dashboardService.getCurrentLayout()
  );
  const [isEditMode, setIsEditMode] = useState(false);
  const [showCardSelector, setShowCardSelector] = useState(false);
  const [showLayoutManager, setShowLayoutManager] = useState(false);

  // 组件挂载时重新加载布局
  React.useEffect(() => {
    const layout = dashboardService.getCurrentLayout();
    setCurrentLayout(layout);
  }, []);

  /**
   * 布局变化处理
   */
  const handleLayoutChange = (items: LayoutItem[]) => {
    dashboardService.updateLayoutItems(currentLayout.id, items);
    setCurrentLayout({
      ...currentLayout,
      items,
    });
  };

  /**
   * 添加卡片
   */
  const handleAddCard = (cardId: string) => {
    dashboardService.addCardToLayout(currentLayout.id, cardId);
    const updatedLayout = dashboardService.getCurrentLayout();
    setCurrentLayout(updatedLayout);
    setShowCardSelector(false);
  };

  /**
   * 移除卡片
   */
  const handleRemoveCard = (cardId: string) => {
    if (!confirm('确定要移除这个卡片吗？')) return;
    
    dashboardService.removeCardFromLayout(currentLayout.id, cardId);
    const updatedLayout = dashboardService.getCurrentLayout();
    setCurrentLayout(updatedLayout);
  };

  /**
   * 切换布局
   */
  const handleSwitchLayout = (layout: DashboardLayout) => {
    setCurrentLayout(layout);
    dashboardService.setCurrentLayout(layout.id);
    setShowLayoutManager(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* 装饰性背景 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-400/20 dark:bg-purple-600/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-400/20 dark:bg-pink-600/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-blue-400/10 dark:bg-blue-600/5 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="relative bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl shadow-lg border-b border-white/20 dark:border-gray-700/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link
                to="/"
                className="flex items-center text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                返回首页
              </Link>
              <div className="ml-6 h-6 border-l border-gray-300/50 dark:border-gray-600/50" />
              <h1 className="ml-6 text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
                <svg className="h-6 w-6 mr-3 text-purple-500 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
                </svg>
                个性化仪表盘
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* 编辑模式切换 */}
              <button
                onClick={() => setIsEditMode(!isEditMode)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  isEditMode
                    ? 'bg-purple-500 text-white'
                    : 'bg-white/60 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300 border border-white/40 dark:border-gray-700/40'
                }`}
              >
                {isEditMode ? '完成编辑' : '编辑布局'}
              </button>

              {/* 添加卡片 */}
              {isEditMode && (
                <button
                  onClick={() => setShowCardSelector(true)}
                  className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  添加卡片
                </button>
              )}

              {/* 布局管理 */}
              <button
                onClick={() => setShowLayoutManager(true)}
                className="p-2 text-gray-700 dark:text-gray-300 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/40 dark:border-gray-700/40 rounded-lg hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all"
                title="布局管理"
              >
                <Cog6ToothIcon className="h-5 w-5" />
              </button>

              <div className="relative z-[9998]">
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentLayout.items.length === 0 ? (
          /* 空状态 */
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-full mb-4">
              <svg className="h-8 w-8 text-purple-500 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              开始自定义您的仪表盘
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              点击&ldquo;添加卡片&rdquo;按钮，选择您想要显示的内容
            </p>
            <button
              onClick={() => {
                setIsEditMode(true);
                setShowCardSelector(true);
              }}
              className="inline-flex items-center px-6 py-3 bg-purple-500 text-white font-medium rounded-lg hover:bg-purple-600 transition-colors"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              添加第一个卡片
            </button>
          </div>
        ) : (
          /* 网格布局 */
          <DashboardGrid
            layoutId={currentLayout.id}
            items={currentLayout.items}
            isEditMode={isEditMode}
            onLayoutChange={handleLayoutChange}
            onRemoveCard={handleRemoveCard}
          />
        )}
      </main>

      {/* 卡片选择器弹窗 */}
      {showCardSelector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/20 overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200/50 dark:border-gray-700/50">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                添加卡片
              </h2>
              <button
                onClick={() => setShowCardSelector(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <CardSelector
                currentCards={currentLayout.items.map(item => item.i)}
                onAddCard={handleAddCard}
              />
            </div>
          </div>
        </div>
      )}

      {/* 布局管理器弹窗 */}
      {showLayoutManager && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/20 overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200/50 dark:border-gray-700/50">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                布局管理
              </h2>
              <button
                onClick={() => setShowLayoutManager(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <LayoutManager
                currentLayout={currentLayout}
                onLayoutChange={handleSwitchLayout}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
