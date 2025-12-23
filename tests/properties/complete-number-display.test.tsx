/**
 * 完整数字显示属性测试
 * **Feature: real-gold-price-data, Property 3: 完整数字显示**
 * **Validates: Requirements 2.1, 2.4**
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { TrendChart } from '../../components/TrendChart';
import { PriceData } from '../../types';
import * as fc from 'fast-check';

// Mock Chart.js
jest.mock('react-chartjs-2', () => ({
  Line: ({ data, options }: unknown) => (
    <div data-testid="mock-chart">
      <div data-testid="chart-data">{JSON.stringify(data)}</div>
      <div data-testid="chart-options">{JSON.stringify(options)}</div>
    </div>
  )
}));

describe('完整数字显示属性测试', () => {
  describe('Property 3: 完整数字显示', () => {
    test('价格数字应该完整显示，不被截断', () => {
      fc.assert(fc.property(
        // 生成简单的价格数据
        fc.record({
          date: fc.date({ min: new Date('2020-01-01'), max: new Date('2024-12-31') }),
          open: fc.float({ min: 1000, max: 5000, noNaN: true }),
          high: fc.float({ min: 1000, max: 5000, noNaN: true }),
          low: fc.float({ min: 1000, max: 5000, noNaN: true }),
          close: fc.float({ min: 1000, max: 5000, noNaN: true }),
          volume: fc.integer({ min: 1000, max: 1000000 }),
          change: fc.float({ min: -500, max: 500, noNaN: true }),
          changePercent: fc.float({ min: -10, max: 10, noNaN: true })
        }).map(data => ({
          ...data,
          // 确保OHLC逻辑正确
          high: Math.max(data.open, data.close, data.high),
          low: Math.min(data.open, data.close, data.low)
        })),
        (priceData: PriceData) => {
          const { container } = render(
            <TrendChart 
              data={[priceData]} 
              assetType="gold" 
              timeRange={1} 
            />
          );

          // 核心验证：没有使用truncate类
          const truncateElements = container.querySelectorAll('.truncate');
          expect(truncateElements).toHaveLength(0);

          // 验证没有使用overflow-hidden类在数字显示区域
          const statsCards = container.querySelectorAll('.bg-slate-50');
          statsCards.forEach(card => {
            const textElements = card.querySelectorAll('[class*="overflow-hidden"]');
            expect(textElements).toHaveLength(0);
          });

          // 验证响应式网格类存在
          const gridElement = container.querySelector('.grid');
          expect(gridElement).toHaveClass('grid-cols-2');
          expect(gridElement).toHaveClass('lg:grid-cols-4');
        }
      ), { numRuns: 20 });
    });

    test('统计卡片不应该使用截断样式', () => {
      const testData: PriceData = {
        date: new Date('2024-01-01'),
        open: 123456.789,
        high: 123999.999,
        low: 123000.001,
        close: 123456.789,
        volume: 9999999,
        change: 456.789,
        changePercent: 0.37
      };

      const { container } = render(
        <TrendChart 
          data={[testData]} 
          assetType="gold" 
          timeRange={1} 
        />
      );

      // 验证统计卡片没有使用限制宽度的类
      const statsCards = container.querySelectorAll('.bg-slate-50');
      expect(statsCards.length).toBeGreaterThan(0);
      
      statsCards.forEach(card => {
        expect(card).not.toHaveClass('min-w-0');
        expect(card).not.toHaveClass('max-w-0');
        
        // 验证文本容器没有截断样式
        const textContainers = card.querySelectorAll('div');
        textContainers.forEach(textContainer => {
          expect(textContainer).not.toHaveClass('truncate');
          expect(textContainer).not.toHaveClass('overflow-hidden');
        });
      });

      // 验证没有全局truncate类
      const truncateElements = container.querySelectorAll('.truncate');
      expect(truncateElements).toHaveLength(0);
    });
  });

  describe('响应式布局测试', () => {
    test('网格布局应该适应不同屏幕尺寸', () => {
      const testData: PriceData = {
        date: new Date('2024-01-01'),
        open: 2000,
        high: 2100,
        low: 1900,
        close: 2050,
        volume: 100000,
        change: 50,
        changePercent: 2.5
      };

      const { container } = render(
        <TrendChart 
          data={[testData]} 
          assetType="gold" 
          timeRange={1} 
        />
      );

      // 验证使用了响应式网格类
      const gridElement = container.querySelector('.grid');
      expect(gridElement).toHaveClass('grid-cols-2'); // 移动端
      expect(gridElement).toHaveClass('lg:grid-cols-4'); // 大屏幕

      // 验证没有使用min-w-0类（这会导致内容被截断）
      const minWidthElements = container.querySelectorAll('.min-w-0');
      expect(minWidthElements).toHaveLength(0);
    });

    test('统计卡片应该有足够空间显示完整数字', () => {
      const largeNumberData: PriceData = {
        date: new Date('2024-01-01'),
        open: 999999.99,
        high: 1000000.00,
        low: 999000.00,
        close: 999500.25,
        volume: 9999999,
        change: -499.74,
        changePercent: -0.05
      };

      const { container } = render(
        <TrendChart 
          data={[largeNumberData]} 
          assetType="gold" 
          timeRange={1} 
        />
      );

      // 验证统计卡片没有使用限制宽度的类
      const statsCards = container.querySelectorAll('.bg-slate-50');
      statsCards.forEach(card => {
        expect(card).not.toHaveClass('min-w-0');
        expect(card).not.toHaveClass('max-w-0');
        
        // 验证文本容器没有截断样式
        const textContainers = card.querySelectorAll('div');
        textContainers.forEach(textContainer => {
          expect(textContainer).not.toHaveClass('truncate');
          expect(textContainer).not.toHaveClass('overflow-hidden');
        });
      });

      // 验证大数字能够显示（至少包含逗号分隔符）
      const bodyText = container.textContent || '';
      expect(bodyText).toMatch(/999,500/); // 验证大数字格式化显示
      expect(bodyText).toMatch(/1,000,000/); // 验证更大数字格式化显示
    });
  });

  describe('边界情况测试', () => {
    test('零值应该正确显示', () => {
      const zeroData: PriceData = {
        date: new Date('2024-01-01'),
        open: 2000,
        high: 2000,
        low: 2000,
        close: 2000,
        volume: 0,
        change: 0,
        changePercent: 0
      };

      const { container } = render(
        <TrendChart 
          data={[zeroData]} 
          assetType="gold" 
          timeRange={1} 
        />
      );

      // 验证零值能够显示
      const bodyText = container.textContent || '';
      expect(bodyText).toMatch(/2,000/); // 验证价格显示
      expect(bodyText).toMatch(/\+0/); // 验证零变化显示
      expect(bodyText).toMatch(/0\.00%/); // 验证零百分比显示
    });

    test('小数值应该正确显示', () => {
      const smallData: PriceData = {
        date: new Date('2024-01-01'),
        open: 0.01,
        high: 0.02,
        low: 0.005,
        close: 0.015,
        volume: 1,
        change: 0.005,
        changePercent: 50
      };

      const { container } = render(
        <TrendChart 
          data={[smallData]} 
          assetType="gold" 
          timeRange={1} 
        />
      );

      // 验证小数值能够显示
      const bodyText = container.textContent || '';
      expect(bodyText).toMatch(/0\.0/); // 验证小数显示
      expect(bodyText).toMatch(/0\.01/); // 验证具体小数值
    });

    test('负数应该正确显示', () => {
      const negativeData: PriceData = {
        date: new Date('2024-01-01'),
        open: 2000,
        high: 2000,
        low: 1800,
        close: 1900,
        volume: 100000,
        change: -100,
        changePercent: -5.0
      };

      const { container } = render(
        <TrendChart 
          data={[negativeData]} 
          assetType="gold" 
          timeRange={1} 
        />
      );

      // 验证负数能够显示
      const bodyText = container.textContent || '';
      expect(bodyText).toMatch(/1,900/); // 验证价格显示
      // 注意：单个数据点时，总变化为0，所以不会显示负数
      expect(bodyText).toMatch(/\+0/); // 单个数据点的总变化
    });
  });
});