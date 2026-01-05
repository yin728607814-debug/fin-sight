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
    
    // 如果已经是最新版本，跳过迁移
    if (currentVersion === CURRENT_VERSION) {
      return;
    }
    
    // 跳过旧的迁移，直接到 v2.4-debug
    if (!currentVersion || currentVersion < '2.4-debug') {
      migrateToV24Debug();
    }
    
    // 更新版本号
    localStorage.setItem(MIGRATION_VERSION_KEY, CURRENT_VERSION);
    
  } catch (error) {
    console.error('❌ 数据迁移失败:', error);
  }
}

/**
 * 迁移到 v2.4-debug
 * 调试版本：不清除数据，只添加日志
 */
function migrateToV24Debug(): void {
  // 保留所有数据，不做任何操作
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
