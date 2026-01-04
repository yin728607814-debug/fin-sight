/**
 * 数据迁移提示组件
 * 提示用户将本地数据迁移到 Supabase 后端
 */

import React, { useState, useEffect } from 'react';
import { MigrationService } from '../services/migrationService';
import { isSupabaseAvailable } from '../services/supabaseClient';

interface MigrationPromptProps {
  onMigrationComplete?: () => void;
}

export const MigrationPrompt: React.FC<MigrationPromptProps> = ({ onMigrationComplete }) => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [result, setResult] = useState<{ success: boolean; count: number; errors?: string[] } | null>(null);
  const [localDataCount, setLocalDataCount] = useState(0);

  useEffect(() => {
    // 检查是否需要显示迁移提示
    if (isSupabaseAvailable() && MigrationService.needsMigration()) {
      setShowPrompt(true);
      setLocalDataCount(MigrationService.getLocalDataCount());
    }
  }, []);

  const handleMigrate = async () => {
    setMigrating(true);
    setResult(null);

    try {
      const migrationResult = await MigrationService.migrateFromLocalStorage();
      setResult(migrationResult);

      if (migrationResult.success) {
        setTimeout(() => {
          setShowPrompt(false);
          onMigrationComplete?.();
        }, 3000);
      }
    } catch (error) {
      setResult({
        success: false,
        count: 0,
        errors: [error instanceof Error ? error.message : '迁移失败']
      });
    } finally {
      setMigrating(false);
    }
  };

  const handleSkip = () => {
    setShowPrompt(false);
  };

  if (!showPrompt) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fade-in">
        {/* 图标 */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
        </div>

        {/* 标题 */}
        <h3 className="text-2xl font-bold text-center text-gray-900 mb-2">
          发现本地数据
        </h3>

        {/* 描述 */}
        {!result ? (
          <>
            <p className="text-center text-gray-600 mb-6">
              检测到你有 <span className="font-bold text-blue-600">{localDataCount}</span> 条投资记录存储在浏览器本地。
              <br />
              是否迁移到云端数据库？
            </p>

            {/* 优势说明 */}
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                云端存储的优势
              </h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>数据永久保存，不会丢失</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>多设备同步访问</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>自动备份和恢复</span>
                </li>
              </ul>
            </div>

            {/* 按钮 */}
            <div className="flex space-x-3">
              <button
                onClick={handleSkip}
                disabled={migrating}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                暂不迁移
              </button>
              <button
                onClick={handleMigrate}
                disabled={migrating}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {migrating ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    迁移中...
                  </>
                ) : (
                  '立即迁移'
                )}
              </button>
            </div>
          </>
        ) : (
          <>
            {/* 迁移结果 */}
            {result.success ? (
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">迁移成功！</h4>
                <p className="text-gray-600 mb-4">
                  已成功迁移 <span className="font-bold text-green-600">{result.count}</span> 条记录到云端
                </p>
                <p className="text-sm text-gray-500">
                  页面将自动刷新...
                </p>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">迁移失败</h4>
                <p className="text-gray-600 mb-4">
                  {result.errors?.[0] || '未知错误'}
                </p>
                <button
                  onClick={() => setResult(null)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  重试
                </button>
              </div>
            )}
          </>
        )}

        {/* 说明 */}
        {!result && (
          <p className="text-xs text-center text-gray-500 mt-4">
            迁移后本地数据将被清除，所有数据将存储在云端
          </p>
        )}
      </div>
    </div>
  );
};
