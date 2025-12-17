/**
 * 图表组件属性测试（简化版）
 * **Feature: investment-news-analyzer, Property 10: 价格趋势图表显示**
 * **Feature: investment-news-analyzer, Property 12: 图表信息完整性**
 * **Feature: investment-news-analyzer, Property 13: 图表交互功能**
 */

import * as fc from 'fast-check';
import { render, screen } from '@testing-library/react';
import { TrendChart } from '../../components/TrendChart';
import { generators } from '../utils';
import { PriceData } from '../../types';

// Mock Chart.js components
jest.mock('react-chartjs-2', () => ({
  Line: jest.fn(({ data, options }) => (
    <div data-testid="mock-chart">
      <div data-testid="chart-data">{JSON.stringify(data)}</div>
      <div data-testid="chart-options">{JSON.stringify(options)}</div>
    </div>
  ))
}));

describe('图表组件属性测试', () => {

  /**
   * **Feature: investment-news-analyzer, Property 10: 价格趋势图表显示**
   * **Validates: Requirements 4.1**
   * 
   * For any 投资产品页面，应该显示该产品过去5天的价格趋势图表
   */
  describe('Property 10: 价格趋势图表显示', () => {
    test('任何资产类型都应该显示价格趋势图表', () => {
      fc.assert(
        fc.property(
          generators.assetType(),
          fc.array(generators.priceData(), { minLength: 1, maxLength: 5 }),
          fc.integer({ min: 1, max: 10 }),
          (assetType, priceData, timeRange) => {
            const { unmount } = render(
              <TrendChart 
                data={priceData} 
                assetType={assetType} 
                timeRange={timeRange} 
              />
            );
            
            try {
              // 验证图表容器存在
              const chartContainer = screen.getByTestId('mock-chart');
              expect(chartContainer).toBeInTheDocument();
              
              // 验证图表数据被传递
              const chartDataElement = screen.getByTestId('chart-data');
              expect(chartDataElement).toBeInTheDocument();
              
              const chartData = JSON.parse(chartDataElement.textContent || '{}');
              
              // 验证数据集存在
              expect(chartData.datasets).toBeDefined();
              expect(Array.isArray(chartData.datasets)).toBe(true);
              
              if (priceData.length > 0) {
                expect(chartData.datasets.length).toBeGreaterThan(0);
                
                // 验证标签存在
                expect(chartData.labels).toBeDefined();
                expect(Array.isArray(chartData.labels)).toBe(true);
              }
              
              return true;
            } finally {
              unmount();
            }
          }
        ),
        { numRuns: 20 }
      );
    });

    test('空数据应该显示适当的空状态', () => {
      fc.assert(
        fc.property(
          generators.assetType(),
          fc.integer({ min: 1, max: 10 }),
          (assetType, timeRange) => {
            const { unmount } = render(
              <TrendChart 
                data={[]} 
                assetType={assetType} 
                timeRange={timeRange} 
              />
            );
            
            try {
              // 验证空状态消息
              expect(screen.getByText('暂无价格数据')).toBeInTheDocument();
              
              return true;
            } finally {
              unmount();
            }
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  /**
   * **Feature: investment-news-analyzer, Property 12: 图表信息完整性**
   * **Validates: Requirements 4.3**
   * 
   * For any 显示的价格趋势图表，应该清晰标注日期、价格和涨跌幅度信息
   */
  describe('Property 12: 图表信息完整性', () => {
    test('图表应该包含完整的价格信息', () => {
      fc.assert(
        fc.property(
          generators.assetType(),
          fc.array(generators.priceData(), { minLength: 2, maxLength: 5 }),
          fc.integer({ min: 1, max: 10 }),
          (assetType, priceData, timeRange) => {
            const { unmount } = render(
              <TrendChart 
                data={priceData} 
                assetType={assetType} 
                timeRange={timeRange} 
              />
            );
            
            try {
              // 验证统计信息显示
              expect(screen.getByText('当前价格')).toBeInTheDocument();
              expect(screen.getByText('总变化')).toBeInTheDocument();
              expect(screen.getByText('涨跌幅')).toBeInTheDocument();
              expect(screen.getByText('区间')).toBeInTheDocument();
              
              return true;
            } finally {
              unmount();
            }
          }
        ),
        { numRuns: 15 }
      );
    });

    test('图表数据应该包含日期标签', () => {
      fc.assert(
        fc.property(
          generators.assetType(),
          fc.array(generators.priceData(), { minLength: 1, maxLength: 5 }),
          fc.integer({ min: 1, max: 10 }),
          (assetType, priceData, timeRange) => {
            const { unmount } = render(
              <TrendChart 
                data={priceData} 
                assetType={assetType} 
                timeRange={timeRange} 
              />
            );
            
            try {
              if (priceData.length > 0) {
                const chartDataElement = screen.getByTestId('chart-data');
                const chartData = JSON.parse(chartDataElement.textContent || '{}');
                
                // 验证标签数量与数据点数量匹配
                expect(chartData.labels).toBeDefined();
                expect(chartData.labels.length).toBe(priceData.length);
                
                // 验证每个标签都是字符串（日期格式）
                chartData.labels.forEach((label: any) => {
                  expect(typeof label).toBe('string');
                  expect(label.length).toBeGreaterThan(0);
                });
              }
              
              return true;
            } finally {
              unmount();
            }
          }
        ),
        { numRuns: 15 }
      );
    });
  });

  /**
   * **Feature: investment-news-analyzer, Property 13: 图表交互功能**
   * **Validates: Requirements 4.5**
   * 
   * For any 加载完成的价格图表，应该提供交互功能以查看具体数据点详情
   */
  describe('Property 13: 图表交互功能', () => {
    test('图表应该配置交互选项', () => {
      fc.assert(
        fc.property(
          generators.assetType(),
          fc.array(generators.priceData(), { minLength: 1, maxLength: 5 }),
          fc.integer({ min: 1, max: 10 }),
          (assetType, priceData, timeRange) => {
            const { unmount } = render(
              <TrendChart 
                data={priceData} 
                assetType={assetType} 
                timeRange={timeRange} 
              />
            );
            
            try {
              if (priceData.length > 0) {
                const chartOptionsElement = screen.getByTestId('chart-options');
                const options = JSON.parse(chartOptionsElement.textContent || '{}');
                
                // 验证交互配置存在
                expect(options.interaction).toBeDefined();
                expect(options.interaction.intersect).toBe(false);
                expect(options.interaction.mode).toBe('index');
              }
              
              return true;
            } finally {
              unmount();
            }
          }
        ),
        { numRuns: 15 }
      );
    });

    test('图表应该是响应式的', () => {
      fc.assert(
        fc.property(
          generators.assetType(),
          fc.array(generators.priceData(), { minLength: 1, maxLength: 5 }),
          fc.integer({ min: 1, max: 10 }),
          (assetType, priceData, timeRange) => {
            const { unmount } = render(
              <TrendChart 
                data={priceData} 
                assetType={assetType} 
                timeRange={timeRange} 
              />
            );
            
            try {
              if (priceData.length > 0) {
                const chartOptionsElement = screen.getByTestId('chart-options');
                const options = JSON.parse(chartOptionsElement.textContent || '{}');
                
                // 验证响应式配置
                expect(options.responsive).toBe(true);
                expect(options.maintainAspectRatio).toBe(false);
              }
              
              return true;
            } finally {
              unmount();
            }
          }
        ),
        { numRuns: 15 }
      );
    });
  });

  // 边界情况测试
  describe('图表组件边界情况测试', () => {
    test('单个数据点应该正确处理', () => {
      const singleDataPoint: PriceData = {
        date: new Date('2024-01-01'),
        open: 100,
        high: 105,
        low: 95,
        close: 102,
        volume: 1000,
        change: 2,
        changePercent: 2.0
      };

      const { unmount } = render(
        <TrendChart 
          data={[singleDataPoint]} 
          assetType="gold" 
          timeRange={1} 
        />
      );

      try {
        // 验证单点数据正确显示
        expect(screen.getByText('102.00')).toBeInTheDocument();
        // 对于单个数据点，总变化应该是0（因为没有前一个点进行比较）
        expect(screen.getByText('+0.00')).toBeInTheDocument();
      } finally {
        unmount();
      }
    });

    test('负变化应该正确显示', () => {
      const negativeChangeData: PriceData[] = [
        {
          date: new Date('2024-01-01'),
          open: 100,
          high: 105,
          low: 95,
          close: 100,
          volume: 1000,
          change: 0,
          changePercent: 0
        },
        {
          date: new Date('2024-01-02'),
          open: 100,
          high: 100,
          low: 90,
          close: 95,
          volume: 1200,
          change: -5,
          changePercent: -5.0
        }
      ];

      const { unmount } = render(
        <TrendChart 
          data={negativeChangeData} 
          assetType="nasdaq" 
          timeRange={2} 
        />
      );

      try {
        // 验证负变化正确显示
        expect(screen.getByText('-5.00')).toBeInTheDocument();
        expect(screen.getByText('-5.00%')).toBeInTheDocument();
      } finally {
        unmount();
      }
    });
  });
});