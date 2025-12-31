/**
 * 数据迁移工具
 * 处理 localStorage 数据格式升级
 */

const MIGRATION_VERSION_KEY = 'data-migration-version';
const CURRENT_VERSION = '2.4-debug'; // 调试版本，不清除数据
const SENTIMENT_STORAGE_KEY = 'sentiment-history';

/**
 * 执行数据迁移
 */
export function migrateData(): void {
  try {
    const currentVersion = localStorage.getItem(MIGRATION_VERSION_KEY);
    
    console.log(`🔍 当前数据版本: ${currentVersion || '无'}`);
    console.log(`🔍 目标版本: ${CURRENT_VERSION}`);
    
    // 打印 sentiment-history 的内容用于调试
    const sentimentHistory = localStorage.getItem(SENTIMENT_STORAGE_KEY);
    if (sentimentHistory) {
      try {
        const parsed = JSON.parse(sentimentHistory);
        console.log('🔍 当前 sentiment-history:', parsed);
      } catch (e) {
        console.error('🔍 sentiment-history 解析失败:', e);
      }
    } else {
      console.log('🔍 没有 sentiment-history 数据');
    }
    
    // 如果已经是最新版本，跳过迁移
    if (currentVersion === CURRENT_VERSION) {
      console.log('✅ 已经是最新版本，跳过迁移');
      return;
    }
    
    console.log(`🔄 开始数据迁移: ${currentVersion || '旧版本'} → ${CURRENT_VERSION}`);
    
    // 跳过旧的迁移，直接到 v2.4-debug
    if (!currentVersion || currentVersion < '2.4-debug') {
      migrateToV24Debug();
    }
    
    // 更新版本号
    localStorage.setItem(MIGRATION_VERSION_KEY, CURRENT_VERSION);
    console.log('✅ 数据迁移完成');
    
  } catch (error) {
    console.error('❌ 数据迁移失败:', error);
  }
}

/**
 * 迁移到 v2.4-debug
 * 调试版本：不清除数据，只添加日志
 */
function migrateToV24Debug(): void {
  console.log('📦 迁移到 v2.4-debug: 调试模式，保留所有数据');
  
  // 打印 sentiment-history 的详细信息
  const sentimentHistory = localStorage.getItem(SENTIMENT_STORAGE_KEY);
  if (sentimentHistory) {
    try {
      const parsed = JSON.parse(sentimentHistory);
      console.log('🔍 sentiment-history 详细信息:');
      for (const assetType in parsed) {
        console.log(`  ${assetType}:`, parsed[assetType]);
        if (Array.isArray(parsed[assetType])) {
          parsed[assetType].forEach((snapshot: any, index: number) => {
            console.log(`    [${index}]:`, {
              date: snapshot.date,
              dateType: typeof snapshot.date,
              score: snapshot.score,
              level: snapshot.level,
              timestamp: snapshot.timestamp,
              timestampType: typeof snapshot.timestamp,
            });
          });
        }
      }
    } catch (e) {
      console.error('  解析失败:', e);
    }
  }
  
  console.log('  ✅ v2.4-debug 迁移完成 - 数据已保留，添加了调试日志');
}

/**
 * 验证应用状态数据结构
 */
 * 修复 SentimentData timestamp 类型问题
 */
function migrateToV2(): void {
  console.log('📦 迁移到 v2.0: 修复 timestamp 类型');
  
  // 清除情绪历史数据（包含旧格式的 timestamp）
  const sentimentHistoryKey = 'sentiment-history';
  if (localStorage.getItem(sentimentHistoryKey)) {
    console.log('  - 清除旧的情绪历史数据');
    localStorage.removeItem(sentimentHistoryKey);
  }
  
  // 清除应用状态中的分析数据（可能包含旧格式的 timestamp）
  const appStateKey = 'investment-news-analyzer-state';
  const appState = localStorage.getItem(appStateKey);
  
  if (appState) {
    try {
      const parsed = JSON.parse(appState);
      
      // 清除分析数据，但保留其他数据
      if (parsed.analysis) {
        console.log('  - 清除旧的分析数据');
        parsed.analysis = {
          gold: [],
          nasdaq: []
        };
      }
      
      if (parsed.overallAnalysis) {
        console.log('  - 清除旧的整体分析数据');
        parsed.overallAnalysis = {
          gold: null,
          nasdaq: null
        };
      }
      
      // 保存清理后的数据
      localStorage.setItem(appStateKey, JSON.stringify(parsed));
      
    } catch (error) {
      console.error('  - 清理应用状态失败:', error);
      localStorage.removeItem(appStateKey);
    }
  }
}

