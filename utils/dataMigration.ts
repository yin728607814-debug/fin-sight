/**
 * 数据迁移工具
 * 处理 localStorage 数据格式升级
 */

const MIGRATION_VERSION_KEY = 'data-migration-version';
const CURRENT_VERSION = '2.0';

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
 * 清除所有数据
 */
function clearAllData(): void {
  const keysToKeep = [
    'theme', // 保留主题设置
    'dashboard_layouts', // 保留仪表盘布局
    'dashboard_current_layout', // 保留当前布局
    'portfolio_positions', // 保留投资组合
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
