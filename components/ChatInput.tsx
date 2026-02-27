/**
 * 聊天输入框组件
 * 用于输入和发送消息，支持图片上传
 */

import React, { useState, useRef, useEffect } from 'react';
import { PaperAirplaneIcon, XMarkIcon, DocumentIcon } from '@heroicons/react/24/solid';
import { SparklesIcon, PaperClipIcon } from '@heroicons/react/24/outline';

/**
 * 聊天输入框组件Props
 */
interface ChatInputProps {
  onSend: (message: string, files?: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
  quickQuestions?: string[];
}

/**
 * 聊天输入框组件
 */
export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  disabled = false,
  placeholder = '输入您的问题...',
  quickQuestions = []
}) => {
  const [message, setMessage] = useState('');
  const [showQuickQuestions, setShowQuickQuestions] = useState(false);
  const [files, setFiles] = useState<Array<{ name: string; data: string; type: string }>>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * 自动调整文本框高度
   */
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [message]);

  /**
   * 处理文件上传
   */
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles || uploadedFiles.length === 0) return;

    // 限制最多上传5个文件
    const remainingSlots = 5 - files.length;
    const filesToProcess = Array.from(uploadedFiles).slice(0, remainingSlots);

    filesToProcess.forEach(file => {
      // 检查文件大小（最大10MB）
      if (file.size > 10 * 1024 * 1024) {
        alert(`文件 ${file.name} 大小不能超过10MB`);
        return;
      }

      // 读取文件并转换为base64
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setFiles(prev => [...prev, {
          name: file.name,
          data: base64,
          type: file.type
        }]);
      };
      reader.readAsDataURL(file);
    });

    // 重置input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * 删除文件
   */
  const handleRemoveFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  /**
   * 获取文件图标
   */
  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return '🖼️';
    } else if (type.includes('pdf')) {
      return '📄';
    } else if (type.includes('word') || type.includes('document')) {
      return '📝';
    } else if (type.includes('excel') || type.includes('spreadsheet')) {
      return '📊';
    } else if (type.includes('zip') || type.includes('rar')) {
      return '📦';
    }
    return '📎';
  };

  /**
   * 处理发送消息
   */
  const handleSend = () => {
    const trimmedMessage = message.trim();
    if ((trimmedMessage || files.length > 0) && !disabled) {
      const fileData = files.map(f => f.data);
      onSend(trimmedMessage || '请分析这个文件', fileData.length > 0 ? fileData : undefined);
      setMessage('');
      setFiles([]);
      setShowQuickQuestions(false);
      
      // 重置文本框高度
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  /**
   * 处理键盘事件
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter发送，Shift+Enter换行
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /**
   * 处理快速问题点击
   */
  const handleQuickQuestion = (question: string) => {
    setMessage(question);
    setShowQuickQuestions(false);
    textareaRef.current?.focus();
  };

  return (
    <div className="relative">
      {/* 快速问题建议 */}
      {showQuickQuestions && quickQuestions.length > 0 && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <div className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
              <SparklesIcon className="h-4 w-4 mr-2" />
              快速问题
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {quickQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => handleQuickQuestion(question)}
                className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-b border-gray-100 dark:border-gray-700/50 last:border-b-0"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 文件预览 */}
      {files.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {files.map((file, index) => (
            <div key={index} className="relative group flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2 pr-8 max-w-xs">
              <span className="text-2xl mr-2">{getFileIcon(file.type)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {file.name}
                </p>
                {file.type.startsWith('image/') && (
                  <img
                    src={file.data}
                    alt={file.name}
                    className="mt-2 w-full h-20 object-cover rounded"
                  />
                )}
              </div>
              <button
                onClick={() => handleRemoveFile(index)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
                title="删除文件"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 输入框容器 */}
      <div className="flex items-end space-x-2 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-300 dark:border-gray-600 focus-within:border-blue-500 dark:focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-500/10 dark:focus-within:ring-blue-400/10 transition-all shadow-sm hover:shadow-md">
        {/* 快速问题按钮 */}
        {quickQuestions.length > 0 && (
          <button
            onClick={() => setShowQuickQuestions(!showQuickQuestions)}
            disabled={disabled}
            className="flex-shrink-0 p-3 text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            title="快速问题"
          >
            <SparklesIcon className="h-6 w-6" />
          </button>
        )}

        {/* 文件上传按钮 */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || files.length >= 5}
          className="flex-shrink-0 p-3 text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          title={files.length >= 5 ? '最多上传5个文件' : '上传文件'}
        >
          <PaperClipIcon className="h-6 w-6" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* 文本输入框 */}
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          rows={1}
          className="flex-1 px-4 py-4 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none resize-none disabled:opacity-50 disabled:cursor-not-allowed text-base"
          style={{ maxHeight: '200px', minHeight: '56px' }}
        />

        {/* 发送按钮 */}
        <button
          onClick={handleSend}
          disabled={disabled || (!message.trim() && files.length === 0)}
          className="flex-shrink-0 m-2 p-3 bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-400 transition-all shadow-md hover:shadow-lg disabled:hover:shadow-md transform hover:scale-105 disabled:hover:scale-100 active:scale-95"
          title="发送消息 (Enter)"
        >
          <PaperAirplaneIcon className="h-5 w-5 transform rotate-0" />
        </button>
      </div>

      {/* 提示文本 */}
      <div className="mt-2 px-2 text-xs text-gray-500 dark:text-gray-400">
        按 Enter 发送，Shift + Enter 换行 {files.length > 0 && `· 已选择 ${files.length}/5 个文件`}
      </div>
    </div>
  );
};
