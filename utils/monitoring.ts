/**
 * 性能监控和错误跟踪工具
 * 提供应用性能监控和错误报告功能
 */

import { config } from '../config/env';

export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface ErrorReport {
  message: string;
  stack?: string;
  timestamp: number;
  url: string;
  userAgent: string;
  metadata?: Record<string, unknown>;
}

class MonitoringService {
  private metrics: PerformanceMetric[] = [];
  private errors: ErrorReport[] = [];
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = config.app.environment === 'production';
    this.setupErrorHandling();
    this.setupPerformanceObserver();
  }

  /**
   * 记录性能指标
   */
  recordMetric(name: string, value: number, metadata?: Record<string, unknown>): void {
    if (!this.isEnabled) return;

    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      metadata,
    };

    this.metrics.push(metric);
    
    // 保持最近1000条记录
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    // 在开发环境下输出到控制台
    if (config.app.environment === 'development') {
      console.log(`📊 Performance: ${name} = ${value}ms`, metadata);
    }
  }

  /**
   * 记录错误
   */
  recordError(error: Error, metadata?: Record<string, unknown>): void {
    const errorReport: ErrorReport = {
      message: error.message,
      stack: error.stack,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      metadata,
    };

    this.errors.push(errorReport);
    
    // 保持最近100条错误记录
    if (this.errors.length > 100) {
      this.errors = this.errors.slice(-100);
    }

    // 在开发环境下输出到控制台
    if (config.app.environment === 'development') {
      console.error('🚨 Error recorded:', errorReport);
    }
  }

  /**
   * 测量函数执行时间
   */
  async measureAsync<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, unknown>
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await fn();
      const duration = performance.now() - startTime;
      this.recordMetric(name, duration, metadata);
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.recordMetric(`${name}_error`, duration, metadata);
      this.recordError(error as Error, { operation: name, ...metadata });
      throw error;
    }
  }

  /**
   * 测量同步函数执行时间
   */
  measure<T>(
    name: string,
    fn: () => T,
    metadata?: Record<string, unknown>
  ): T {
    const startTime = performance.now();
    
    try {
      const result = fn();
      const duration = performance.now() - startTime;
      this.recordMetric(name, duration, metadata);
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.recordMetric(`${name}_error`, duration, metadata);
      this.recordError(error as Error, { operation: name, ...metadata });
      throw error;
    }
  }

  /**
   * 获取性能统计
   */
  getPerformanceStats(): {
    totalMetrics: number;
    averageResponseTime: number;
    errorRate: number;
    recentErrors: ErrorReport[];
  } {
    const totalMetrics = this.metrics.length;
    const averageResponseTime = totalMetrics > 0 
      ? this.metrics.reduce((sum, m) => sum + m.value, 0) / totalMetrics 
      : 0;
    
    const recentErrors = this.errors.slice(-10);
    const errorRate = this.errors.length / Math.max(totalMetrics, 1);

    return {
      totalMetrics,
      averageResponseTime,
      errorRate,
      recentErrors,
    };
  }

  /**
   * 设置全局错误处理
   */
  private setupErrorHandling(): void {
    // 捕获未处理的Promise拒绝
    window.addEventListener('unhandledrejection', (event) => {
      this.recordError(new Error(event.reason), {
        type: 'unhandledrejection',
        reason: event.reason,
      });
    });

    // 捕获全局错误
    window.addEventListener('error', (event) => {
      this.recordError(new Error(event.message), {
        type: 'global_error',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });
  }

  /**
   * 设置性能观察器
   */
  private setupPerformanceObserver(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      // 观察导航性能
      const navObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            this.recordMetric('page_load_time', navEntry.loadEventEnd - navEntry.fetchStart);
            this.recordMetric('dom_content_loaded', navEntry.domContentLoadedEventEnd - navEntry.fetchStart);
          }
        }
      });
      navObserver.observe({ entryTypes: ['navigation'] });

      // 观察资源加载性能
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource') {
            const resourceEntry = entry as PerformanceResourceTiming;
            this.recordMetric('resource_load_time', resourceEntry.responseEnd - resourceEntry.fetchStart, {
              resource: resourceEntry.name,
              type: resourceEntry.initiatorType,
            });
          }
        }
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
    } catch (error) {
      console.warn('Performance observer setup failed:', error);
    }
  }
}

// 导出单例实例
export const monitoring = new MonitoringService();

// 导出便捷函数
export const recordMetric = monitoring.recordMetric.bind(monitoring);
export const recordError = monitoring.recordError.bind(monitoring);
export const measureAsync = monitoring.measureAsync.bind(monitoring);
export const measure = monitoring.measure.bind(monitoring);
export const getPerformanceStats = monitoring.getPerformanceStats.bind(monitoring);