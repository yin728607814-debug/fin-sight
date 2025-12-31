/**
 * 数据源管理器
 * 实现多数据源管理、故障转移和健康检查
 */

import { HistoricalPriceData } from '../types';
import { historicalDataService } from './historicalDataService';
import { dataValidationService, ValidationResult } from './dataValidationService';
import { logInfo, logWarn, logError } from './logger';

/**
 * 数据源配置接口
 */
export interface DataSourceConfig {
  name: string;
  type: 'primary' | 'backup';
  endpoint: string;
  rateLimit: number; // 每分钟请求限制
  timeout: number; // 超时时间（毫秒）
  retryAttempts: number;
  isHistoricalSupported: boolean;
  priority: number; // 优先级，数字越小优先级越高
  healthCheckInterval: number; // 健康检查间隔（毫秒）
}

/**
 * 数据源状态
 */
export interface DataSourceStatus {
  name: string;
  isAvailable: boolean;
  lastCheck: Date;
  responseTime: number; // 响应时间（毫秒）
  errorCount: number;
  successCount: number;
  lastError?: string;
  qualityScore: number; // 数据质量评分
}

/**
 * 故障转移结果
 */
export interface FailoverResult {
  success: boolean;
  fromSource: string;
  toSource: string;
  reason: string;
  timestamp: string; // ISO字符串
}

/**
 * API调用统计
 */
export interface ApiCallStats {
  source: string;
  callsInLastMinute: number;
  callsInLastHour: number;
  callsToday: number;
  lastCallTime: Date;
}

/**
 * 数据源管理器类
 */
export class DataSourceManager {
  private dataSources: Map<string, DataSourceConfig> = new Map();
  private dataSourceStatus: Map<string, DataSourceStatus> = new Map();
  private apiCallStats: Map<string, ApiCallStats> = new Map();
  private currentPrimarySource: string = '';
  private healthCheckIntervals: Map<string, NodeJS.Timeout> = new Map();
  private failoverHistory: FailoverResult[] = [];

  constructor() {
    this.initializeDefaultDataSources();
  }

  /**
   * 初始化默认数据源配置
   */
  private initializeDefaultDataSources(): void {
    const defaultSources: DataSourceConfig[] = [
      {
        name: 'investing',
        type: 'primary',
        endpoint: '/api/investing-proxy',
        rateLimit: 60, // 每分钟60次请求
        timeout: 10000, // 10秒超时
        retryAttempts: 3,
        isHistoricalSupported: true,
        priority: 1,
        healthCheckInterval: 300000 // 5分钟检查一次
      },
      {
        name: 'yahoo',
        type: 'backup',
        endpoint: '/api/yahoo-finance-proxy',
        rateLimit: 100, // 每分钟100次请求
        timeout: 8000, // 8秒超时
        retryAttempts: 2,
        isHistoricalSupported: true,
        priority: 2,
        healthCheckInterval: 300000 // 5分钟检查一次
      },
      {
        name: 'alphavantage',
        type: 'backup',
        endpoint: '/api/alphavantage-proxy',
        rateLimit: 5, // 每分钟5次请求（免费版限制）
        timeout: 15000, // 15秒超时
        retryAttempts: 1,
        isHistoricalSupported: true,
        priority: 3,
        healthCheckInterval: 600000 // 10分钟检查一次
      }
    ];

    defaultSources.forEach(source => {
      this.addDataSource(source);
    });

    // 设置主要数据源
    this.currentPrimarySource = 'investing';
    
    logInfo('数据源管理器初始化完成', {
      sources: Array.from(this.dataSources.keys()),
      primarySource: this.currentPrimarySource
    });
  }

  /**
   * 添加数据源
   */
  public addDataSource(config: DataSourceConfig): void {
    this.dataSources.set(config.name, config);
    
    // 初始化状态
    this.dataSourceStatus.set(config.name, {
      name: config.name,
      isAvailable: true,
      lastCheck: new Date(),
      responseTime: 0,
      errorCount: 0,
      successCount: 0,
      qualityScore: 100
    });

    // 初始化API调用统计
    this.apiCallStats.set(config.name, {
      source: config.name,
      callsInLastMinute: 0,
      callsInLastHour: 0,
      callsToday: 0,
      lastCallTime: new Date(0)
    });

    // 启动健康检查
    this.startHealthCheck(config.name);
  }

  /**
   * 移除数据源
   */
  public removeDataSource(sourceName: string): void {
    // 停止健康检查
    this.stopHealthCheck(sourceName);
    
    // 清理数据
    this.dataSources.delete(sourceName);
    this.dataSourceStatus.delete(sourceName);
    this.apiCallStats.delete(sourceName);

    // 如果移除的是当前主要数据源，需要切换
    if (this.currentPrimarySource === sourceName) {
      this.switchToNextAvailableSource();
    }

    logInfo('数据源已移除', { sourceName });
  }

