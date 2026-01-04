/**
 * Supabase 测试页面
 * 用于测试 Supabase 后端存储功能
 */

import React, { useState } from 'react';
import { usePositions } from '../hooks/usePositions';
import { MigrationPrompt } from '../components/MigrationPrompt';
import { CreatePositionInput } from '../types/database';

export const SupabaseTestPage: React.FC = () => {
  const { 
    positions, 
    loading, 
    error, 
    refetch,
    createPosition, 
    updatePosition, 
    deletePosition,
    isSupabaseEnabled 
  } = usePositions();

  const [showMigration, setShowMigration] = useState(true);

  const handleTestCreate = async () => {
    try {
      const testPosition: CreatePositionInput = {
        asset_type: 'nasdaq',
        fund_name: '测试基金',
        investment_amount: 10000,
        profit_loss: 500
      };
      
      await createPosition(testPosition);
      alert('创建成功！');
    } catch (err) {
      alert('创建失败：' + (err instanceof Error ? err.message : '未知错误'));
    }
  };

  const handleTestUpdate = async (id: string) => {
    try {
      await updatePosition(id, {
        profit_loss: Math.random() * 1000 - 500
      });
      alert('更新成功！');
    } catch (err) {
      alert('更新失败：' + (err instanceof Error ? err.message : '未知错误'));
    }
  };

  const handleTestDelete = async (id: string) => {
    if (!confirm('确定删除吗？')) return;
    
    try {
      await deletePosition(id);
      alert('删除成功！');
    } catch (err) {
      alert('删除失败：' + (err instanceof Error ? err.message : '未知错误'));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* 迁移提示 */}
      {showMigration && (
        <MigrationPrompt onMigrationComplete={() => {
          setShowMigration(false);
          refetch();
        }} />
      )}

      <div className="max-w-4xl mx-auto">
        {/* 标题 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Supabase 后端存储测试
          </h1>
          <p className="text-gray-600">
            测试投资组合数据的 CRUD 操作
          </p>
        </div>

        {/* 状态卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-sm text-gray-600 mb-1">Supabase 状态</div>
            <div className="text-2xl font-bold">
              {isSupabaseEnabled ? (
                <span className="text-green-600">✓ 已连接</span>
              ) : (
                <span className="text-red-600">✗ 未配置</span>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-sm text-gray-600 mb-1">持仓数量</div>
            <div className="text-2xl font-bold text-blue-600">
              {positions.length}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-sm text-gray-600 mb-1">加载状态</div>
            <div className="text-2xl font-bold">
              {loading ? (
                <span className="text-yellow-600">加载中...</span>
              ) : (
                <span className="text-green-600">就绪</span>
              )}
            </div>
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-red-600 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <div className="font-semibold text-red-900">错误</div>
                <div className="text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">测试操作</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleTestCreate}
              disabled={!isSupabaseEnabled || loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              创建测试持仓
            </button>
            <button
              onClick={refetch}
              disabled={!isSupabaseEnabled || loading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              刷新数据
            </button>
          </div>
        </div>

        {/* 持仓列表 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            持仓列表 ({positions.length})
          </h2>

          {loading ? (
            <div className="text-center py-8 text-gray-500">
              加载中...
            </div>
          ) : positions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              暂无持仓数据
            </div>
          ) : (
            <div className="space-y-3">
              {positions.map(position => (
                <div
                  key={position.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          position.asset_type === 'nasdaq' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {position.asset_type === 'nasdaq' ? '纳斯达克' : '黄金'}
                        </span>
                        <span className="text-xs text-gray-500">
                          ID: {position.id.substring(0, 8)}...
                        </span>
                      </div>
                      
                      {position.fund_name && (
                        <div className="font-semibold text-gray-900 mb-1">
                          {position.fund_name}
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-600">持仓金额：</span>
                          <span className="font-semibold">
                            ¥{typeof position.investment_amount === 'number' 
                              ? position.investment_amount.toFixed(2) 
                              : Number(position.investment_amount || 0).toFixed(2)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">持仓收益：</span>
                          <span className={`font-semibold ${
                            (position.profit_loss || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            ¥{typeof position.profit_loss === 'number'
                              ? position.profit_loss.toFixed(2)
                              : Number(position.profit_loss || 0).toFixed(2)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-500 mt-2">
                        创建时间：{new Date(position.created_at).toLocaleString('zh-CN')}
                      </div>
                    </div>

                    <div className="flex flex-col space-y-2 ml-4">
                      <button
                        onClick={() => handleTestUpdate(position.id)}
                        className="px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
                      >
                        更新
                      </button>
                      <button
                        onClick={() => handleTestDelete(position.id)}
                        className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
