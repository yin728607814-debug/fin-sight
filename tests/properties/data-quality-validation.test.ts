/**
 * Property 6: 数据质量验证属性测试
 * 验证数据验证服务的正确性属性
 */

import fc from 'fast-check';
import { DataValidationService, ValidationResult, DataQualityMetrics } from '../../services/dataValidationService';
import { HistoricalPriceData } from '../../types';

describe('Property 6: 数据质量验证', () => {
  let validationService: DataValidationService;

  beforeEach(() => {
    validationService = new DataValidationService();
  });

  // 生成有效的历史价格数据
  const validHistoricalDataArbitrary = fc.record({
    date: fc.date({ min: new Date('2020-01-01'), max: new Date('2024-12-31') })
      .map(d => d.toISOString().split('T')[0]),
    open: fc.float({ min: 1500, max: 2500 }).filter(n => isFinite(n)),
    high: fc.float({ min: 1500, max: 2500 }).filter(n => isFinite(n)),
    low: fc.float({ min: 1500, max: 2500 }).filter(n => isFinite(n)),
    close: fc.float({ min: 1500, max: 2500 }).filter(n => isFinite(n)),
    volume: fc.integer({ min: 1000, max: 1000000 }),
    change: fc.float({ min: -100, max: 100 }).filter(n => isFinite(n)),
    changePercent: fc.float({ min: -5, max: 5 }).filter(n => isFinite(n)),
    source: fc.constantFrom('yahoo', 'investing', 'alphavantage'),
    isReal: fc.constant(true),
    lastUpdated: fc.date().map(d => d.toISOString())
  }).map(data => {
    // 确保OHLC逻辑关系正确
    const prices = [data.open, data.close].sort((a, b) => a - b);
    return {
      ...data,
      low: Math.min(data.low, prices[0]),
      high: Math.max(data.high, prices[1])
    };
  });

  // 生成无效的历史价格数据
  const invalidHistoricalDataArbitrary = fc.record({
    date: fc.oneof(
      fc.constant(''), // 空日期
      fc.constant('invalid-date'), // 无效日期格式
      fc.date().map(d => d.toISOString().split('T')[0])
    ),
    open: fc.oneof(
      fc.float({ min: 1500, max: 2500 }),
      fc.constant(NaN),
      fc.constant(-1)
    ),
    high: fc.oneof(
      fc.float({ min: 1500, max: 2500 }),
      fc.constant(NaN),
      fc.constant(-1)
    ),
    low: fc.oneof(
      fc.float({ min: 1500, max: 2500 }),
      fc.constant(NaN),
      fc.constant(-1)
    ),
    close: fc.oneof(
      fc.float({ min: 1500, max: 2500 }),
      fc.constant(NaN),
      fc.constant(-1),
      fc.float({ min: 5000, max: 10000 }) // 超出合理范围
    ),
    volume: fc.oneof(
      fc.integer({ min: 1000, max: 1000000 }),
      fc.constant(NaN),
      fc.constant(-1)
    ),
    change: fc.float({ min: -100, max: 100 }),
    changePercent: fc.float({ min: -5, max: 5 }),
    source: fc.constantFrom('yahoo', 'investing', 'alphavantage'),
    isReal: fc.constant(true),
    lastUpdated: fc.date().map(d => d.toISOString())
  });

  describe('数据验证基本属性', () => {
    test('Property: 有效数据应该通过验证', () => {
      fc.assert(fc.property(
        fc.array(validHistoricalDataArbitrary, { minLength: 1, maxLength: 10 }),
        (data: HistoricalPriceData[]) => {
          // 确保日期唯一且有序
          const sortedData = data
            .map((item, index) => ({
              ...item,
              date: new Date(Date.now() - (data.length - index) * 24 * 60 * 60 * 1000)
                .toISOString().split('T')[0]
            }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

          const result = validationService.validateHistoricalData(sortedData, 'gold');
          
          // 如果没有错误，质量评分应该较高
          if (result.errors.length === 0) {
            expect(result.qualityScore).toBeGreaterThan(50);
          }
          
          // 不应该有严重错误
          const criticalErrors = result.errors.filter(error => 
            error.includes('缺少') || error.includes('无效') || error.includes('超出合理范围')
          );
          expect(criticalErrors.length).toBe(0);
        }
      ), { numRuns: 50 });
    });

    test('Property: 无效数据应该被检测出来', () => {
      fc.assert(fc.property(
        fc.array(invalidHistoricalDataArbitrary, { minLength: 1, maxLength: 5 }),
        (data: HistoricalPriceData[]) => {
          const result = validationService.validateHistoricalData(data, 'gold');
          
          // 检查数据是否确实包含明显的无效值
          const hasObviousInvalidData = data.some(item => 
            isNaN(item.open) || isNaN(item.high) || isNaN(item.low) || isNaN(item.close) ||
            item.open < 0 || item.high < 0 || item.low < 0 || item.close < 0 ||
            item.date === '' || item.date === 'invalid-date'
          );
          
          // 只有当数据确实包含明显无效值时，才期望检测到问题
          if (hasObviousInvalidData) {
            const hasIssues = result.errors.length > 0 || result.warnings.length > 0;
            expect(hasIssues).toBe(true);
            
            // 质量评分应该较低
            if (result.errors.length > 0) {
              expect(result.qualityScore).toBeLessThan(90);
            }
          }
          
          return true; // 总是返回true，因为我们已经在条件内进行了验证
        }
      ), { numRuns: 30 });
    });

    test('Property: 空数据集应该返回无效结果', () => {
      const result = validationService.validateHistoricalData([], 'gold');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('数据集为空');
      expect(result.qualityScore).toBe(0);
      expect(result.metadata.totalDataPoints).toBe(0);
    });
  });

  describe('价格范围验证属性', () => {
    test('Property: 合理价格范围内的价格应该通过验证', () => {
      fc.assert(fc.property(
        fc.float({ min: 1000, max: 3000 }).filter(n => isFinite(n)),
        (price: number) => {
          const result = validationService.validatePriceRange(price, 'gold');
          expect(result.isValid).toBe(true);
          expect(result.message).toBeUndefined();
        }
      ), { numRuns: 100 });
    });

    test('Property: 超出合理范围的价格应该被拒绝', () => {
      fc.assert(fc.property(
        fc.oneof(
          fc.float({ min: -1000, max: 999 }).filter(n => isFinite(n)), // 低于最小值
          fc.float({ min: 3001, max: 10000 }).filter(n => isFinite(n)) // 高于最大值
        ),
        (price: number) => {
          const result = validationService.validatePriceRange(price, 'gold');
          expect(result.isValid).toBe(false);
          expect(result.message).toBeDefined();
          expect(result.message).toMatch(/价格.*合理范围/);
        }
      ), { numRuns: 50 });
    });
  });

  describe('异常波动检测属性', () => {
    test('Property: 正常波动应该不被标记为异常', () => {
      fc.assert(fc.property(
        fc.float({ min: 1800, max: 2200 }).filter(n => isFinite(n) && n > 0),
        fc.float({ min: -2, max: 2 }), // 小幅变化百分比
        (basePrice: number, changePercent: number) => {
          const newPrice = basePrice * (1 + changePercent / 100);
          const result = validationService.detectAbnormalVolatility(newPrice, basePrice, 5);
          
          expect(result.isAbnormal).toBe(false);
          expect(result.severity).toBe('normal');
          if (isFinite(result.changePercent)) {
            expect(result.changePercent).toBeLessThan(5);
          }
        }
      ), { numRuns: 100 });
    });

    test('Property: 异常波动应该被正确检测', () => {
      fc.assert(fc.property(
        fc.float({ min: 1800, max: 2200 }).filter(n => isFinite(n) && n > 0),
        fc.float({ min: 6, max: 20 }).filter(n => isFinite(n)), // 大幅变化百分比
        (basePrice: number, changePercent: number) => {
          const newPrice = basePrice * (1 + changePercent / 100);
          if (!isFinite(newPrice)) return; // 跳过无效值
          
          const result = validationService.detectAbnormalVolatility(newPrice, basePrice, 5);
          
          expect(result.isAbnormal).toBe(true);
          if (isFinite(result.changePercent)) {
            expect(result.changePercent).toBeGreaterThan(5);
            
            if (result.changePercent > 10) {
              expect(result.severity).toMatch(/medium|high/);
            }
          }
        }
      ), { numRuns: 50 });
    });
  });

  describe('数据质量指标属性', () => {
    test('Property: 质量指标应该在合理范围内', () => {
      fc.assert(fc.property(
        fc.array(validHistoricalDataArbitrary, { minLength: 5, maxLength: 20 }),
        (data: HistoricalPriceData[]) => {
          // 确保日期唯一且有序
          const sortedData = data
            .map((item, index) => ({
              ...item,
              date: new Date(Date.now() - (data.length - index) * 24 * 60 * 60 * 1000)
                .toISOString().split('T')[0]
            }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

          const validationResult = validationService.validateHistoricalData(sortedData, 'gold');
          const qualityMetrics = validationService.getDataQualityMetrics(validationResult);
          
          // 所有指标应该在0-100范围内
          expect(qualityMetrics.completeness).toBeGreaterThanOrEqual(0);
          expect(qualityMetrics.completeness).toBeLessThanOrEqual(100);
          
          expect(qualityMetrics.consistency).toBeGreaterThanOrEqual(0);
          expect(qualityMetrics.consistency).toBeLessThanOrEqual(100);
          
          expect(qualityMetrics.accuracy).toBeGreaterThanOrEqual(0);
          expect(qualityMetrics.accuracy).toBeLessThanOrEqual(100);
          
          expect(qualityMetrics.timeliness).toBeGreaterThanOrEqual(0);
          expect(qualityMetrics.timeliness).toBeLessThanOrEqual(100);
          
          expect(qualityMetrics.overall).toBeGreaterThanOrEqual(0);
          expect(qualityMetrics.overall).toBeLessThanOrEqual(100);
          
          // 对于有效数据，完整性应该很高
          if (validationResult.errors.length === 0) {
            expect(qualityMetrics.completeness).toBeGreaterThan(80);
          }
        }
      ), { numRuns: 30 });
    });

    test('Property: 质量评分应该反映数据质量', () => {
      fc.assert(fc.property(
        fc.integer({ min: 1, max: 10 }),
        fc.integer({ min: 0, max: 5 }),
        fc.integer({ min: 0, max: 3 }),
        (validPoints: number, errors: number, warnings: number) => {
          const totalPoints = validPoints + errors;
          
          // 创建模拟验证结果
          const mockValidationResult: ValidationResult = {
            isValid: errors === 0,
            errors: Array(errors).fill('模拟错误'),
            warnings: Array(warnings).fill('模拟警告'),
            qualityScore: 0, // 将被重新计算
            metadata: {
              totalDataPoints: totalPoints,
              validDataPoints: validPoints,
              missingDataPoints: errors,
              anomalousDataPoints: warnings,
              dateRange: { start: '2024-01-01', end: '2024-01-10' }
            }
          };
          
          const qualityMetrics = validationService.getDataQualityMetrics(mockValidationResult);
          
          // 更多错误应该导致更低的准确性分数
          if (errors > 0) {
            expect(qualityMetrics.accuracy).toBeLessThan(100);
          }
          
          // 完整性应该反映有效数据点的比例
          const expectedCompleteness = Math.round((validPoints / totalPoints) * 100);
          expect(qualityMetrics.completeness).toBe(expectedCompleteness);
        }
      ), { numRuns: 50 });
    });
  });

  describe('OHLC数据逻辑验证属性', () => {
    test('Property: 违反OHLC逻辑关系的数据应该被检测', () => {
      fc.assert(fc.property(
        fc.float({ min: 1500, max: 2500 }),
        fc.float({ min: 1500, max: 2500 }),
        fc.float({ min: 1500, max: 2500 }),
        fc.float({ min: 1500, max: 2500 }),
        (open: number, high: number, low: number, close: number) => {
          // 故意创建违反OHLC逻辑的数据
          const invalidData: HistoricalPriceData = {
            date: '2024-01-01',
            open,
            high: Math.min(high, low) - 1, // 最高价低于最低价
            low,
            close,
            volume: 10000,
            change: 0,
            changePercent: 0,
            source: 'test',
            isReal: true,
            lastUpdated: new Date().toISOString()
          };
          
          const result = validationService.validateHistoricalData([invalidData], 'gold');
          
          // 应该检测到OHLC逻辑错误
          const hasOHLCError = result.errors.some(error => 
            error.includes('最高价') || error.includes('最低价')
          );
          expect(hasOHLCError).toBe(true);
          expect(result.isValid).toBe(false);
        }
      ), { numRuns: 30 });
    });
  });

  describe('数据连续性验证属性', () => {
    test('Property: 日期顺序错误应该被检测', () => {
      const invalidData: HistoricalPriceData[] = [
        {
          date: '2024-01-02',
          open: 2000, high: 2010, low: 1990, close: 2005,
          volume: 10000, change: 5, changePercent: 0.25,
          source: 'test', isReal: true, lastUpdated: new Date().toISOString()
        },
        {
          date: '2024-01-01', // 日期倒序
          open: 1995, high: 2005, low: 1985, close: 2000,
          volume: 10000, change: 0, changePercent: 0,
          source: 'test', isReal: true, lastUpdated: new Date().toISOString()
        }
      ];
      
      const result = validationService.validateHistoricalData(invalidData, 'gold');
      
      // 应该检测到日期顺序错误
      const hasDateOrderError = result.errors.some(error => 
        error.includes('日期顺序错误')
      );
      expect(hasDateOrderError).toBe(true);
    });

    test('Property: 数据间隔过大应该被检测', () => {
      const dataWithGap: HistoricalPriceData[] = [
        {
          date: '2024-01-01',
          open: 2000, high: 2010, low: 1990, close: 2005,
          volume: 10000, change: 5, changePercent: 0.25,
          source: 'test', isReal: true, lastUpdated: new Date().toISOString()
        },
        {
          date: '2024-01-15', // 间隔14天
          open: 1995, high: 2005, low: 1985, close: 2000,
          volume: 10000, change: -5, changePercent: -0.25,
          source: 'test', isReal: true, lastUpdated: new Date().toISOString()
        }
      ];
      
      const result = validationService.validateHistoricalData(dataWithGap, 'gold');
      
      // 应该检测到数据间隔过大
      const hasGapError = result.errors.some(error => 
        error.includes('数据间隔过大')
      );
      expect(hasGapError).toBe(true);
    });
  });
});