  /**
   * 获取历史数据（带故障转移）
   */
  public async fetchHistoricalDataWithFailover(
    symbol: string,
    days: number = 5
  ): Promise<{ data: HistoricalPriceData[]; source: string; validationResult: ValidationResult }> {
    const availableSources = this.getAvailableSourcesByPriority();
    
    if (availableSources.length === 0) {
      throw new Error('没有可用的数据源');
    }

    let lastError: Error | null = null;

    for (const sourceName of availableSources) {
      try {
        // 检查API限流
        if (!this.canMakeApiCall(sourceName)) {
          logWarn('API调用受限', { source: sourceName });
          continue;
        }

        // 记录API调用
        this.recordApiCall(sourceName);

        // 获取数据
        const startTime = Date.now();
        const data = await this.fetchFromSource(sourceName, symbol, days);
        const responseTime = Date.now() - startTime;

        // 验证数据质量
        const validationResult = dataValidationService.validateHistoricalData(data, 'gold');
        
        // 更新数据源状态
        this.updateSourceStatus(sourceName, true, responseTime, validationResult.qualityScore);

        logInfo('数据获取成功', {
          source: sourceName,
          dataPoints: data.length,
          responseTime,
          qualityScore: validationResult.qualityScore
        });

        return { data, source: sourceName, validationResult };

      } catch (error) {
        lastError = error as Error;
        
        // 更新错误状态
        this.updateSourceStatus(sourceName, false, 0, 0, (error as Error).message);
        
        logWarn('数据源获取失败，尝试下一个', {
          source: sourceName,
          error: (error as Error).message
        });

        // 如果是主要数据源失败，触发故障转移
        if (sourceName === this.currentPrimarySource) {
          this.triggerFailover(sourceName, (error as Error).message);
        }
      }
    }

    // 所有数据源都失败
    logError('所有数据源都不可用', { lastError: lastError?.message });
    throw new Error(`所有数据源都不可用: ${lastError?.message}`);
  }

  /**
   * 从指定数据源获取数据
   */
  private async fetchFromSource(
    sourceName: string,
    symbol: string,
    days: number
  ): Promise<HistoricalPriceData[]> {
    const config = this.dataSources.get(sourceName);
    if (!config) {
      throw new Error(`数据源配置不存在: ${sourceName}`);
    }

    // 这里应该调用实际的数据获取逻辑
    // 为了演示，我们使用现有的历史数据服务
    return await historicalDataService.fetchRealHistoricalData(symbol, days);
  }

  /**
   * 检查是否可以进行API调用（限流检查）
   */
  private canMakeApiCall(sourceName: string): boolean {
    const config = this.dataSources.get(sourceName);
    const stats = this.apiCallStats.get(sourceName);
    
    if (!config || !stats) {
      return false;
    }

    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60000);

    // 清理过期的调用记录
    if (stats.lastCallTime < oneMinuteAgo) {
      stats.callsInLastMinute = 0;
    }