/**
 * 迁移到 v2.1
 * 修复所有可能导致崩溃的数据问题
 */
function migrateToV21(): void {
  console.log('📦 迁移到 v2.1: 修复数据兼容性问题');
  
  // 1. 验证并修复应用状态
  const appStateKey = 'investment-news-analyzer-state';
  try {
    const appState = localStorage.getItem(appStateKey);
    if (appState) {
      const parsed = JSON.parse(appState);
      
      // 验证数据结构
      if (!isValidAppState(parsed)) {
        console.log('  - 应用状态数据无效，清除');
        localStorage.removeItem(appStateKey);
      } else {
        // 更新版本号
        parsed.version = '2.1';
        localStorage.setItem(appStateKey, JSON.stringify(parsed));
      }
    }
  } catch (error) {
    console.error('  - 验证应用状态失败，清除:', error);
    localStorage.removeItem(appStateKey);
  }
  
  // 2. 清除并重建情绪历史数据（修复 timestamp 类型问题）
  const sentimentHistoryKey = 'sentiment-history';
  try {
    const sentimentHistory = localStorage.getItem(sentimentHistoryKey);
    if (sentimentHistory) {
      const parsed = JSON.parse(sentimentHistory);
      
      // 验证并修复情绪历史数据
      let needsUpdate = false;
      for (const assetType in parsed) {
        if (Array.isArray(parsed[assetType])) {
          parsed[assetType] = parsed[assetType].filter((snapshot: any) => {
            // 确保必需字段存在
            if (!snapshot.date || !snapshot.score || !snapshot.level || !snapshot.timestamp) {
              needsUpdate = true;
              return false;
            }
            
            // 确保 timestamp 是数字
            if (typeof snapshot.timestamp !== 'number') {
              const ts = Number(snapshot.timestamp);
              if (isNaN(ts)) {
                needsUpdate = true;
                return false;
              }
              snapshot.timestamp = ts;
              needsUpdate = true;
            }
            
            return true;
          });
        }
      }
      
      if (needsUpdate) {
        console.log('  - 修复情绪历史数据');
        localStorage.setItem(sentimentHistoryKey, JSON.stringify(parsed));
      }
    }
  } catch (error) {
    console.error('  - 验证情绪历史失败，清除:', error);
    localStorage.removeItem(sentimentHistoryKey);
  }
}

/**
 * 迁移到 v2.2
 * 彻底清除所有旧的分析数据，防止 timestamp 类型问题
 */
function migrateToV22(): void {
  console.log('📦 迁移到 v2.2: 彻底清除旧的分析数据');
  
  // 1. 清除情绪历史数据
  const sentimentHistoryKey = 'sentiment-history';
  if (localStorage.getItem(sentimentHistoryKey)) {
    console.log('  - 清除情绪历史数据');
    localStorage.removeItem(sentimentHistoryKey);
  }
  
  // 2. 清除应用状态中的所有分析数据
  const appStateKey = 'investment-news-analyzer-state';
  try {
    const appState = localStorage.getItem(appStateKey);
    if (appState) {
      const parsed = JSON.parse(appState);
      
      // 清除所有分析相关数据
      console.log('  - 清除应用状态中的分析数据');
      parsed.analysis = {
        gold: [],
        nasdaq: []
      };
      parsed.overallAnalysis = {
        gold: null,
        nasdaq: null
      };
      
      // 更新版本号
      parsed.version = '2.2';
      
      // 保存清理后的数据
      localStorage.setItem(appStateKey, JSON.stringify(parsed));
    }
  } catch (error) {
    console.error('  - 清理应用状态失败，完全清除:', error);
    localStorage.removeItem(appStateKey);
  }
  
  console.log('  ✅ v2.2 迁移完成 - 所有旧分析数据已清除');
}

/**
 * 迁移到 v2.3
 * 强制清除所有情绪历史数据，解决 Date 对象序列化问题
 */
