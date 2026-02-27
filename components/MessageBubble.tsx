/**
 * 消息气泡组件
 * 显示单条聊天消息
 */

import React from 'react';
import { ChatMessage } from '../services/chatService';
import { UserIcon, SparklesIcon } from '@heroicons/react/24/outline';

/**
 * 消息气泡组件Props
 */
interface MessageBubbleProps {
  message: ChatMessage;
}

/**
 * 消息气泡组件
 */
export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  /**
   * 格式化时间
   */
  const formatTime = (timestamp: Date | string): string => {
    const now = new Date();
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    const diff = now.getTime() - date.getTime();
    
    // 小于1分钟
    if (diff < 60000) {
      return '刚刚';
    }
    
    // 小于1小时
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes}分钟前`;
    }
    
    // 小于24小时
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours}小时前`;
    }
    
    // 显示具体时间
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  /**
   * 渲染消息内容（支持简单的markdown格式）
   */
  const renderContent = (content: string) => {
    // 分割段落
    const paragraphs = content.split('\n\n');
    
    return paragraphs.map((paragraph, index) => {
      // 检查是否是标题行（以**开头和结尾）
      const titleMatch = paragraph.match(/^\*\*(.+)\*\*$/);
      if (titleMatch) {
        return (
          <div key={index} className="font-semibold text-gray-900 dark:text-gray-100 mt-3 first:mt-0">
            {titleMatch[1]}
          </div>
        );
      }

      // 处理行内加粗（**text**）
      const parts = paragraph.split(/(\*\*[^*]+\*\*)/g);
      const renderedParts = parts.map((part, partIndex) => {
        const boldMatch = part.match(/^\*\*(.+)\*\*$/);
        if (boldMatch) {
          return <strong key={partIndex} className="font-semibold">{boldMatch[1]}</strong>;
        }
        return <span key={partIndex}>{part}</span>;
      });

      return (
        <p key={index} className="mb-2 last:mb-0 leading-relaxed">
          {renderedParts}
        </p>
      );
    });
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300`}>
      <div className={`flex ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start max-w-[85%] sm:max-w-[75%]`}>
        {/* 头像 */}
        <div className={`flex-shrink-0 ${isUser ? 'ml-3' : 'mr-3'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            isUser 
              ? 'bg-blue-500 dark:bg-blue-600' 
              : 'bg-gradient-to-br from-purple-500 to-pink-500 dark:from-purple-600 dark:to-pink-600'
          } shadow-lg`}>
            {isUser ? (
              <UserIcon className="h-5 w-5 text-white" />
            ) : (
              <SparklesIcon className="h-5 w-5 text-white" />
            )}
          </div>
        </div>

        {/* 消息内容 */}
        <div className="flex flex-col">
          {/* 消息气泡 */}
          <div className={`rounded-2xl px-4 py-3 shadow-md ${
            isUser
              ? 'bg-blue-500 dark:bg-blue-600 text-white rounded-tr-sm'
              : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-tl-sm'
          }`}>
            <div className="text-sm whitespace-pre-wrap break-words">
              {renderContent(message.content)}
            </div>
          </div>

          {/* 时间戳和上下文信息 */}
          <div className={`flex items-center mt-1 px-2 text-xs text-gray-500 dark:text-gray-400 ${
            isUser ? 'justify-end' : 'justify-start'
          }`}>
            <span>{formatTime(message.timestamp)}</span>
            {message.context && (
              <>
                <span className="mx-1">·</span>
                <span>
                  {message.context.assetType === 'gold' ? '黄金' : message.context.assetType === 'astock' ? 'A股' : '纳斯达克'}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
