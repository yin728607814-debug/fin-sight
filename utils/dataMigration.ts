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
          parsed[assetType].forEach((snapshot: unknown, index: number) => {
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