function migrateToV23(): void {
  console.log('📦 迁移到 v2.3: 强制清除所有情绪历史数据');
  
  // 1. 强制清除情绪历史数据（无论格式如何）
  const sentimentHistoryKey = 'sentiment-history';
  console.log('  - 强制清除 sentiment-history');
  localStorage.removeItem(sentimentHistoryKey);
  
  // 2. 清除应用状态中的所有分析数据
  const appStateKey = 'investment-news-analyzer-state';
  try {
    const appState = localStorage.getItem(appStateKey);
    if (appState) {
      const parsed = JSON.parse(appState);
      
      // 清除所有分析相关数据
      console.log('  - 清除应用状态中的分析数据');
      if (parsed.analysis) {
        parsed.analysis = {
          gold: [],
          nasdaq: []
        };
      }
      if (parsed.overallAnalysis) {
        parsed.overallAnalysis = {
          gold: null,
          nasdaq: null
        };
      }
      
      // 更新版本号
      parsed.version = '2.3';
      
      // 保存清理后的数据
      localStorage.setItem(appStateKey, JSON.stringify(parsed));
    }
  } catch (error) {
    console.error('  - 清理应用状态失败，完全清除:', error);
    localStorage.removeItem(appStateKey);
  }
  
  console.log('  ✅ v2.3 迁移完成 - 所有情绪历史数据已强制清除');
}

/**
 * 迁移到 v2.4
 * 添加运行时数据验证机制
 */
function migrateToV24(): void {
  console.log('📦 迁移到 v2.4: 添加运行时数据验证');
  
  // 强制清除情绪历史数据，确保干净的开始
  console.log('  - 强制清除所有情绪历史数据');
  localStorage.removeItem(SENTIMENT_STORAGE_KEY);
  
  // 清除应用状态中的分析数据
  const appStateKey = 'investment-news-analyzer-state';
  try {
    const appState = localStorage.getItem(appStateKey);
    if (appState) {
      const parsed = JSON.parse(appState);
      
      if (parsed.analysis) {
        parsed.analysis = {
          gold: [],
          nasdaq: []
        };
      }
      if (parsed.overallAnalysis) {
        parsed.overallAnalysis = {
          gold: null,
          nasdaq: null
        };
      }
      
      parsed.version = '2.4';
      localStorage.setItem(appStateKey, JSON.stringify(parsed));
    }
  } catch (error) {
    console.error('  - 清理应用状态失败:', error);
    localStorage.removeItem(appStateKey);
  }
  
  console.log('  ✅ v2.4 迁移完成 - 已添加运行时验证机制');
}

/**
 * 验证应用状态数据结构
 */
function isValidAppState(state: any): boolean {
  if (!state || typeof state !== 'object') return false;
  
  // 检查必需的字段
  const requiredFields = ['currentAsset', 'news', 'analysis', 'priceData'];
  for (const field of requiredFields) {
    if (!(field in state)) return false;
  }
  
  // 检查 news 和 analysis 结构
  if (!state.news.gold || !state.news.nasdaq) return false;
  if (!state.analysis.gold || !state.analysis.nasdaq) return false;
  
  return true;
}

/**
 * 验证情绪历史数据结构
 */
function isValidSentimentHistory(history: unknown): boolean {
  if (!history || typeof history !== 'object') return false;
  
  // 检查每个资产类型的数据
  for (const assetType in history) {
    const data = history[assetType];
    if (!Array.isArray(data)) return false;
    
    // 检查每个快照的结构
    for (const snapshot of data) {
      if (!snapshot.date || !snapshot.score || !snapshot.level || !snapshot.timestamp) {
        return false;
      }
    }
  }
  
  return true;
}

/**
 * 清除所有数据
 */
function clearAllData(): void {
  const keysToKeep = [
    'theme', // 保留主题设置
    'dashboard_layouts', // 保留仪表盘布局
    'dashboard_current_layout', // 保留当前布局
    'portfolio_positions', // 保留投资组合
    'fund_config', // 保留基金配置
  ];
  
  const allKeys = Object.keys(localStorage);
  
  allKeys.forEach(key => {
    if (!keysToKeep.includes(key)) {
      localStorage.removeItem(key);
    }
  });
  
  // 设置迁移版本
  localStorage.setItem(MIGRATION_VERSION_KEY, CURRENT_VERSION);
}

/**
 * 检查是否需要迁移
 */
export function needsMigration(): boolean {
  const currentVersion = localStorage.getItem(MIGRATION_VERSION_KEY);
  return currentVersion !== CURRENT_VERSION;
}

/**
 * 获取当前数据版本
 */
export function getCurrentDataVersion(): string {
  return localStorage.getItem(MIGRATION_VERSION_KEY) || '未知';
}
