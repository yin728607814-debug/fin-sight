/**
 * 聊天窗口组件
 * AI智能问答的主界面
 */

import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, chatService, ChatContext } from '../services/chatService';
import { AIPromptBuilder } from '../services/aiPromptBuilder';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { LoadingSpinner } from './LoadingSpinner';
import { TrashIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { AnalysisService } from '../services/analysisService';
import { config } from '../config/env';

/**
 * 聊天窗口组件Props
 */
interface ChatWindowProps {
  context: ChatContext;
  onContextUpdate?: (context: ChatContext) => void;
}

/**
 * 聊天窗口组件
 */
export const ChatWindow: React.FC<ChatWindowProps> = ({ context, onContextUpdate }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const analysisService = useRef(new AnalysisService({ apiKey: config.geminiApiKey }));

  /**
   * 加载历史消息
   */
  useEffect(() => {
    const history = chatService.getChatHistory();
    setMessages(history.messages);
  }, []);

  /**
   * 自动滚动到底部
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /**
   * 发送消息
   */
  const handleSendMessage = async (content: string) => {
    // 创建用户消息
    const userMessage = chatService.createUserMessage(content, context);
    
    // 添加到消息列表
    setMessages(prev => [...prev, userMessage]);
    chatService.addMessage(userMessage);

    // 开始加载
    setIsLoading(true);

    try {
      // 获取对话历史
      const conversationHistory = chatService.getConversationContext(5);
      
      // 构建提示词
      const prompt = AIPromptBuilder.buildChatPrompt(
        content,
        context,
        conversationHistory
      );

      // 调用AI服务
      const response = await analysisService.current.makeGeminiRequest({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048
        }
      });

      // 解析响应
      const candidate = response.data.candidates?.[0];
      if (!candidate || !candidate.content?.parts?.[0]?.text) {
        throw new Error('AI响应为空');
      }

      const aiResponseText = candidate.content.parts[0].text;
      const parsedResponse = AIPromptBuilder.parseAIResponse(aiResponseText);
      const formattedResponse = AIPromptBuilder.formatResponse(parsedResponse);

      // 创建助手消息
      const assistantMessage = chatService.createAssistantMessage(formattedResponse, context);
      
      // 添加到消息列表
      setMessages(prev => [...prev, assistantMessage]);
      chatService.addMessage(assistantMessage);

      // 检查是否需要显示免责声明
      if (AIPromptBuilder.shouldShowDisclaimer(parsedResponse)) {
        setShowDisclaimer(true);
      }

    } catch (error) {
      console.error('发送消息失败:', error);
      
      // 创建错误消息
      const errorMessage = chatService.createAssistantMessage(
        '抱歉，我遇到了一些问题，无法回答您的问题。请稍后再试，或者尝试重新表述您的问题。\n\n可能的原因：\n- AI服务暂时不可用\n- 网络连接问题\n- API配额已用完',
        context
      );
      
      setMessages(prev => [...prev, errorMessage]);
      chatService.addMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 清空对话历史
   */
  const handleClearHistory = () => {
    if (window.confirm('确定要清空所有对话历史吗？此操作不可撤销。')) {
      chatService.clearChatHistory();
      setMessages([]);
      setShowDisclaimer(true);
    }
  };

  /**
   * 获取快速问题
   */
  const quickQuestions = AIPromptBuilder.getQuickQuestions(context.assetType);

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* 头部 */}
      <div className="flex-shrink-0 px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              AI 投资顾问
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {context.assetType === 'gold' ? '现货黄金' : '纳斯达克100'} 专业分析
            </p>
          </div>
          <button
            onClick={handleClearHistory}
            disabled={messages.length === 0}
            className="flex items-center px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="清空对话历史"
          >
            <TrashIcon className="h-4 w-4 mr-1" />
            清空
          </button>
        </div>
      </div>

      {/* 免责声明 */}
      {showDisclaimer && (
        <div className="flex-shrink-0 mx-6 mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <div className="flex items-start">
            <InformationCircleIcon className="h-5 w-5 text-amber-600 dark:text-amber-400 mr-3 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-200 mb-1">
                免责声明
              </h3>
              <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                本AI助手提供的信息和建议仅供参考，不构成任何投资建议。投资有风险，请谨慎决策。
              </p>
              <button
                onClick={() => setShowDisclaimer(false)}
                className="mt-2 text-xs text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-200 underline"
              >
                我知道了
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 dark:from-purple-600 dark:to-pink-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
              <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              开始对话
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md">
              您好！我是AI投资顾问，可以帮您分析市场趋势、解读新闻影响、提供投资建议。请随时向我提问！
            </p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {isLoading && (
              <div className="flex justify-start mb-4">
                <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 rounded-2xl px-4 py-3 shadow-md border border-gray-200 dark:border-gray-700">
                  <LoadingSpinner size="sm" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">AI正在思考...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* 输入框 */}
      <div className="flex-shrink-0 px-6 py-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <ChatInput
          onSend={handleSendMessage}
          disabled={isLoading}
          placeholder="输入您的问题..."
          quickQuestions={quickQuestions}
        />
      </div>
    </div>
  );
};
