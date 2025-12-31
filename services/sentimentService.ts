/**
 * 情绪分析服务
 * 负责计算和管理新闻情绪指数
 */

import { NewsAnalysis, AssetType, ImpactType } from '../types';

/**
 * 情绪等级
 */
export type SentimentLevel = 'bearish' | 'neutral' | 'bullish';

/**
 * 情绪数据
 */
export interface SentimentData {
  score: number; // 0-100
  level: SentimentLevel;
  timestamp: string; // ISO 字符串格式
  distribution: {
    positive: number; // 正面新闻占比
    neutral: number;  // 中性新闻占比
    negative: number; // 负面新闻占比
  };
  keyFactors: string[]; // 关键影响因素
  newsCount: number; // 分析的新闻数量
}

/**
 * 情绪历史记录
 */
export interface SentimentHistory {
  assetType: AssetType;
  data: Array<{
    date: string;
    score: number;
    level: SentimentLevel;
  }>;
}

/**
 * 情绪快照（用于历史记录）
 */
interface SentimentSnapshot {
  date: string;
  score: number;
  level: SentimentLevel;
  timestamp: number;
}

const SENTIMENT_STORAGE_KEY = 'sentiment-history';
const MAX_HISTORY_DAYS = 7;

/**
 * 情绪分析服务类
 */
export class SentimentService {
  private static instance: SentimentService;

  private constructor() {}

  /**
   * 获取单例实例
   */
  static getInstance(): SentimentService {
    if (!SentimentService.instance) {
      SentimentService.instance = new SentimentService();
    }
    return SentimentService.instance;
  }

  /**
   * 计算情绪指数
   * 基于新闻分析结果计算0-100的情绪分数
   */
  calculateSentiment(analyses: NewsAnalysis[]): SentimentData {
    if (!analyses || analyses.length === 0) {
      return this.getDefaultSentiment();
    }

    // 统计各类情绪的数量
    let positiveCount = 0;
    let neutralCount = 0;
    let negativeCount = 0;
    let totalConfidence = 0;
    let weightedScore = 0;

    analyses.forEach((analysis) => {
      const impact = analysis.impact;
      const confidence = analysis.confidence || 0.5;

      // 统计数量
      if (impact === 'positive') {
        positiveCount++;
      } else if (impact === 'negative') {
        negativeCount++;
      } else {
        neutralCount++;
      }

      // 计算加权分数
      const impactScore = this.getImpactScore(impact);
      weightedScore += impactScore * confidence;
      totalConfidence += confidence;
    });

    // 计算最终分数（加权平均）
    const score = totalConfidence > 0 
      ? Math.round((weightedScore / totalConfidence) * 100) / 100
      : 50;

    // 计算分布
    const total = analyses.length;
    const distribution = {
      positive: Math.round((positiveCount / total) * 100),
      neutral: Math.round((neutralCount / total) * 100),
      negative: Math.round((negativeCount / total) * 100),
    };

    // 确定情绪等级
    const level = this.getSentimentLevel(score);

    // 提取关键因素
    const keyFactors = this.extractKeyFactors(analyses);

    return {
      score,
      level,
      timestamp: new Date().toISOString(), // 直接存储为 ISO 字符串
      distribution,
      keyFactors,
      newsCount: analyses.length,
    };
  }

  /**
   * 获取影响分数
   * positive → 1.0, neutral → 0.5, negative → 0.0
   */
  private getImpactScore(impact: ImpactType): number {
    switch (impact) {
      case 'positive':
        return 1.0;
      case 'neutral':
        return 0.5;
      case 'negative':
        return 0.0;
      default:
        return 0.5;
    }
  }

  /**
   * 确定情绪等级
   */
  private getSentimentLevel(score: number): SentimentLevel {
    if (score >= 60) {
      return 'bullish'; // 乐观
    } else if (score <= 40) {
      return 'bearish'; // 悲观
    } else {
      return 'neutral'; // 中性
    }
  }

  /**
   * 提取关键影响因素
   */
  private extractKeyFactors(analyses: NewsAnalysis[]): string[] {
    const factors: string[] = [];

    // 按置信度排序，取前5个
    const sortedAnalyses = [...analyses].sort(
      (a, b) => (b.confidence || 0) - (a.confidence || 0)
    );

    sortedAnalyses.slice(0, 5).forEach((analysis) => {
      if (analysis.keyPoints && analysis.keyPoints.length > 0) {
        // 取第一个关键点
        factors.push(analysis.keyPoints[0]);
      }
    });

    return factors.slice(0, 5); // 最多5个
  }

  /**
   * 获取默认情绪数据
   */
  private getDefaultSentiment(): SentimentData {
    return {
      score: 50,
      level: 'neutral',
      timestamp: new Date().toISOString(), // 直接存储为 ISO 字符串
      distribution: {
        positive: 0,
        neutral: 0,
        negative: 0,
      },
      keyFactors: [],
      newsCount: 0,
    };
  }

