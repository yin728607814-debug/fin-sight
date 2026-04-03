/**
 * Prompt 编辑器模态框
 * 允许用户查看和编辑分析策略 Prompt
 */

import React, { useState, useEffect } from 'react';
import { AssetType } from '../types';
import { promptConfigService } from '../services/promptConfigService';

interface PromptEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  assetType: AssetType;
  userId: string;
  defaultPrompt: string;
  onSave: (prompt: string) => void;
}

const PromptEditorModal: React.FC<PromptEditorModalProps> = ({
  isOpen,
  onClose,
  assetType,
  userId,
  defaultPrompt,
  onSave,
}) => {
  const [promptContent, setPromptContent] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const assetNames: Record<AssetType, string> = {
    gold: '黄金',
    nasdaq: '纳斯达克',
    astock: 'A股',
  };

  useEffect(() => {
    if (isOpen) {
      loadPrompt();
    }
  }, [isOpen, assetType, userId]);

  const loadPrompt = async () => {
    try {
      const customPrompt = await promptConfigService.getUserPrompt(userId, assetType);
      if (customPrompt) {
        setPromptContent(customPrompt);
        setIsCustom(true);
      } else {
        setPromptContent(defaultPrompt);
        setIsCustom(false);
      }
    } catch (error) {
      console.error('加载 Prompt 失败:', error);
      setPromptContent(defaultPrompt);
      setIsCustom(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await promptConfigService.saveUserPrompt(userId, assetType, promptContent);
      setIsCustom(true);
      onSave(promptContent);
      alert('保存成功！');
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('确定要恢复默认策略吗？')) {
      return;
    }

    try {
      setIsSaving(true);
      await promptConfigService.deleteUserPrompt(userId, assetType);
      setPromptContent(defaultPrompt);
      setIsCustom(false);
      onSave(defaultPrompt);
      alert('已恢复默认策略！');
    } catch (error) {
      console.error('恢复默认失败:', error);
      alert('恢复默认失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              自定义分析策略
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {assetNames[assetType]} - {isCustom ? '自定义策略' : '系统默认策略'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              投资策略 Prompt
            </label>
            <textarea
              value={promptContent}
              onChange={(e) => setPromptContent(e.target.value)}
              className="w-full h-96 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       font-mono text-sm"
              placeholder="输入自定义的分析策略 Prompt..."
            />
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
              💡 使用提示
            </h3>
            <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
              <li>• 自定义策略将影响 AI 对{assetNames[assetType]}的分析和投资建议</li>
              <li>• 可以根据个人风险偏好、投资目标调整策略</li>
              <li>• 点击"恢复默认"可以随时回到系统默认策略</li>
              <li>• 建议保留原有的结构，只修改具体的策略内容</li>
            </ul>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleReset}
            disabled={isSaving || !isCustom}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 
                     bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600
                     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            恢复默认
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 
                       bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 
                       rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg 
                       hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromptEditorModal;
