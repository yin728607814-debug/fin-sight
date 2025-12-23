/**
 * 渐进式降级组件
 * 提供多层次的数据获取策略和用户体验降级
 */

import React, { useState, useCallback } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { DataFetchError } from './DemoDataNotice';

export interface FallbackLevel {
  id: string;
  name: string;
  description: string;
  action: () => Promise<boolean>;
  isAvailable: boolean;
}

interface ProgressiveFallbackProps {
  dataType: 'news' | 'price' | 'analysis';
  fallbackLevels: FallbackLevel[];
  onSuccess: (level: FallbackLevel) => void;
  onAllFailed: () => void;
  className?: string;
}

export const ProgressiveFallback: React.FC<ProgressiveFallbackProps> = ({
  dataType,
  fallbackLevels,
  onSuccess,
  onAllFailed,
  className = ''
}) => {
  const [currentLevel, setCurrentLevel] = useState<number>(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [failedLevels, setFailedLevels] = useState<Set<string>>(new Set());
  const [lastError, setLastError] = useState<string>('');

  const tryNextLevel = useCallback(async () => {
    if (currentLevel >= fallbackLevels.length) {
      onAllFailed();
      return;
    }

    const level = fallbackLevels[currentLevel];
    if (!level.isAvailable || failedLevels.has(level.id)) {
      setCurrentLevel(prev => prev + 1);
      return;
    }

    setIsRetrying(true);
    setLastError('');

    try {
      const success = await level.action();
      if (success) {
        onSuccess(level);
        return;
      }
      
      // 标记当前级别失败
      setFailedLevels(prev => new Set([...prev, level.id]));
      setCurrentLevel(prev => prev + 1);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      setLastError(errorMessage);
      setFailedLevels(prev => new Set([...prev, level.id]));
      setCurrentLevel(prev => prev + 1);
    } finally {
      setIsRetrying(false);
    }
  }, [currentLevel, fallbackLevels, failedLevels, onSuccess, onAllFailed]);

  const retryCurrentLevel = useCallback(async () => {
    if (currentLevel >= fallbackLevels.length) return;
    
    const level = fallbackLevels[currentLevel];
    setFailedLevels(prev => {
      const newSet = new Set(prev);
      newSet.delete(level.id);
      return newSet;
    });
    
    await tryNextLevel();
  }, [currentLevel, fallbackLevels, tryNextLevel]);

  const resetAndRetry = useCallback(() => {
    setCurrentLevel(0);
    setFailedLevels(new Set());
    setLastError('');
    tryNextLevel();
  }, [tryNextLevel]);

  // 如果所有级别都失败了
  if (currentLevel >= fallbackLevels.length) {
    return (
      <div className={className}>
        <DataFetchError
          dataType={dataType}
          error={`所有数据源都不可用。最后错误：${lastError}`}
          onRetry={resetAndRetry}
          showFallbackOption={false}
        />
      </div>
    );
  }

  const currentLevelData = fallbackLevels[currentLevel];
  const availableLevels = fallbackLevels.filter(level => level.isAvailable);
  const failedCount = failedLevels.size;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 当前尝试状态 */}
      {isRetrying && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <LoadingSpinner size="sm" className="mr-3" />
            <div>
              <h4 className="text-sm font-medium text-blue-800">
                正在尝试获取数据...
              </h4>
              <p className="text-sm text-blue-600 mt-1">
                当前策略：{currentLevelData?.name} - {currentLevelData?.description}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 失败级别信息 */}
      {failedCount > 0 && !isRetrying && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h4 className="text-sm font-medium text-yellow-800">
                部分数据源不可用
              </h4>
              <div className="mt-2 text-sm text-yellow-700">
                <p>已尝试 {failedCount} 个数据源，正在尝试备用方案...</p>
                <div className="mt-2">
                  <p className="font-medium">进度：</p>
                  <div className="mt-1 bg-yellow-200 rounded-full h-2">
                    <div 
                      className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(currentLevel / availableLevels.length) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs mt-1">
                    {currentLevel} / {availableLevels.length} 个策略已尝试
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 当前级别操作 */}
      {!isRetrying && currentLevelData && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">
                {currentLevelData.name}
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                {currentLevelData.description}
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={tryNextLevel}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                尝试获取
              </button>
              {failedLevels.has(currentLevelData.id) && (
                <button
                  onClick={retryCurrentLevel}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  重试
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 错误信息 */}
      {lastError && !isRetrying && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center">
            <svg className="h-4 w-4 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-red-700">{lastError}</p>
          </div>
        </div>
      )}

      {/* 可用策略列表 */}
      <details className="bg-gray-50 border border-gray-200 rounded-lg">
        <summary className="px-4 py-3 cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
          查看所有可用策略 ({availableLevels.length})
        </summary>
        <div className="px-4 pb-3 space-y-2">
          {availableLevels.map((level, index) => (
            <div 
              key={level.id}
              className={`flex items-center justify-between p-2 rounded ${
                index === currentLevel ? 'bg-blue-100 border border-blue-200' :
                failedLevels.has(level.id) ? 'bg-red-100 border border-red-200' :
                'bg-white border border-gray-200'
              }`}
            >
              <div>
                <p className="text-sm font-medium text-gray-900">{level.name}</p>
                <p className="text-xs text-gray-600">{level.description}</p>
              </div>
              <div className="flex items-center space-x-2">
                {index === currentLevel && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    当前
                  </span>
                )}
                {failedLevels.has(level.id) && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    失败
                  </span>
                )}
                {index < currentLevel && !failedLevels.has(level.id) && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    已跳过
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
};

/**
 * 创建标准的数据获取降级策略
 */
export const createStandardFallbackLevels = (
  dataType: 'news' | 'price' | 'analysis',
  primaryAction: () => Promise<boolean>,
  fallbackAction?: () => Promise<boolean>,
  demoAction?: () => Promise<boolean>
): FallbackLevel[] => {
  const levels: FallbackLevel[] = [
    {
      id: 'primary',
      name: '主要数据源',
      description: '从主要API获取最新数据',
      action: primaryAction,
      isAvailable: true
    }
  ];

  if (fallbackAction) {
    levels.push({
      id: 'fallback',
      name: '备用数据源',
      description: '从备用API获取数据',
      action: fallbackAction,
      isAvailable: true
    });
  }

  if (demoAction) {
    levels.push({
      id: 'demo',
      name: '演示数据',
      description: '使用本地演示数据（仅供展示）',
      action: demoAction,
      isAvailable: true
    });
  }

  return levels;
};