  /**
   * 保存情绪快照到历史记录
   */
  saveSentimentSnapshot(assetType: AssetType, data: SentimentData): void {
    try {
      const history = this.loadHistory();
      const today = new Date().toISOString().split('T')[0];

      // 创建快照
      const snapshot: SentimentSnapshot = {
        date: today,
        score: data.score,
        level: data.level,
        timestamp: Date.now(),
      };

      // 获取或创建资产的历史记录
      if (!history[assetType]) {
        history[assetType] = [];
      }

      // 检查今天是否已有记录
      const existingIndex = history[assetType].findIndex(
        (s) => s.date === today
      );

      if (existingIndex >= 0) {
        // 更新今天的记录
        history[assetType][existingIndex] = snapshot;
      } else {
        // 添加新记录
        history[assetType].push(snapshot);
      }

      // 只保留最近N天的记录
      history[assetType] = history[assetType]
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, MAX_HISTORY_DAYS);

      // 保存到 localStorage
      localStorage.setItem(SENTIMENT_STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('保存情绪快照失败:', error);
    }
  }

  /**
   * 获取情绪历史记录
   */
  getSentimentHistory(assetType: AssetType, days: number = 7): SentimentHistory {
    try {
      const history = this.loadHistory();
      const assetHistory = history[assetType] || [];

      // 按日期排序（从旧到新）
      const sortedHistory = assetHistory
        .sort((a, b) => a.timestamp - b.timestamp)
        .slice(-days);

      return {
        assetType,
        data: sortedHistory.map((snapshot) => ({
          date: snapshot.date,
          score: snapshot.score,
          level: snapshot.level,
        })),
      };
    } catch (error) {
      console.error('获取情绪历史失败:', error);
      return {
        assetType,
        data: [],
      };
    }
  }

  /**
   * 加载历史记录
   */
  private loadHistory(): Record<AssetType, SentimentSnapshot[]> {
    try {
      const stored = localStorage.getItem(SENTIMENT_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        
        // 验证和修复数据
        for (const assetType in parsed) {
          if (Array.isArray(parsed[assetType])) {
            parsed[assetType] = parsed[assetType]
              .map((snapshot: any) => {
                // 确保必需字段存在
                if (!snapshot || typeof snapshot !== 'object') {
                  return null;
                }
                if (!snapshot.date || !snapshot.score || !snapshot.level) {
                  return null;
                }
                
                // 确保 timestamp 是数字
                let timestamp: number;
                if (typeof snapshot.timestamp === 'number') {
                  timestamp = snapshot.timestamp;
                } else if (typeof snapshot.timestamp === 'string') {
                  // 尝试从字符串转换（可能是 ISO 字符串或数字字符串）
                  const parsed = Date.parse(snapshot.timestamp);
                  if (!isNaN(parsed)) {
                    timestamp = parsed;
                  } else {
                    const num = Number(snapshot.timestamp);
                    if (!isNaN(num)) {
                      timestamp = num;
                    } else {
                      return null;
                    }
                  }
                } else if (snapshot.timestamp && typeof snapshot.timestamp === 'object' && 'getTime' in snapshot.timestamp) {
                  // 如果是 Date 对象（虽然不应该出现）
                  try {
                    timestamp = snapshot.timestamp.getTime();
                  } catch {
                    return null;
                  }
                } else {
                  // 无效的 timestamp
                  return null;
                }
                
                return {
                  date: snapshot.date,
                  score: snapshot.score,
                  level: snapshot.level,
                  timestamp: timestamp
                };
              })
              .filter((snapshot: unknown) => snapshot !== null);
          }
        }
        
        return parsed;
      }
    } catch (error) {
      console.error('加载情绪历史失败:', error);
      // 清除损坏的数据
      try {
        localStorage.removeItem(SENTIMENT_STORAGE_KEY);
      } catch (e) {
        console.error('清除损坏的情绪历史失败:', e);
      }
    }
    return {} as Record<AssetType, SentimentSnapshot[]>;
  }

  /**
   * 清除历史记录
   */
  clearHistory(assetType?: AssetType): void {
    try {
      if (assetType) {
        const history = this.loadHistory();
        delete history[assetType];
        localStorage.setItem(SENTIMENT_STORAGE_KEY, JSON.stringify(history));
      } else {
        localStorage.removeItem(SENTIMENT_STORAGE_KEY);
      }
    } catch (error) {
      console.error('清除情绪历史失败:', error);
    }
  }

  /**
   * 判断是否为极值（需要预警）
   */
  isExtremeValue(score: number): boolean {
    return score >= 80 || score <= 20;
  }

  /**
   * 获取情绪描述
   */
  getSentimentDescription(level: SentimentLevel): string {
    switch (level) {
      case 'bullish':
        return '市场情绪乐观';
      case 'bearish':
        return '市场情绪悲观';
      case 'neutral':
        return '市场情绪中性';
    }
  }

  /**
   * 获取情绪颜色
   */
  getSentimentColor(level: SentimentLevel): {
    bg: string;
    text: string;
    border: string;
  } {
    switch (level) {
      case 'bullish':
        return {
          bg: 'bg-green-100 dark:bg-green-900/30',
          text: 'text-green-700 dark:text-green-400',
          border: 'border-green-300 dark:border-green-700',
        };
      case 'bearish':
        return {
          bg: 'bg-red-100 dark:bg-red-900/30',
          text: 'text-red-700 dark:text-red-400',
          border: 'border-red-300 dark:border-red-700',
        };
      case 'neutral':
        return {
          bg: 'bg-yellow-100 dark:bg-yellow-900/30',
          text: 'text-yellow-700 dark:text-yellow-400',
          border: 'border-yellow-300 dark:border-yellow-700',
        };
    }
  }
}

/**
 * 默认情绪服务实例
 */
export const sentimentService = SentimentService.getInstance();
