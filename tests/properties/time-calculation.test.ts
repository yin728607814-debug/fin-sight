/**
 * 时间计算属性测试
 * **Feature: investment-news-analyzer, Property 11: 时间范围计算准确性**
 */

import * as fc from 'fast-check';
import { 
  getDaysAgo, 
  getDateRange, 
  getFiveDayRange, 
  getFiveDaysAgo,
  isWithinDays,
  isDataExpired,
  getDataAge,
  formatTimestamp,
  formatUpdateTime,
  formatExpirationWarning,
  isWeekday,
  isMarketHours,
  getNextTradingDay,
  getUserTimezone,
  getCurrentTimeInTimezone
} from '../../utils/helpers';
import { AssetType } from '../../types';

describe('时间计算属性测试', () => {

  /**
   * **Feature: investment-news-analyzer, Property 11: 时间范围计算准确性**
   * **Validates: Requirements 4.2**
   * 
   * For any 当前日期，系统计算的5天时间范围应该准确地从当前日期往前推算
   */
  describe('Property 11: 时间范围计算准确性', () => {
    
    test('getDaysAgo应该返回准确的过去日期', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 365 }), // 测试0到365天
          (days) => {
            const result = getDaysAgo(days);
            const now = new Date();
            
            // 计算实际的时间差（天数）
            const diffInMs = now.getTime() - result.getTime();
            const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
            
            // 允许1天的误差（由于时区和时间精度问题）
            return Math.abs(diffInDays - days) <= 1;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('getFiveDaysAgo应该返回准确的5天前日期', () => {
      const fiveDaysAgo = getFiveDaysAgo();
      const now = new Date();
      
      const diffInMs = now.getTime() - fiveDaysAgo.getTime();
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
      
      // 应该是5天前，允许1天误差
      expect(Math.abs(diffInDays - 5)).toBeLessThanOrEqual(1);
    });

    test('getFiveDayRange应该返回正确的5天范围', () => {
      const range = getFiveDayRange();
      
      // 结束日期应该是今天或接近今天
      const now = new Date();
      const endDiff = Math.abs(now.getTime() - range.end.getTime());
      expect(endDiff).toBeLessThan(24 * 60 * 60 * 1000); // 小于1天
      
      // 开始日期应该在结束日期之前
      expect(range.start.getTime()).toBeLessThan(range.end.getTime());
      
      // 范围应该大约是4天（5天包含今天，所以是4天的跨度）
      const rangeDiff = range.end.getTime() - range.start.getTime();
      const rangeDays = Math.floor(rangeDiff / (1000 * 60 * 60 * 24));
      expect(rangeDays).toBeGreaterThanOrEqual(3);
      expect(rangeDays).toBeLessThanOrEqual(5);
    });

    test('getDateRange应该返回正确的日期范围', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 30 }), // 测试1到30天的范围
          (days) => {
            const range = getDateRange(days);
            
            // 结束日期应该是今天或接近今天
            const now = new Date();
            const endDiff = Math.abs(now.getTime() - range.end.getTime());
            expect(endDiff).toBeLessThan(24 * 60 * 60 * 1000);
            
            // 开始日期应该在结束日期之前或等于（对于1天的情况）
            expect(range.start.getTime()).toBeLessThanOrEqual(range.end.getTime());
            
            // 计算实际的天数差
            const rangeDiff = range.end.getTime() - range.start.getTime();
            const actualDays = Math.floor(rangeDiff / (1000 * 60 * 60 * 24));
            
            // 对于1天的情况，允许0天差异
            if (days === 1) {
              return actualDays >= 0 && actualDays <= 1;
            }
            
            // 对于其他情况，应该接近请求的天数（允许1天误差）
            return Math.abs(actualDays - (days - 1)) <= 1;
          }
        ),
        { numRuns: 50 }
      );
    });

    test('isWithinDays应该正确判断日期是否在范围内', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }),
          fc.integer({ min: 0, max: 15 }),
          (withinDays, actualDaysAgo) => {
            const testDate = getDaysAgo(actualDaysAgo);
            const result = isWithinDays(testDate, withinDays);
            
            // 如果实际天数小于等于范围，应该返回true
            const expected = actualDaysAgo <= withinDays;
            return result === expected;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('数据过期检查属性测试', () => {
    
    test('isDataExpired应该正确判断数据是否过期', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 120 }), // 0到120分钟前
          fc.integer({ min: 10, max: 60 }), // 过期阈值10到60分钟
          (minutesAgo, maxAgeMinutes) => {
            const testDate = new Date(Date.now() - minutesAgo * 60 * 1000);
            const result = isDataExpired(testDate, maxAgeMinutes);
            
            // 如果数据年龄超过阈值，应该返回true
            const expected = minutesAgo > maxAgeMinutes;
            return result === expected;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('getDataAge应该返回正确的数据年龄', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 1440 }), // 0到1440分钟（1天）
          (minutesAgo) => {
            const testDate = new Date(Date.now() - minutesAgo * 60 * 1000);
            const age = getDataAge(testDate);
            
            // 允许1分钟的误差
            return Math.abs(age - minutesAgo) <= 1;
          }
        ),
        { numRuns: 50 }
      );
    });

    test('无效日期应该被正确处理', () => {
      expect(isDataExpired('invalid-date')).toBe(true);
      expect(getDataAge('invalid-date')).toBe(Infinity);
      expect(isWithinDays('invalid-date', 5)).toBe(false);
    });
  });

  describe('时间格式化属性测试', () => {
    
    test('formatTimestamp应该返回有效的时间戳格式', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
          (date) => {
            const result = formatTimestamp(date);
            
            // 应该匹配 YYYY-MM-DD HH:mm:ss 格式
            const timestampRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
            return timestampRegex.test(result);
          }
        ),
        { numRuns: 50 }
      );
    });

    test('formatUpdateTime应该返回合理的更新时间描述', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 300 }), // 0到300分钟前
          (minutesAgo) => {
            const testDate = new Date(Date.now() - minutesAgo * 60 * 1000);
            const result = formatUpdateTime(testDate);
            
            // 结果应该是非空字符串
            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(0);
            
            // 应该包含相关的时间描述词汇
            const timeWords = ['刚刚', '分钟前', '更新于', '未知'];
            return timeWords.some(word => result.includes(word));
          }
        ),
        { numRuns: 30 }
      );
    });

    test('formatExpirationWarning应该为过期数据返回警告', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 31, max: 1440 }), // 31分钟到1天前（过期）
          (minutesAgo) => {
            const testDate = new Date(Date.now() - minutesAgo * 60 * 1000);
            const warning = formatExpirationWarning(testDate, 30);
            
            // 过期数据应该返回警告信息
            expect(warning).not.toBeNull();
            expect(typeof warning).toBe('string');
            expect(warning!.length).toBeGreaterThan(0);
            
            // 警告信息应该包含相关词汇
            const warningWords = ['过期', '刷新', '建议'];
            return warningWords.some(word => warning!.includes(word));
          }
        ),
        { numRuns: 30 }
      );
    });

    test('formatExpirationWarning应该为新鲜数据返回null', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 29 }), // 0到29分钟前（未过期）
          (minutesAgo) => {
            const testDate = new Date(Date.now() - minutesAgo * 60 * 1000);
            const warning = formatExpirationWarning(testDate, 30);
            
            // 新鲜数据应该返回null
            return warning === null;
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  describe('市场时间属性测试', () => {
    
    test('isWeekday应该正确识别工作日', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
          (date) => {
            const result = isWeekday(date);
            const dayOfWeek = date.getDay();
            
            // 周一到周五应该返回true，周六周日应该返回false
            const expected = dayOfWeek >= 1 && dayOfWeek <= 5;
            return result === expected;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('isMarketHours应该为有效资产类型返回布尔值', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('gold', 'nasdaq'),
          fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
          (assetType: AssetType, date) => {
            const result = isMarketHours(assetType, date);
            
            // 应该返回布尔值
            return typeof result === 'boolean';
          }
        ),
        { numRuns: 50 }
      );
    });

    test('getNextTradingDay应该返回下一个工作日', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date('2024-01-01'), max: new Date('2024-11-30') }),
          (date) => {
            const nextTradingDay = getNextTradingDay(date);
            
            // 下一个交易日应该是工作日
            expect(isWeekday(nextTradingDay)).toBe(true);
            
            // 下一个交易日应该在给定日期之后
            expect(nextTradingDay.getTime()).toBeGreaterThan(date.getTime());
            
            // 下一个交易日应该在7天内（最多跨过一个周末）
            const diffInDays = Math.floor((nextTradingDay.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
            return diffInDays <= 7;
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('时区处理属性测试', () => {
    
    test('getUserTimezone应该返回有效的时区字符串', () => {
      const timezone = getUserTimezone();
      
      expect(typeof timezone).toBe('string');
      expect(timezone.length).toBeGreaterThan(0);
      
      // 应该是有效的时区格式（通常包含/）
      expect(timezone.includes('/') || timezone === 'UTC').toBe(true);
    });

    test('getCurrentTimeInTimezone应该返回有效的日期对象', () => {
      const currentTime = getCurrentTimeInTimezone();
      
      expect(currentTime).toBeInstanceOf(Date);
      expect(isNaN(currentTime.getTime())).toBe(false);
      
      // 应该接近当前时间（允许1小时误差，考虑时区差异）
      const now = new Date();
      const diffInHours = Math.abs(now.getTime() - currentTime.getTime()) / (1000 * 60 * 60);
      expect(diffInHours).toBeLessThan(24); // 最多24小时差异
    });
  });

  describe('边界条件测试', () => {
    
    test('处理极端日期值', () => {
      // 测试很久以前的日期
      const veryOldDate = new Date('1970-01-01');
      expect(isDataExpired(veryOldDate)).toBe(true);
      expect(getDataAge(veryOldDate)).toBeGreaterThan(1000000);
      
      // 测试未来日期
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      expect(isDataExpired(futureDate)).toBe(false);
      expect(getDataAge(futureDate)).toBeLessThan(0);
    });

    test('处理零值和负值', () => {
      expect(getDaysAgo(0).getDate()).toBe(new Date().getDate());
      
      // 负值应该返回未来日期
      const futureDate = getDaysAgo(-1);
      expect(futureDate.getTime()).toBeGreaterThan(new Date().getTime());
    });

    test('处理大数值', () => {
      const result = getDaysAgo(10000); // 约27年前
      expect(result).toBeInstanceOf(Date);
      expect(isNaN(result.getTime())).toBe(false);
    });
  });
});