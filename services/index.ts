/**
 * API服务层统一入口
 * 导出所有服务实例和相关工具
 */

import { newsService } from './newsService';
import { priceService } from './priceService';
import { analysisService } from './analysisService';
import { logInfo, logError, checkHealth } from './logger';
import { promptConfigService } from './promptConfigService';

export { NewsService, newsService } from './newsService';
export { PriceService, priceService } from './priceService';
export { AnalysisService, analysisService } from './analysisService';
export { logInfo, logError, checkHealth } from './logger';
export { promptConfigService } from './promptConfigService';

// 服务管理器
export class ServiceManager {
  private static instance: ServiceManager;
  private cleanupInterval: NodeJS.Timeout | null = null;

  private constructor() {}

  public static getInstance(): ServiceManager {
    if (!ServiceManager.instance) {
      ServiceManager.instance = new ServiceManager();
    }
    return ServiceManager.instance;
  }

  /**
   * 初始化所有服务
   */
  public async initialize(): Promise<void> {
    try {
      logInfo('开始初始化API服务');
      
      // 检查服务健康状态
      const isHealthy = await checkHealth();
      if (!isHealthy) {
        logError('服务健康检查失败');
        throw new Error('服务初始化失败');
      }

      // 启动定期清理缓存
      this.startCacheCleanup();
      
      logInfo('API服务初始化完成');
    } catch (error) {
      logError('API服务初始化失败', error);
      throw error;
    }
  }

  /**
   * 启动缓存清理
   */
  private startCacheCleanup(): void {
    // 每10分钟清理一次过期缓存
    this.cleanupInterval = setInterval(() => {
      try {
        newsService.clearExpiredCache();
        priceService.clearExpiredCache();
        analysisService.clearExpiredCache();
        logInfo('缓存清理完成');
      } catch (error) {
        logError('缓存清理失败', error);
      }
    }, 10 * 60 * 1000);
  }

  /**
   * 停止服务管理器
   */
  public shutdown(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    logInfo('服务管理器已停止');
  }

  /**
   * 获取所有服务的缓存统计
   */
  public getCacheStats(): {
    news: { size: number };
    price: { priceCache: number; assetCache: number };
    analysis: { size: number; keys: string[] };
  } {
    return {
      news: { size: (newsService as any).cache?.size || 0 },
      price: priceService.getCacheStats(),
      analysis: analysisService.getCacheStats()
    };
  }

  /**
   * 清理所有缓存
   */
  public clearAllCaches(): void {
    newsService.clearExpiredCache();
    priceService.clearExpiredCache();
    analysisService.clearExpiredCache();
    logInfo('所有缓存已清理');
  }
}

/**
 * 默认服务管理器实例
 */
export const serviceManager = ServiceManager.getInstance();