/**
 * 情绪历史数据库服务
 * 负责将情绪数据持久化到 Supabase
 */

import { requireSupabase } from './supabaseClient';
import { AssetType } from '../types';
import { SentimentData, SentimentLevel } from './sentimentService';

/**
 * 数据库中的情绪历史记录
 */
export interface SentimentHistoryRecord {
  id: string;
  user_id: string;
  asset_type: AssetType;
  date: string;
  score: number;
  level: SentimentLevel;
  distribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
  key_factors: string[];
  news_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * 情绪历史数据库服务类
 */
export class SentimentHistoryService {
  private static instance: SentimentHistoryService;

  private constructor() {}

  /**
   * 获取单例实例
   */
  static getInstance(): SentimentHistoryService {
    if (!SentimentHistoryService.instance) {
      SentimentHistoryService.instance = new SentimentHistoryService();
    }
    return SentimentHistoryService.instance;
  }

  /**
   * 保存情绪快照到数据库
   */
  async saveSentimentSnapshot(
    assetType: AssetType,
    data: SentimentData
  ): Promise<void> {
    try {
      const client = requireSupabase();
      const { data: { user } } = await client.auth.getUser();
      
      if (!user) {
        console.warn('用户未登录，无法保存情绪历史');
        return;
      }

      const today = new Date().toISOString().split('T')[0];

      const record = {
        user_id: user.id,
        asset_type: assetType,
        date: today,
        score: data.score,
        level: data.level,
        distribution: data.distribution,
        key_factors: data.keyFactors,
        news_count: data.newsCount,
      };

      // 使用 upsert 来插入或更新（如果今天已有记录）
      const { error } = await client
        .from('sentiment_history')
        .upsert(record, {
          onConflict: 'user_id,asset_type,date',
        });

      if (error) {
        console.error('保存情绪快照失败:', error);
      } else {
        console.log('✅ 情绪快照已保存到数据库');
      }
    } catch (error) {
      console.error('保存情绪快照异常:', error);
    }
  }

  /**
   * 获取情绪历史记录
   */
  async getSentimentHistory(
    assetType: AssetType,
    days: number = 7
  ): Promise<SentimentHistoryRecord[]> {
    try {
      const client = requireSupabase();
      const { data: { user } } = await client.auth.getUser();
      
      if (!user) {
        console.warn('用户未登录，无法获取情绪历史');
        return [];
      }

      // 计算起始日期
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const startDateStr = startDate.toISOString().split('T')[0];

      const { data, error } = await client
        .from('sentiment_history')
        .select('*')
        .eq('user_id', user.id)
        .eq('asset_type', assetType)
        .gte('date', startDateStr)
        .order('date', { ascending: true });

      if (error) {
        console.error('获取情绪历史失败:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('获取情绪历史异常:', error);
      return [];
    }
  }

  /**
   * 清除历史记录
   */
  async clearHistory(assetType?: AssetType): Promise<void> {
    try {
      const client = requireSupabase();
      const { data: { user } } = await client.auth.getUser();
      
      if (!user) {
        console.warn('用户未登录，无法清除情绪历史');
        return;
      }

      let query = client
        .from('sentiment_history')
        .delete()
        .eq('user_id', user.id);

      if (assetType) {
        query = query.eq('asset_type', assetType);
      }

      const { error } = await query;

      if (error) {
        console.error('清除情绪历史失败:', error);
      } else {
        console.log('✅ 情绪历史已清除');
      }
    } catch (error) {
      console.error('清除情绪历史异常:', error);
    }
  }

  /**
   * 从 localStorage 迁移数据到数据库
   */
  async migrateFromLocalStorage(): Promise<void> {
    try {
      const client = requireSupabase();
      const { data: { user } } = await client.auth.getUser();
      
      if (!user) {
        console.warn('用户未登录，无法迁移数据');
        return;
      }

      const SENTIMENT_STORAGE_KEY = 'sentiment-history';
      const stored = localStorage.getItem(SENTIMENT_STORAGE_KEY);
      
      if (!stored) {
        console.log('没有需要迁移的 localStorage 数据');
        return;
      }

      const localData = JSON.parse(stored);
      const records: any[] = [];

      for (const assetType in localData) {
        const snapshots = localData[assetType];
        if (Array.isArray(snapshots)) {
          snapshots.forEach((snapshot: any) => {
            records.push({
              user_id: user.id,
              asset_type: assetType,
              date: snapshot.date,
              score: snapshot.score,
              level: snapshot.level,
              distribution: { positive: 0, neutral: 0, negative: 0 }, // 旧数据可能没有
              key_factors: [],
              news_count: 0,
            });
          });
        }
      }

      if (records.length > 0) {
        const { error } = await client
          .from('sentiment_history')
          .upsert(records, {
            onConflict: 'user_id,asset_type,date',
          });

        if (error) {
          console.error('迁移数据失败:', error);
        } else {
          console.log(`✅ 已迁移 ${records.length} 条记录到数据库`);
          // 迁移成功后，清除 localStorage 数据
          localStorage.removeItem(SENTIMENT_STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error('迁移数据异常:', error);
    }
  }
}

/**
 * 默认情绪历史服务实例
 */
export const sentimentHistoryService = SentimentHistoryService.getInstance();
