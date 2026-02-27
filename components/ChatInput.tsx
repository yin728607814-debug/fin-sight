/**
 * 聊天输入框组件
 * 用于输入和发送消息，支持图片上传
 */

import React, { useState, useRef, useEffect } from 'react';
import { PaperAirplaneIcon, PhotoIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { SparklesIcon } from '@heroicons/react/24/outline';

/**
 * 聊天输入框组件Props
 */
interface ChatInputProps {
  onSend: (message: string, images?: string[]) => void;
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
  const [images, setImages] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * 自动调整文本框高度
   */
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  /**
   * 处理图片上传
   */
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // 限制最多上传3张图片
    const remainingSlots = 3 - images.length;
    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    filesToProcess.forEach(file => {
      // 检查文件类型
      if (!file.type.startsWith('image/')) {
        alert('请上传图片文件');
        return;
      }

      // 检查文件大小（最大5MB）
      if (file.size > 5 * 1024 * 1024) {
        alert('图片大小不能超过5MB');
        return;
      }

      // 读取图片并转换为base64
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setImages(prev => [...prev, base64]);
      };
      reader.readAsDataURL(file);
    });

    // 重置input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * 删除图片
   */
  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  /**
   * 处理发送消息
   */
  const handleSend = () => {
    const trimmedMessage = message.trim();
    if ((trimmedMessage || images.length > 0) && !disabled) {
      onSend(trimmedMessage || '请分析这张图片', images.length > 0 ? images : undefined);
      setMessage('');
      setImages([]);
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

      {/* 图片预览 */}
      {images.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <img
                src={image}
                alt={`上传图片 ${index + 1}`}
                className="w-20 h-20 object-cover rounded-lg border-2 border-gray-300 dark:border-gray-600"
              />
              <button
                onClick={() => handleRemoveImage(index)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                title="删除图片"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 输入框容器 */}
      <div className="flex items-end space-x-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 focus-within:border-blue-500 dark:focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500/20 dark:focus-within:ring-blue-400/20 transition-all shadow-sm">
        {/* 快速问题按钮 */}
        {quickQuestions.length > 0 && (
          <button
            onClick={() => setShowQuickQuestions(!showQuickQuestions)}
            disabled={disabled}
            className="flex-shrink-0 p-3 text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="快速问题"
          >
            <SparklesIcon className="h-5 w-5" />
          </button>
        )}

        {/* 图片上传按钮 */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || images.length >= 3}
          className="flex-shrink-0 p-3 text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title={images.length >= 3 ? '最多上传3张图片' : '上传图片'}
        >
          <PhotoIcon className="h-5 w-5" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageUpload}
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
          className="flex-1 px-4 py-3 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none resize-none disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ maxHeight: '120px' }}
        />

        {/* 发送按钮 */}
        <button
          onClick={handleSend}
          disabled={disabled || (!message.trim() && images.length === 0)}
          className="flex-shrink-0 m-2 p-2 bg-blue-500 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md disabled:hover:shadow-sm"
          title="发送消息 (Enter)"
        >
          <PaperAirplaneIcon className="h-5 w-5" />
        </button>
      </div>

      {/* 提示文本 */}
      <div className="mt-2 px-2 text-xs text-gray-500 dark:text-gray-400">
        按 Enter 发送，Shift + Enter 换行 {images.length > 0 && `· 已选择 ${images.length}/3 张图片`}
      </div>
    </div>
  );
};
