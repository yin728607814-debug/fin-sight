/**
 * 聊天服务模块
 * 负责管理AI助手的对话历史和消息处理
 * 支持按资产类型分离存储，使用 Supabase 数据库
 */

import { AssetType } from '../types';
import { requireSupabase } from './supabaseClient';

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
  private readonly MAX_HISTORY_SIZE = 50; // 最多保存50条对话
  private readonly HISTORY_EXPIRATION = 30 * 24 * 60 * 60 * 1000; // 30天过期

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
    // 初始化时清理过期记录
    this.cleanExpiredHistory().catch(err => {
      console.error('清理过期聊天记录失败:', err);
    });
  }

  /**
   * 获取当前用户ID
   */
  private async getCurrentUserId(): Promise<string | null> {
    const client = requireSupabase();
    const { data: { user } } = await client.auth.getUser();
    return user?.id || null;
  }

  /**
   * 获取对话历史（按资产类型）
   */
  public async getChatHistory(assetType: AssetType): Promise<ChatHistory> {
    try {
      const userId = await this.getCurrentUserId();
      
      if (!userId) {
        console.warn('用户未登录，返回空历史');
        return {
          messages: [],
          lastUpdated: new Date().toISOString()
        };
      }

      // 从 Supabase 获取聊天记录
      const client = requireSupabase();
      const { data, error } = await client
        .from('chat_messages')
        .select('*')
        .eq('user_id', userId)
        .eq('asset_type', assetType)
        .order('created_at', { ascending: true })
        .limit(this.MAX_HISTORY_SIZE);

      if (error) {
        console.error('获取聊天历史失败:', error);
        return {
          messages: [],
          lastUpdated: new Date().toISOString()
        };
      }

      // 转换为 ChatMessage 格式
      const messages: ChatMessage[] = (data || []).map(row => ({
        id: row.id,
        role: row.role as MessageRole,
        content: row.content,
        timestamp: row.created_at,
        context: row.context || undefined
      }));

      return {
        messages,
        lastUpdated: messages.length > 0 
          ? messages[messages.length - 1].timestamp 
          : new Date().toISOString()
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
   * 添加消息到历史（按资产类型）
   */
  public async addMessage(message: ChatMessage, assetType: AssetType): Promise<void> {
    try {
      const userId = await this.getCurrentUserId();
      
      if (!userId) {
        console.warn('用户未登录，无法保存消息');
        return;
      }

      // 插入到 Supabase
      const client = requireSupabase();
      const { error } = await client
        .from('chat_messages')
        .insert({
          id: message.id,
          user_id: userId,
          asset_type: assetType,
          role: message.role,
          content: message.content,
          context: message.context || null,
          created_at: message.timestamp
        });

      if (error) {
        console.error('保存消息失败:', error);
      }
    } catch (error) {
      console.error('添加消息失败:', error);
    }
  }

  /**
   * 清空对话历史（按资产类型）
   */
  public async clearChatHistory(assetType: AssetType): Promise<void> {
    try {
      const userId = await this.getCurrentUserId();
      
      if (!userId) {
        console.warn('用户未登录，无法清空历史');
        return;
      }

      const client = requireSupabase();
      const { error } = await client
        .from('chat_messages')
        .delete()
        .eq('user_id', userId)
        .eq('asset_type', assetType);

      if (error) {
        console.error('清空对话历史失败:', error);
      }
    } catch (error) {
      console.error('清空对话历史失败:', error);
    }
  }

  /**
   * 清理过期的历史记录
   */
  private async cleanExpiredHistory(): Promise<void> {
    try {
      const userId = await this.getCurrentUserId();
      
      if (!userId) {
        return;
      }

      const expirationDate = new Date(Date.now() - this.HISTORY_EXPIRATION);

      const client = requireSupabase();
      const { error } = await client
        .from('chat_messages')
        .delete()
        .eq('user_id', userId)
        .lt('created_at', expirationDate.toISOString());

      if (error) {
        console.error('清理过期记录失败:', error);
      }
    } catch (error) {
      console.error('清理过期记录失败:', error);
    }
  }

  /**
   * 生成消息ID
   */
  public generateMessageId(): string {
    return `${crypto.randomUUID()}`;
  }

  /**
   * 创建用户消息
   */
  public createUserMessage(content: string, context?: ChatContext): ChatMessage {
    return {
      id: this.generateMessageId(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
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
      timestamp: new Date().toISOString(),
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
  public async getConversationContext(assetType: AssetType, maxMessages: number = 5): Promise<ChatMessage[]> {
    const history = await this.getChatHistory(assetType);
    return history.messages.slice(-maxMessages);
  }

  /**
   * 获取历史统计信息
   */
  public async getHistoryStats(assetType: AssetType): Promise<{
    totalMessages: number;
    userMessages: number;
    assistantMessages: number;
    oldestMessage?: string;
    newestMessage?: string;
  }> {
    const history = await this.getChatHistory(assetType);
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
