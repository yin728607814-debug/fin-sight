/**
 * 性能优化工具函数
 */

/**
 * 防抖函数
 * 在事件被触发n秒后再执行回调，如果在这n秒内又被触发，则重新计时
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * 节流函数
 * 规定在一个单位时间内，只能触发一次函数。如果这个单位时间内触发多次函数，只有一次生效
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * localStorage 安全操作包装器
 * 处理 localStorage 满的情况
 */
export const safeLocalStorage = {
  /**
   * 安全设置 localStorage
   */
  setItem(key: string, value: string): boolean {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.warn('localStorage quota exceeded, attempting to clear old data');
        
        // 尝试清理旧数据
        this.clearOldData();
        
        // 再次尝试保存
        try {
          localStorage.setItem(key, value);
          return true;
        } catch (retryError) {
          console.error('Failed to save to localStorage even after cleanup', retryError);
          return false;
        }
      }
      console.error('Failed to save to localStorage', error);
      return false;
    }
  },

  /**
   * 安全获取 localStorage
   */
  getItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('Failed to read from localStorage', error);
      return null;
    }
  },

  /**
   * 安全删除 localStorage
   */
  removeItem(key: string): boolean {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Failed to remove from localStorage', error);
      return false;
    }
  },

  /**
   * 清理旧数据
   * 优先清理最旧的数据
   */
  clearOldData(): void {
    const keysToCheck = [
      'sentiment_history_',
      'portfolio_history_',
      'chat_history_',
      'dashboard_layouts',
    ];

    // 尝试清理历史数据
    for (const prefix of keysToCheck) {
      const keys = Object.keys(localStorage).filter(key => key.startsWith(prefix));
      
      if (keys.length > 0) {
        // 删除最旧的一半数据
        const keysToDelete = keys.slice(0, Math.ceil(keys.length / 2));
        keysToDelete.forEach(key => localStorage.removeItem(key));
        console.log(`Cleared ${keysToDelete.length} old items with prefix: ${prefix}`);
        return;
      }
    }
  },

  /**
   * 获取 localStorage 使用情况
   */
  getUsage(): { used: number; total: number; percentage: number } {
    let used = 0;
    const total = 5 * 1024 * 1024; // 假设 5MB 限制

    try {
      for (const key in localStorage) {
        if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
          used += localStorage[key].length + key.length;
        }
      }
    } catch (error) {
      console.error('Failed to calculate localStorage usage', error);
    }

    return {
      used,
      total,
      percentage: (used / total) * 100,
    };
  },
};

/**
 * 批量更新优化
 * 将多个更新合并为一次
 */
export function batchUpdates<T>(
  updates: T[],
  updateFn: (batch: T[]) => void,
  batchSize: number = 10
): void {
  for (let i = 0; i < updates.length; i += batchSize) {
    const batch = updates.slice(i, i + batchSize);
    updateFn(batch);
  }
}

/**
 * 延迟执行
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 请求动画帧节流
 * 用于优化滚动、拖拽等高频事件
 */
export function rafThrottle<T extends (...args: any[]) => any>(
  func: T
): (...args: Parameters<T>) => void {
  let rafId: number | null = null;

  return function executedFunction(...args: Parameters<T>) {
    if (rafId !== null) {
      return;
    }

    rafId = requestAnimationFrame(() => {
      func(...args);
      rafId = null;
    });
  };
}
