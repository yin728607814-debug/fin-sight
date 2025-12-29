/**
 * 基金配置页面
 * 管理用户自定义的基金列表
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftIcon, PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { ThemeToggle } from '../components/ThemeToggle';
import { fundConfigService, FundConfig } from '../services/fundConfigService';

export const FundConfigPage: React.FC = () => {
  const [funds, setFunds] = useState<FundConfig[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingFund, setEditingFund] = useState<FundConfig | null>(null);
  const [fundName, setFundName] = useState('');
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadFunds();
  }, []);

  const loadFunds = () => {
    const allFunds = fundConfigService.getFunds();
    setFunds(allFunds);
  };

  const handleAdd = () => {
    setError('');
    if (!fundName.trim()) {
      setError('请输入基金名称');
      return;
    }

    try {
      fundConfigService.addFund(fundName);
      setFundName('');
      setIsAddModalOpen(false);
      loadFunds();
    } catch (err) {
      const error = err as Error;
      setError(error.message);
    }
  };

  const handleUpdate = () => {
    if (!editingFund) return;
    
    setError('');
    if (!fundName.trim()) {
      setError('请输入基金名称');
      return;
    }

    try {
      fundConfigService.updateFund(editingFund.id, fundName);
      setFundName('');
      setEditingFund(null);
      loadFunds();
    } catch (err) {
      const error = err as Error;
      setError(error.message);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这个基金吗？')) {
      fundConfigService.deleteFund(id);
      loadFunds();
    }
  };

  const openAddModal = () => {
    setFundName('');
    setError('');
    setEditingFund(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (fund: FundConfig) => {
    setFundName(fund.name);
    setError('');
    setEditingFund(fund);
    setIsAddModalOpen(true);
  };

  const closeModal = () => {
    setIsAddModalOpen(false);
    setEditingFund(null);
    setFundName('');
    setError('');
  };

  const filteredFunds = searchQuery.trim()
    ? fundConfigService.searchFunds(searchQuery)
    : funds;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* 装饰性背景 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/20 dark:bg-blue-600/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-400/20 dark:bg-indigo-600/10 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="relative bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl shadow-lg border-b border-white/20 dark:border-gray-700/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link
                to="/portfolio"
                className="flex items-center text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                返回投资组合
              </Link>
              <div className="ml-6 h-6 border-l border-gray-300/50 dark:border-gray-600/50" />
              <h1 className="ml-6 text-xl font-bold text-gray-900 dark:text-gray-100">
                基金配置
              </h1>
            </div>
            
            <div className="relative z-[9998]">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/20 p-6">
          {/* 顶部操作栏 */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex-1 max-w-md">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索基金名称..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
            <button
              onClick={openAddModal}
              className="ml-4 flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-sm"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              添加基金
            </button>
          </div>

          {/* 基金列表 */}
          {filteredFunds.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 dark:text-gray-500 mb-2">
                <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                {searchQuery ? '没有找到匹配的基金' : '暂无基金配置'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                点击&ldquo;添加基金&rdquo;开始配置
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFunds.map((fund) => (
                <div
                  key={fund.id}
                  className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                >
                  <div className="flex-1">
                    <h3 className="text-base font-medium text-gray-900 dark:text-gray-100">
                      {fund.name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      添加于 {fund.createdAt.toLocaleDateString('zh-CN')}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => openEditModal(fund)}
                      className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      title="编辑"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(fund.id)}
                      className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      title="删除"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 统计信息 */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              共 {funds.length} 个基金配置
            </p>
          </div>
        </div>
      </main>

      {/* 添加/编辑弹窗 */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={closeModal}
          />
          
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                {editingFund ? '编辑基金' : '添加基金'}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    基金名称
                  </label>
                  <input
                    type="text"
                    value={fundName}
                    onChange={(e) => setFundName(e.target.value)}
                    placeholder="例如：广发纳斯达克100ETF联接(QDII)C人民币"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                    autoFocus
                  />
                  {error && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
                  )}
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={closeModal}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={editingFund ? handleUpdate : handleAdd}
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    {editingFund ? '保存' : '添加'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FundConfigPage;
