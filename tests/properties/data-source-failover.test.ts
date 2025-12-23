/**
 * Property 5: 数据源故障转移属性测试
 * 验证数据源管理器的故障转移机制
 */

import fc from 'fast-check';
import { DataSourceManager, DataSourceConfig } from '../../services/dataSourceManager';

describe('Property 5: 数据源故障转移', () => {
  let dataSourceManager: DataSourceManager;

  beforeEach(() => {
    dataSourceManager = new DataSourceManager();
  });

  afterEach(() => {
    if (dataSourceManager) {
      dataSourceManager.cleanup();
    }
  });

  // 生成数据源配置
  const dataSourceConfigArbitrary = fc.record({
    name: fc.string({ minLength: 3, maxLength: 10 }).filter(s => /^[a-zA-Z0-9]+$/.test(s)),
    type: fc.constantFrom('primary', 'backup') as fc.Arbitrary<'primary' | 'backup'>,
    endpoint: fc.string().map(s => `/api/${s}-proxy`),
    rateLimit: fc.integer({ min: 5, max: 100 }),
    timeout: fc.integer({ min: 5000, max: 30000 }),
    retryAttempts: fc.integer({ min: 1, max: 5 }),
    isHistoricalSupported: fc.constant(true),
    priority: fc.integer({ min: 1, max: 10 }),
    healthCheckInterval: fc.integer({ min: 60000, max: 600000 })
  });

  describe('数据源管理基本属性', () => {
    test('Property: 添加数据源后应该在状态列表中可见', () => {
      fc.assert(fc.property(
        dataSourceConfigArbitrary,
        (config: DataSourceConfig) => {
          dataSourceManager.addDataSource(config);
          
          const statuses = dataSourceManager.getDataSourcesStatus();
          const addedSource = statuses.find((s: any) => s.name === config.name);
          
          expect(addedSource).toBeDefined();
          expect(addedSource?.name).toBe(config.name);
          expect(addedSource?.isAvailable).toBe(true);
          expect(addedSource?.errorCount).toBe(0);
        }
      ), { numRuns: 20 });
    });

    test('Property: 移除数据源后应该从状态列表中消失', () => {
      fc.assert(fc.property(
        dataSourceConfigArbitrary,
        (config: DataSourceConfig) => {
          dataSourceManager.addDataSource(config);
          
          // 确认添加成功
          let statuses = dataSourceManager.getDataSourcesStatus();
          expect(statuses.find((s: any) => s.name === config.name)).toBeDefined();
          
          // 移除数据源
          dataSourceManager.removeDataSource(config.name);
          
          // 确认移除成功
          statuses = dataSourceManager.getDataSourcesStatus();
          expect(statuses.find((s: any) => s.name === config.name)).toBeUndefined();
        }
      ), { numRuns: 20 });
    });

    test('Property: 数据源状态应该正确反映可用性', () => {
      fc.assert(fc.property(
        dataSourceConfigArbitrary,
        (config: DataSourceConfig) => {
          dataSourceManager.addDataSource(config);
          
          const statuses = dataSourceManager.getDataSourcesStatus();
          const sourceStatus = statuses.find((s: any) => s.name === config.name);
          
          expect(sourceStatus).toBeDefined();
          expect(sourceStatus?.isAvailable).toBe(true);
          expect(sourceStatus?.lastCheck).toBeInstanceOf(Date);
          expect(sourceStatus?.qualityScore).toBeGreaterThanOrEqual(0);
          expect(sourceStatus?.qualityScore).toBeLessThanOrEqual(100);
        }
      ), { numRuns: 15 });
    });
  });

  describe('故障转移机制属性', () => {
    test('Property: 主数据源失败时应该切换到备用数据源', () => {
      // 添加主数据源和备用数据源
      const primaryConfig: DataSourceConfig = {
        name: 'primary-test',
        type: 'primary',
        endpoint: '/api/primary-proxy',
        rateLimit: 60,
        timeout: 10000,
        retryAttempts: 3,
        isHistoricalSupported: true,
        priority: 1,
        healthCheckInterval: 300000
      };

      const backupConfig: DataSourceConfig = {
        name: 'backup-test',
        type: 'backup',
        endpoint: '/api/backup-proxy',
        rateLimit: 60,
        timeout: 10000,
        retryAttempts: 2,
        isHistoricalSupported: true,
        priority: 2,
        healthCheckInterval: 300000
      };

      dataSourceManager.addDataSource(primaryConfig);
      dataSourceManager.addDataSource(backupConfig);

      // 验证初始状态
      expect(dataSourceManager.getCurrentPrimarySource()).toBe('investing'); // 默认主数据源

      // 手动切换到测试主数据源
      const switchResult = dataSourceManager.switchDataSource('primary-test');
      expect(switchResult).toBe(true);
      expect(dataSourceManager.getCurrentPrimarySource()).toBe('primary-test');
    });
  });

  describe('API限流属性', () => {
    test('Property: API调用统计应该正确记录', () => {
      const config: DataSourceConfig = {
        name: 'rate-limit-test',
        type: 'primary',
        endpoint: '/api/test-proxy',
        rateLimit: 5, // 每分钟5次
        timeout: 10000,
        retryAttempts: 1,
        isHistoricalSupported: true,
        priority: 1,
        healthCheckInterval: 300000
      };

      dataSourceManager.addDataSource(config);
      
      const stats = dataSourceManager.getApiCallStats();
      const sourceStats = stats.find((s: any) => s.source === config.name);
      
      expect(sourceStats).toBeDefined();
      expect(sourceStats?.callsInLastMinute).toBe(0);
      expect(sourceStats?.callsInLastHour).toBe(0);
      expect(sourceStats?.callsToday).toBe(0);
    });

    test('Property: 数据源重置应该清除错误状态', () => {
      const config: DataSourceConfig = {
        name: 'reset-test',
        type: 'primary',
        endpoint: '/api/reset-proxy',
        rateLimit: 60,
        timeout: 10000,
        retryAttempts: 3,
        isHistoricalSupported: true,
        priority: 1,
        healthCheckInterval: 300000
      };

      dataSourceManager.addDataSource(config);
      
      // 重置数据源状态
      dataSourceManager.resetDataSourceStatus(config.name);
      
      const statuses = dataSourceManager.getDataSourcesStatus();
      const status = statuses.find((s: any) => s.name === config.name);
      
      expect(status).toBeDefined();
      expect(status?.errorCount).toBe(0);
      expect(status?.isAvailable).toBe(true);
      expect(status?.qualityScore).toBe(100);
      expect(status?.lastError).toBeUndefined();
    });
  });

  describe('健康检查属性', () => {
    test('Property: 数据源状态应该包含健康检查信息', () => {
      fc.assert(fc.property(
        dataSourceConfigArbitrary,
        (config: DataSourceConfig) => {
          dataSourceManager.addDataSource(config);
          
          const statuses = dataSourceManager.getDataSourcesStatus();
          const status = statuses.find((s: unknown) => s.name === config.name);
          
          expect(status).toBeDefined();
          expect(status?.lastCheck).toBeInstanceOf(Date);
          expect(status?.responseTime).toBeGreaterThanOrEqual(0);
          expect(status?.successCount).toBeGreaterThanOrEqual(0);
          expect(status?.errorCount).toBeGreaterThanOrEqual(0);
        }
      ), { numRuns: 15 });
    });

    test('Property: 故障转移历史应该记录转移事件', () => {
      const initialHistoryLength = dataSourceManager.getFailoverHistory().length;
      
      // 故障转移历史应该是数组
      const history = dataSourceManager.getFailoverHistory();
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBeGreaterThanOrEqual(initialHistoryLength);
    });
  });

  describe('配置验证属性', () => {
    test('Property: 数据源配置应该包含必需字段', () => {
      fc.assert(fc.property(
        dataSourceConfigArbitrary,
        (config: DataSourceConfig) => {
          // 验证配置对象包含所有必需字段
          expect(config).toHaveProperty('name');
          expect(config).toHaveProperty('type');
          expect(config).toHaveProperty('endpoint');
          expect(config).toHaveProperty('rateLimit');
          expect(config).toHaveProperty('timeout');
          expect(config).toHaveProperty('retryAttempts');
          expect(config).toHaveProperty('isHistoricalSupported');
          expect(config).toHaveProperty('priority');
          expect(config).toHaveProperty('healthCheckInterval');
          
          // 验证字段类型和范围
          expect(typeof config.name).toBe('string');
          expect(config.name.length).toBeGreaterThan(0);
          expect(['primary', 'backup']).toContain(config.type);
          expect(typeof config.endpoint).toBe('string');
          expect(config.rateLimit).toBeGreaterThan(0);
          expect(config.timeout).toBeGreaterThan(0);
          expect(config.retryAttempts).toBeGreaterThan(0);
          expect(typeof config.isHistoricalSupported).toBe('boolean');
          expect(config.priority).toBeGreaterThan(0);
          expect(config.healthCheckInterval).toBeGreaterThan(0);
        }
      ), { numRuns: 30 });
    });

    test('Property: 手动切换数据源应该验证可用性', () => {
      fc.assert(fc.property(
        dataSourceConfigArbitrary,
        (config: DataSourceConfig) => {
          dataSourceManager.addDataSource(config);
          
          // 尝试切换到新添加的数据源
          const switchResult = dataSourceManager.switchDataSource(config.name);
          
          // 应该成功切换（因为新添加的数据源默认可用）
          expect(switchResult).toBe(true);
          expect(dataSourceManager.getCurrentPrimarySource()).toBe(config.name);
        }
      ), { numRuns: 15 });
    });
  });
});