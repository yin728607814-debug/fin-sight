/**
 * 聊天服务模块
 * 负责管理AI助手的对话历史和消息处理
 */

import { AssetType } from '../types';

/**
 * 消息角色类型
 */
export type MessageRole = 'user' | 'assistant';

/**
 * 聊天消息接口
 */
export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string; // ISO字符串
  context?: {
    assetType?: AssetType;
    newsCount?: number;
    currentPrice?: number;
    priceChange?: number;
  };
}

/**
 * 对话历史接口
 */
export interface ChatHistory {
  messages: ChatMessage[];
  lastUpdated: string; // ISO字符串
}

/**
 * 聊天上下文接口
 */
export interface ChatContext {
  assetType?: AssetType;
  recentNews?: Array<{ title: string; content: string }>;
  currentPrice?: number;
  priceChange?: number;
  sentimentScore?: number;
}

/**
 * 聊天服务类
 */
export class ChatService {
  private static instance: ChatService;
  private readonly STORAGE_KEY = 'chat_history';
  private readonly MAX_HISTORY_SIZE = 10; // 最多保存10条对话
  private readonly HISTORY_EXPIRATION = 7 * 24 * 60 * 60 * 1000; // 7天过期

  /**
   * 获取单例实例
   */
  public static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService();
    }
    return ChatService.instance;
  }

  /**
   * 私有构造函数
   */
  private constructor() {
    // 清理过期的历史记录
    this.cleanExpiredHistory();
  }

  /**
   * 获取对话历史
   */
  public getChatHistory(): ChatHistory {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        return {
          messages: [],
          lastUpdated: new Date().toISOString()
        };
      }

      const parsed = JSON.parse(stored);
      
      // 数据已经是正确格式（ISO字符串），直接返回
      return {
        messages: parsed.messages || [],
        lastUpdated: parsed.lastUpdated || new Date().toISOString()
      };
    } catch (error) {
      console.error('获取对话历史失败:', error);
      return {
        messages: [],
        lastUpdated: new Date().toISOString()
      };
    }
  }

  /**
   * 保存对话历史
   */
  public saveChatHistory(history: ChatHistory): void {
    try {
      // 限制历史记录数量
      const limitedMessages = history.messages.slice(-this.MAX_HISTORY_SIZE);
      
      const toSave = {
        messages: limitedMessages,
        lastUpdated: new Date().toISOString()
      };

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(toSave));
    } catch (error) {
      console.error('保存对话历史失败:', error);
      
      // 如果是存储空间不足，尝试清理旧数据
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        this.clearChatHistory();
        console.warn('存储空间不足，已清空对话历史');
      }
    }
  }

  /**
   * 添加消息到历史
   */
  public addMessage(message: ChatMessage): void {
    const history = this.getChatHistory();
    history.messages.push(message);
    history.lastUpdated = new Date().toISOString(); // 使用 ISO 字符串
    this.saveChatHistory(history);
  }

  /**
   * 清空对话历史
   */
  public clearChatHistory(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('清空对话历史失败:', error);
    }
  }

  /**
   * 清理过期的历史记录
   */
  private cleanExpiredHistory(): void {
    const history = this.getChatHistory();
    const now = Date.now();
    
    // 过滤掉过期的消息
    const validMessages = history.messages.filter(msg => {
      const msgTimestamp = new Date(msg.timestamp).getTime();
      const messageAge = now - msgTimestamp;
      return messageAge < this.HISTORY_EXPIRATION;
    });

    // 如果有消息被清理，保存更新后的历史
    if (validMessages.length < history.messages.length) {
      this.saveChatHistory({
        messages: validMessages,
        lastUpdated: new Date().toISOString() // 使用 ISO 字符串
      });
    }
  }

  /**
   * 生成消息ID
   */
  public generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 创建用户消息
   */
  public createUserMessage(content: string, context?: ChatContext): ChatMessage {
    return {
      id: this.generateMessageId(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(), // 使用 ISO 字符串
      context: context ? {
        assetType: context.assetType,
        newsCount: context.recentNews?.length,
        currentPrice: context.currentPrice,
        priceChange: context.priceChange
      } : undefined
    };
  }

  /**
   * 创建助手消息
   */
  public createAssistantMessage(content: string, context?: ChatContext): ChatMessage {
    return {
      id: this.generateMessageId(),
      role: 'assistant',
      content,
      timestamp: new Date().toISOString(), // 使用 ISO 字符串
      context: context ? {
        assetType: context.assetType,
        newsCount: context.recentNews?.length,
        currentPrice: context.currentPrice,
        priceChange: context.priceChange
      } : undefined
    };
  }

  /**
   * 获取对话上下文（用于AI prompt）
   */
  public getConversationContext(maxMessages: number = 5): ChatMessage[] {
    const history = this.getChatHistory();
    return history.messages.slice(-maxMessages);
  }

  /**
   * 获取历史统计信息
   */
  public getHistoryStats(): {
    totalMessages: number;
    userMessages: number;
    assistantMessages: number;
    oldestMessage?: string;
    newestMessage?: string;
  } {
    const history = this.getChatHistory();
    const messages = history.messages;

    if (messages.length === 0) {
      return {
        totalMessages: 0,
        userMessages: 0,
        assistantMessages: 0
      };
    }

    return {
      totalMessages: messages.length,
      userMessages: messages.filter(m => m.role === 'user').length,
      assistantMessages: messages.filter(m => m.role === 'assistant').length,
      oldestMessage: messages[0].timestamp,
      newestMessage: messages[messages.length - 1].timestamp
    };
  }
}

/**
 * 导出单例实例
 */
export const chatService = ChatService.getInstance();
