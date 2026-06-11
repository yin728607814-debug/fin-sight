/**
 * 紧急恢复工具
 * 用于处理应用崩溃和数据损坏的情况
 */

/**
 * 清除所有可能导致问题的缓存和存储
 */
export function emergencyCleanup(): void {
  try {
    console.log('🚨 执行紧急清理...');
    
    // 需要保留的关键数据
    const keysToKeep = [
      'sentiment-history',  // 情绪历史数据
      'theme',              // 主题设置
      'dashboard_layouts',  // 仪表板布局
      'dashboard_current_layout',
      'portfolio_positions', // 投资组合
      'fund_config'         // 基金配置
    ];
    
    // 清除其他 localStorage
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && !keysToKeep.includes(key)) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key);
        console.log(`✅ 已清除: ${key}`);
      } catch (e) {
        console.warn(`⚠️ 无法清除: ${key}`, e);
      }
    });
    
    // 清除 sessionStorage
    try {
      sessionStorage.clear();
      console.log('✅ 已清除 sessionStorage');
    } catch (e) {
      console.warn('⚠️ 无法清除 sessionStorage', e);
    }
    
    console.log('✅ 紧急清理完成');
    console.log(`📊 保留了 ${keysToKeep.length} 个关键数据`);
  } catch (error) {
    console.error('❌ 紧急清理失败:', error);
  }
}

/**
 * 检查并修复损坏的数据
 */
export function checkAndRepairData(): boolean {
  try {
    const keys = ['market-analysis-state', 'sentiment-history', 'price-cache'];
    let hasCorruption = false;
    
    keys.forEach(key => {
      try {
        const data = localStorage.getItem(key);
        if (data) {
          JSON.parse(data); // 尝试解析
        }
      } catch (e) {
        console.warn(`⚠️ 检测到损坏的数据: ${key}`, e);
        localStorage.removeItem(key);
        hasCorruption = true;
      }
    });
    
    return hasCorruption;
  } catch (error) {
    console.error('❌ 数据检查失败:', error);
    return false;
  }
}

/**
 * 安全地获取 localStorage 数据
 */
export function safeGetLocalStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;
    
    const parsed = JSON.parse(item);
    return parsed as T;
  } catch (error) {
    console.warn(`⚠️ 无法读取 ${key}, 使用默认值`, error);
    // 清除损坏的数据
    try {
      localStorage.removeItem(key);
    } catch (e) {
      // 忽略清除错误
    }
    return defaultValue;
  }
}

/**
 * 安全地设置 localStorage 数据
 */
export function safeSetLocalStorage(key: string, value: any): boolean {
  let serialized = '';
  try {
    serialized = JSON.stringify(value);
    localStorage.setItem(key, serialized);
    return true;
  } catch (error) {
    console.warn(`⚠️ 无法保存 ${key}`, error);
    
    // 如果是配额超限，尝试清理旧数据
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      console.log('💾 存储空间不足，尝试清理...');
      try {
        // 清理一些可能的大数据
        localStorage.removeItem('price-cache');
        localStorage.removeItem('sentiment-history');
        
        // 再次尝试保存
        localStorage.setItem(key, serialized);
        return true;
      } catch (retryError) {
        console.error('❌ 清理后仍无法保存', retryError);
      }
    }
    
    return false;
  }
}

/**
 * 在窗口上暴露紧急恢复函数，方便用户在控制台调用
 */
if (typeof window !== 'undefined') {
  (window as any).emergencyCleanup = emergencyCleanup;
  (window as any).checkAndRepairData = checkAndRepairData;
  (window as any).checkSentimentHistory = () => {
    const data = localStorage.getItem('sentiment-history');
    if (data) {
      try {
        const parsed = JSON.parse(data);
        console.log('📊 情绪历史数据:', parsed);
        for (const assetType in parsed) {
          console.log(`  ${assetType}: ${parsed[assetType].length} 条记录`);
        }
        return parsed;
      } catch (e) {
        console.error('❌ 情绪历史数据损坏:', e);
        return null;
      }
    } else {
      console.log('⚠️ 没有情绪历史数据');
      return null;
    }
  };
  
  console.log('🔧 紧急恢复工具已加载');
  console.log('💡 可用命令:');
  console.log('  - emergencyCleanup() - 清除缓存（保留重要数据）');
  console.log('  - checkAndRepairData() - 检查并修复损坏的数据');
  console.log('  - checkSentimentHistory() - 查看情绪历史数据');
}
