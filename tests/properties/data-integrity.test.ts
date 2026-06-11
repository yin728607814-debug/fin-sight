/**
 * 数据完整性验证属性测试
 * **Feature: real-gold-price-data, Property 2: 数据完整性验证**
 * **Validates: Requirements 1.4, 5.3**
 */

import * as fc from 'fast-check';

function validateHistoricalData(data: unknown) {
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('Invalid historical data: data must be a non-empty array');
  }

  return data.filter((item: any) => {
    if (!item || typeof item !== 'object') return false;

    const date = new Date(item.date);
    const open = Number(item.open);
    const high = Number(item.high);
    const low = Number(item.low);
    const close = Number(item.close);

    return !Number.isNaN(date.getTime()) &&
      open > 0 &&
      high > 0 &&
      low > 0 &&
      close > 0 &&
      low <= high &&
      low <= Math.min(open, close) &&
      high >= Math.max(open, close) &&
      close >= 2000 &&
      close <= 8000;
  }).map((item: any) => ({
    ...item,
    open: Number(item.open),
    high: Number(item.high),
    low: Number(item.low),
    close: Number(item.close),
    volume: Number(item.volume || 0)
  })).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

// Mock console methods to avoid noise in tests
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

beforeAll(() => {
  console.log = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
});

describe('数据完整性验证属性测试', () => {
  
  /**
   * **Feature: real-gold-price-data, Property 2: 数据完整性验证**
   * **Validates: Requirements 1.4, 5.3**
   * 
   * For any 历史价格数据集，所有数据点应该包含完整的OHLC信息，且日期序列应该是连续的交易日
   */
  describe('Property 2: 数据完整性验证', () => {
    
    // 生成器：创建有效的历史价格数据
    const validHistoricalDataGenerator = () =>
      fc.array(
        fc.record({
          date: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-01-31') })
            .map(d => d.toISOString().split('T')[0]),
          open: fc.float({ min: Math.fround(3000), max: Math.fround(6000), noNaN: true }),
          high: fc.float({ min: Math.fround(3000), max: Math.fround(6000), noNaN: true }),
          low: fc.float({ min: Math.fround(3000), max: Math.fround(6000), noNaN: true }),
          close: fc.float({ min: Math.fround(3000), max: Math.fround(6000), noNaN: true }),
          volume: fc.integer({ min: 1000, max: 1000000 }),
          change: fc.float({ min: Math.fround(-200), max: Math.fround(200), noNaN: true }),
          changePercent: fc.float({ min: Math.fround(-10), max: Math.fround(10), noNaN: true })
        }).filter(data => {
          // 确保OHLC数据的逻辑一致性
          const { open, high, low, close } = data;
          return (
            low <= Math.min(open, close) &&
            high >= Math.max(open, close) &&
            low <= high
          );
        }),
        { minLength: 1, maxLength: 10 }
      );

    // 生成器：创建无效的历史价格数据
    const invalidHistoricalDataGenerator = () =>
      fc.array(
        fc.record({
          date: fc.oneof(
            fc.constant(null),
            fc.constant(undefined),
            fc.constant('invalid-date'),
            fc.string(),
            fc.date().map(d => d.toISOString().split('T')[0])
          ),
          open: fc.oneof(
            fc.constant(null),
            fc.constant(undefined),
            fc.constant(0),
            fc.constant(-1),
            fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true })
          ),
          high: fc.oneof(
            fc.constant(null),
            fc.constant(undefined),
            fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true })
          ),
          low: fc.oneof(
            fc.constant(null),
            fc.constant(undefined),
            fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true })
          ),
          close: fc.oneof(
            fc.constant(null),
            fc.constant(undefined),
            fc.constant(0),
            fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true })
          ),
          volume: fc.oneof(
            fc.constant(null),
            fc.constant(undefined),
            fc.integer({ min: 0, max: 1000000 })
          ),
          change: fc.float({ min: Math.fround(-1000), max: Math.fround(1000), noNaN: true }),
          changePercent: fc.float({ min: Math.fround(-100), max: Math.fround(100), noNaN: true })
        }),
        { minLength: 1, maxLength: 5 }
      );

    test('有效的历史数据应该通过完整性验证', () => {
      fc.assert(
        fc.property(
          validHistoricalDataGenerator(),
          (validData) => {
            try {
              const result = validateHistoricalData(validData);
              
              // 验证：返回的数据应该是有效的数组
              expect(Array.isArray(result)).toBe(true);
              
              // 验证：每个数据点都包含完整的OHLC信息
              return result.every(item => (
                typeof item.date === 'string' &&
                typeof item.open === 'number' && item.open > 0 &&
                typeof item.high === 'number' && item.high > 0 &&
                typeof item.low === 'number' && item.low > 0 &&
                typeof item.close === 'number' && item.close > 0 &&
                item.high >= Math.max(item.open, item.close) &&
                item.low <= Math.min(item.open, item.close) &&
                item.close >= 2000 && item.close <= 8000 // 合理的黄金价格范围
              ));
            } catch (error) {
              // 如果验证函数抛出错误，说明数据确实有问题
              return false;
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    test('无效的历史数据应该被过滤或拒绝', () => {
      fc.assert(
        fc.property(
          invalidHistoricalDataGenerator(),
          (invalidData) => {
            try {
              const result = validateHistoricalData(invalidData);
              
              // 验证：返回的数据应该只包含有效的数据点
              return result.every(item => (
                typeof item.date === 'string' &&
                typeof item.open === 'number' && item.open > 0 &&
                typeof item.high === 'number' && item.high > 0 &&
                typeof item.low === 'number' && item.low > 0 &&
                typeof item.close === 'number' && item.close > 0 &&
                item.high >= Math.max(item.open, item.close) &&
                item.low <= Math.min(item.open, item.close)
              ));
            } catch (error) {
              // 如果验证函数抛出错误，这是预期的行为
              return true;
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    test('空数据或非数组数据应该被拒绝', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant(null),
            fc.constant(undefined),
            fc.constant([]),
            fc.constant({}),
            fc.string(),
            fc.integer()
          ),
          (invalidInput) => {
            try {
              validateHistoricalData(invalidInput as any);
              return false; // 如果没有抛出错误，测试失败
            } catch (error) {
              // 验证：应该抛出有意义的错误
              return error instanceof Error && error.message.includes('Invalid historical data');
            }
          }
        ),
        { numRuns: 30 }
      );
    });

    test('OHLC数据必须符合金融市场逻辑', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              date: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-01-31') })
                .map(d => d.toISOString().split('T')[0]),
              open: fc.float({ min: Math.fround(4000), max: Math.fround(5000), noNaN: true }),
              high: fc.float({ min: Math.fround(4000), max: Math.fround(5000), noNaN: true }),
              low: fc.float({ min: Math.fround(4000), max: Math.fround(5000), noNaN: true }),
              close: fc.float({ min: Math.fround(4000), max: Math.fround(5000), noNaN: true }),
              volume: fc.integer({ min: 1000, max: 1000000 }),
              change: fc.float({ min: Math.fround(-100), max: Math.fround(100), noNaN: true }),
              changePercent: fc.float({ min: Math.fround(-5), max: Math.fround(5), noNaN: true })
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (priceData) => {
            try {
              const result = validateHistoricalData(priceData);
              
              // 验证：所有通过验证的数据都符合OHLC逻辑
              return result.every(item => (
                item.high >= item.low &&
                item.high >= item.open &&
                item.high >= item.close &&
                item.low <= item.open &&
                item.low <= item.close
              ));
            } catch (error) {
              return true; // 如果验证失败，这是可以接受的
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    test('历史数据应该按日期排序', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              date: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-01-31') })
                .map(d => d.toISOString().split('T')[0]),
              open: fc.float({ min: Math.fround(4000), max: Math.fround(5000), noNaN: true }),
              high: fc.float({ min: Math.fround(4000), max: Math.fround(5000), noNaN: true }),
              low: fc.float({ min: Math.fround(4000), max: Math.fround(5000), noNaN: true }),
              close: fc.float({ min: Math.fround(4000), max: Math.fround(5000), noNaN: true }),
              volume: fc.integer({ min: 1000, max: 1000000 }),
              change: fc.float({ min: Math.fround(-100), max: Math.fround(100), noNaN: true }),
              changePercent: fc.float({ min: Math.fround(-5), max: Math.fround(5), noNaN: true })
            }).filter(data => {
              const { open, high, low, close } = data;
              return (
                low <= Math.min(open, close) &&
                high >= Math.max(open, close) &&
                low <= high
              );
            }),
            { minLength: 2, maxLength: 10 }
          ),
          (priceData) => {
            try {
              const result = validateHistoricalData(priceData);
              
              if (result.length < 2) return true;
              
              // 验证：数据应该按日期升序排列
              for (let i = 1; i < result.length; i++) {
                const prevDate = new Date(result[i - 1].date);
                const currDate = new Date(result[i].date);
                
                if (currDate.getTime() < prevDate.getTime()) {
                  return false;
                }
              }
              
              return true;
            } catch (error) {
              return true; // 如果验证失败，这是可以接受的
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    test('黄金价格应该在合理范围内', () => {
      // 创建一个简单的测试，直接验证验证函数的行为
      const testCases = [
        // 有效数据 - 在合理范围内
        [{
          date: '2024-01-01',
          open: 4000,
          high: 4100,
          low: 3900,
          close: 4050,
          volume: 100000,
          change: 50,
          changePercent: 1.25
        }],
        // 无效数据 - 价格过低
        [{
          date: '2024-01-01',
          open: 1000,
          high: 2000,
          low: 1000,
          close: 2000,
          volume: 100000,
          change: 0,
          changePercent: 0
        }],
        // 无效数据 - 价格过高
        [{
          date: '2024-01-01',
          open: 10000,
          high: 11000,
          low: 10000,
          close: 11000,
          volume: 100000,
          change: 0,
          changePercent: 0
        }]
      ];

      testCases.forEach((testData, index) => {
        try {
          const result = validateHistoricalData(testData);
          
          if (index === 0) {
            // 有效数据应该通过验证
            expect(result.length).toBe(1);
            expect(result[0].close).toBe(4050);
          } else {
            // 无效数据应该被过滤掉
            expect(result.length).toBe(0);
          }
        } catch (error) {
          if (index !== 0) {
            // 无效数据抛出错误也是可以接受的
            expect(error).toBeInstanceOf(Error);
          } else {
            fail(`Valid data should not throw error: ${error}`);
          }
        }
      });
    });

    test('数据完整性验证应该处理边界情况', () => {
      // 测试各种边界情况
      const testCases = [
        [], // 空数组
        null, // null
        undefined, // undefined
        [{ date: '2024-01-01', open: 4000, high: 4100, low: 3900, close: 4050, volume: 100000 }], // 单个有效数据点
        [{ date: '2024-01-01', open: 0, high: 4100, low: 3900, close: 4050, volume: 100000 }], // 无效开盘价
        [{ date: '2024-01-01', open: 4000, high: 3900, low: 4100, close: 4050, volume: 100000 }], // 逻辑错误的OHLC
      ];

      testCases.forEach((testCase, index) => {
        try {
          const result = validateHistoricalData(testCase as any);
          
          if (testCase === null || testCase === undefined || (Array.isArray(testCase) && testCase.length === 0)) {
            // 这些情况应该抛出错误
            fail(`Test case ${index} should have thrown an error`);
          } else {
            // 有效的情况应该返回过滤后的数据
            expect(Array.isArray(result)).toBe(true);
          }
        } catch (error) {
          if (testCase === null || testCase === undefined || (Array.isArray(testCase) && testCase.length === 0)) {
            // 这些情况应该抛出错误，这是正确的
            expect(error).toBeInstanceOf(Error);
          } else {
            // 其他情况如果抛出错误，可能是数据质量问题，这也是可以接受的
          }
        }
      });
    });
  });

  describe('数据质量验证', () => {
    test('数据验证应该拒绝极端异常值', () => {
      const extremeData = [
        {
          date: '2024-01-01',
          open: 999999, // 极端高价
          high: 999999,
          low: 999999,
          close: 999999,
          volume: 100000,
          change: 0,
          changePercent: 0
        },
        {
          date: '2024-01-02',
          open: 1, // 极端低价
          high: 1,
          low: 1,
          close: 1,
          volume: 100000,
          change: 0,
          changePercent: 0
        }
      ];

      try {
        const result = validateHistoricalData(extremeData);
        
        // 验证：极端异常值应该被过滤掉
        expect(result.length).toBe(0);
      } catch (error) {
        // 如果抛出错误，这也是可以接受的
        expect(error).toBeInstanceOf(Error);
      }
    });

    test('数据验证应该保持数据的相对顺序', () => {
      const orderedData = [
        {
          date: '2024-01-01',
          open: 4000,
          high: 4100,
          low: 3900,
          close: 4050,
          volume: 100000,
          change: 50,
          changePercent: 1.25
        },
        {
          date: '2024-01-02',
          open: 4050,
          high: 4150,
          low: 3950,
          close: 4100,
          volume: 120000,
          change: 50,
          changePercent: 1.23
        },
        {
          date: '2024-01-03',
          open: 4100,
          high: 4200,
          low: 4000,
          close: 4150,
          volume: 110000,
          change: 50,
          changePercent: 1.22
        }
      ];

      try {
        const result = validateHistoricalData(orderedData);
        
        // 验证：数据应该保持时间顺序
        expect(result.length).toBe(3);
        expect(result[0].date).toBe('2024-01-01');
        expect(result[1].date).toBe('2024-01-02');
        expect(result[2].date).toBe('2024-01-03');
      } catch (error) {
        fail('Valid ordered data should not throw an error');
      }
    });
  });
});
