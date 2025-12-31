/**
 * 数据迁移工具
 * 处理 localStorage 数据格式升级
 */

const MIGRATION_VERSION_KEY = 'data-migration-version';
const CURRENT_VERSION = '2.2'; // 升级到 2.2，彻底清除旧的分析数据

/**
 * 执行数据迁移
 */
export function migrateData(): void {
  try {
    const currentVersion = localStorage.getItem(MIGRATION_VERSION_KEY);
    
    // 如果已经是最新版本，跳过
    if (currentVersion === CURRENT_VERSION) {
      return;
    }
    
    console.log(`🔄 开始数据迁移: ${currentVersion || '旧版本'} → ${CURRENT_VERSION}`);
    
    // 执行迁移步骤
    if (!currentVersion || currentVersion < '2.0') {
      migrateToV2();
    }
    
    if (!currentVersion || currentVersion < '2.1') {
      migrateToV21();
    }
    
    if (!currentVersion || currentVersion < '2.2') {
      migrateToV22();
    }
    
    // 更新版本号
    localStorage.setItem(MIGRATION_VERSION_KEY, CURRENT_VERSION);
    console.log('✅ 数据迁移完成');
    
  } catch (error) {
    console.error('❌ 数据迁移失败:', error);
    // 迁移失败时，清除所有数据以避免错误
    console.warn('⚠️ 清除所有数据以避免兼容性问题');
    clearAllData();
  }
}

/**
 * 迁移到 v2.0
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