    return stats.callsInLastMinute < config.rateLimit;
  }

  /**
   * 记录API调用
   */
  private recordApiCall(sourceName: string): void {
    const stats = this.apiCallStats.get(sourceName);
    if (!stats) return;

    const now = new Date();
    stats.callsInLastMinute++;
    stats.callsInLastHour++;
    stats.callsToday++;
    stats.lastCallTime = now;
  }

  /**
   * 更新数据源状态
   */
  private updateSourceStatus(
    sourceName: string,
    success: boolean,
    responseTime: number,
    qualityScore: number = 0,
    errorMessage?: string
  ): void {
    const status = this.dataSourceStatus.get(sourceName);
    if (!status) return;

    status.lastCheck = new Date();
    status.responseTime = responseTime;

    if (success) {
      status.successCount++;
      status.isAvailable = true;
      status.qualityScore = qualityScore;
      status.errorCount = Math.max(0, status.errorCount - 1); // 成功时减少错误计数
    } else {
      status.errorCount++;
      status.lastError = errorMessage;
      
      // 连续失败3次标记为不可用
      if (status.errorCount >= 3) {
        status.isAvailable = false;
      }
    }
  }

  /**
   * 触发故障转移
   */
  private triggerFailover(fromSource: string, reason: string): void {
    const nextSource = this.getNextAvailableSource(fromSource);
    
    if (nextSource) {
      const failoverResult: FailoverResult = {
        success: true,
        fromSource,
        toSource: nextSource,
        reason,
        timestamp: new Date().toISOString() // 使用 ISO 字符串
      };

      this.currentPrimarySource = nextSource;
      this.failoverHistory.push(failoverResult);

      logInfo('故障转移成功', failoverResult);
    } else {
      const failoverResult: FailoverResult = {
        success: false,
        fromSource,
        toSource: '',
        reason: '没有可用的备用数据源',
        timestamp: new Date().toISOString() // 使用 ISO 字符串
      };

      this.failoverHistory.push(failoverResult);
      logError('故障转移失败', failoverResult);
    }
  }

  /**
   * 获取按优先级排序的可用数据源
   */
  private getAvailableSourcesByPriority(): string[] {
    return Array.from(this.dataSources.entries())
      .filter(([name, config]) => {
        const status = this.dataSourceStatus.get(name);
        return status?.isAvailable && config.isHistoricalSupported;
      })
      .sort(([, a], [, b]) => a.priority - b.priority)
      .map(([name]) => name);
  }

  /**
   * 获取下一个可用数据源
   */
  private getNextAvailableSource(excludeSource: string): string | null {
    const availableSources = this.getAvailableSourcesByPriority()
      .filter(name => name !== excludeSource);
    
    return availableSources.length > 0 ? availableSources[0] : null;
  }

  /**
   * 切换到下一个可用数据源
   */
  private switchToNextAvailableSource(): void {
    const nextSource = this.getNextAvailableSource(this.currentPrimarySource);
    if (nextSource) {
      this.currentPrimarySource = nextSource;
      logInfo('切换到下一个可用数据源', { newPrimarySource: nextSource });
    }
  }

  /**
   * 启动健康检查
   */
  private startHealthCheck(sourceName: string): void {
    const config = this.dataSources.get(sourceName);
    if (!config) return;

    const interval = setInterval(async () => {
      await this.performHealthCheck(sourceName);
    }, config.healthCheckInterval);

    this.healthCheckIntervals.set(sourceName, interval);
  }

  /**
   * 停止健康检查
   */
  private stopHealthCheck(sourceName: string): void {
    const interval = this.healthCheckIntervals.get(sourceName);
    if (interval) {
      clearInterval(interval);
      this.healthCheckIntervals.delete(sourceName);
    }
  }

  /**
   * 执行健康检查
   */
  private async performHealthCheck(sourceName: string): Promise<void> {
    try {
      const startTime = Date.now();
      
      // 这里应该实现实际的健康检查逻辑
      // 例如发送一个简单的ping请求
      await this.pingDataSource(sourceName);
      
      const responseTime = Date.now() - startTime;
      this.updateSourceStatus(sourceName, true, responseTime, 100);
      
    } catch (error) {
      this.updateSourceStatus(sourceName, false, 0, 0, (error as Error).message);
    }
  }

  /**
   * Ping数据源
   */
  private async pingDataSource(_sourceName: string): Promise<void> {
    // 模拟ping操作
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // 90%的概率成功
        if (Math.random() > 0.1) {
          resolve();
        } else {
          reject(new Error('健康检查失败'));
        }
      }, 100);
    });
  }

  /**
   * 获取所有数据源状态
   */
  public getDataSourcesStatus(): DataSourceStatus[] {
    return Array.from(this.dataSourceStatus.values());
  }

  /**
   * 获取当前主要数据源
   */
  public getCurrentPrimarySource(): string {
    return this.currentPrimarySource;
  }

  /**
   * 获取故障转移历史
   */
  public getFailoverHistory(): FailoverResult[] {
    return [...this.failoverHistory];
  }

  /**
   * 获取API调用统计
   */
  public getApiCallStats(): ApiCallStats[] {
    return Array.from(this.apiCallStats.values());
  }

  /**
   * 手动切换数据源
   */
  public switchDataSource(sourceName: string): boolean {
    const config = this.dataSources.get(sourceName);
    const status = this.dataSourceStatus.get(sourceName);

    if (!config || !status?.isAvailable) {
      logWarn('无法切换到指定数据源', { sourceName, available: status?.isAvailable });
      return false;
    }

    const oldSource = this.currentPrimarySource;
    this.currentPrimarySource = sourceName;

    logInfo('手动切换数据源', { from: oldSource, to: sourceName });
    return true;
  }

  /**
   * 重置数据源状态
   */
  public resetDataSourceStatus(sourceName: string): void {
    const status = this.dataSourceStatus.get(sourceName);
    if (status) {
      status.errorCount = 0;
      status.isAvailable = true;
      status.lastError = undefined;
      status.qualityScore = 100;
      
      logInfo('数据源状态已重置', { sourceName });
    }
  }

  /**
   * 清理资源
   */
  public cleanup(): void {
    // 停止所有健康检查
    this.healthCheckIntervals.forEach((interval, _sourceName) => {
      clearInterval(interval);
    });
    this.healthCheckIntervals.clear();

    // 清理数据
    this.dataSources.clear();
    this.dataSourceStatus.clear();
    this.apiCallStats.clear();
    this.failoverHistory.length = 0;

    logInfo('数据源管理器已清理');
  }
}

// 导出单例实例
export const dataSourceManager = new DataSourceManager();