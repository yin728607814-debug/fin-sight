/**
 * 响应式布局属性测试
 * **Feature: real-gold-price-data, Property 4: 响应式布局适应**
 * **Validates: Requirements 2.2, 4.2**
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { GoldAnalysisPage } from '../../pages/GoldAnalysisPage';
import * as fc from 'fast-check';

// Mock所有依赖的hooks和组件
jest.mock('../../utils/context', () => ({
  useCurrentAsset: () => ({ setCurrentAsset: jest.fn() }),
  useNews: () => ({ news: [], loading: false, error: null }),
  useAnalysis: () => ({ analysis: [], loading: false, error: null }),
  useOverallAnalysis: () => ({ overallAnalysis: null, setOverallAnalysis: jest.fn() }),
  usePriceData: () => ({ priceData: [], loading: false, error: null }),
  useLoading: () => ({ loading: { news: false, analysis: false, prices: false } }),
  useErrors: () => ({ errors: { news: null, analysis: null, prices: null } })
}));

jest.mock('../../components/NewsAnalyzer', () => ({
  NewsAnalyzer: ({ onAnalysisComplete }: any) => (
    <div data-testid="news-analyzer">
      <button onClick={() => onAnalysisComplete && onAnalysisComplete()}>
        Mock NewsAnalyzer
      </button>
    </div>
  )
}));

jest.mock('../../components/TrendChart', () => ({
  TrendChart: ({ data, assetType, timeRange }: any) => (
    <div data-testid="trend-chart">
      Mock TrendChart - {assetType} - {timeRange} days - {data.length} points
    </div>
  )
}));

jest.mock('../../components/NewsList', () => ({
  NewsList: ({ news, analysis, loading }: any) => (
    <div data-testid="news-list">
      Mock NewsList - {news.length} news - {analysis.length} analysis - loading: {loading.toString()}
    </div>
  )
}));

jest.mock('../../components/LoadingSpinner', () => ({
  LoadingSpinner: ({ size, text }: unknown) => (
    <div data-testid="loading-spinner">
      Loading {size} - {text}
    </div>
  )
}));

jest.mock('../../components/ErrorMessage', () => ({
  ErrorMessage: ({ title, message, onRetry, onClose }: unknown) => (
    <div data-testid="error-message">
      <h3>{title}</h3>
      <p>{message}</p>
      <button onClick={onRetry}>重试</button>
      <button onClick={onClose}>关闭</button>
    </div>
  )
}));

// 创建测试包装器
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
);

describe('响应式布局属性测试', () => {
  describe('Property 4: 响应式布局适应', () => {
    test('页面布局应该使用响应式网格系统', () => {
      const { container } = render(
        <TestWrapper>
          <GoldAnalysisPage />
        </TestWrapper>
      );

      // 验证主要网格布局使用了响应式类
      const mainGrid = container.querySelector('.grid');
      expect(mainGrid).toHaveClass('grid-cols-1'); // 小屏幕：单列
      expect(mainGrid).toHaveClass('lg:grid-cols-3'); // 大屏幕：3列
      expect(mainGrid).toHaveClass('xl:grid-cols-5'); // 超大屏幕：5列

      // 验证左侧内容区域的响应式列跨度
      const leftSection = container.querySelector('.xl\\:col-span-3');
      expect(leftSection).toHaveClass('lg:col-span-2'); // 大屏幕跨2列
      expect(leftSection).toHaveClass('xl:col-span-3'); // 超大屏幕跨3列

      // 验证右侧价格区域的响应式列跨度
      const rightSection = container.querySelector('.xl\\:col-span-2');
      expect(rightSection).toHaveClass('lg:col-span-1'); // 大屏幕跨1列
      expect(rightSection).toHaveClass('xl:col-span-2'); // 超大屏幕跨2列
    });

    test('价格显示区域不应该使用截断样式', () => {
      const { container } = render(
        <TestWrapper>
          <GoldAnalysisPage />
        </TestWrapper>
      );

      // 验证市场概览区域没有使用截断样式
      const marketOverview = container.querySelector('[class*="市场概览"]')?.parentElement;
      if (marketOverview) {
        const priceElements = marketOverview.querySelectorAll('span');
        priceElements.forEach(element => {
          expect(element).not.toHaveClass('truncate');
          expect(element).not.toHaveClass('whitespace-nowrap');
          expect(element).not.toHaveClass('overflow-hidden');
        });
      }

      // 验证没有全局截断类
      const truncateElements = container.querySelectorAll('.truncate');
      expect(truncateElements).toHaveLength(0);

      // 验证没有使用限制宽度的类
      const minWidthElements = container.querySelectorAll('.min-w-0');
      expect(minWidthElements).toHaveLength(0);
    });

    test('页面应该在不同屏幕尺寸下保持良好的布局', () => {
      fc.assert(fc.property(
        // 生成不同的视口尺寸模拟
        fc.record({
          screenSize: fc.constantFrom('mobile', 'tablet', 'desktop', 'large'),
          hasData: fc.boolean(),
          hasErrors: fc.boolean()
        }),
        ({ screenSize, hasData, hasErrors }) => {
          // 根据屏幕尺寸设置不同的测试条件
          const mockContextData = {
            useNews: () => ({ 
              news: hasData ? [{ id: '1', title: 'Test News' }] : [], 
              loading: false, 
              error: hasErrors ? 'Error' : null 
            }),
            useAnalysis: () => ({ 
              analysis: hasData ? [{ id: '1', summary: 'Test Analysis' }] : [], 
              loading: false, 
              error: hasErrors ? 'Error' : null 
            }),
            usePriceData: () => ({ 
              priceData: hasData ? [{ 
                date: new Date(), 
                close: 2000, 
                changePercent: 1.5,
                open: 1990,
                high: 2010,
                low: 1980,
                volume: 100000,
                change: 10
              }] : [], 
              loading: false, 
              error: hasErrors ? 'Error' : null 
            }),
            useOverallAnalysis: () => ({ overallAnalysis: null, setOverallAnalysis: jest.fn() }),
            useLoading: () => ({ loading: { news: false, analysis: false, prices: false } }),
            useErrors: () => ({ errors: { news: null, analysis: null, prices: null } }),
            useCurrentAsset: () => ({ setCurrentAsset: jest.fn() })
          };

          // 重新mock context
          jest.doMock('../../utils/context', () => mockContextData);

          const { container } = render(
            <TestWrapper>
              <GoldAnalysisPage />
            </TestWrapper>
          );

          // 验证响应式网格类存在
          const gridElement = container.querySelector('.grid');
          expect(gridElement).toHaveClass('grid-cols-1');
          
          // 根据屏幕尺寸验证不同的布局
          switch (screenSize) {
            case 'mobile':
              // 移动端应该是单列布局
              expect(gridElement).toHaveClass('grid-cols-1');
              break;
            case 'tablet':
            case 'desktop':
              // 平板和桌面应该有多列布局
              expect(gridElement).toHaveClass('lg:grid-cols-3');
              break;
            case 'large':
              // 大屏幕应该有5列布局
              expect(gridElement).toHaveClass('xl:grid-cols-5');
              break;
          }

          // 验证内容区域的响应式类
          const leftSection = container.querySelector('.space-y-6');
          expect(leftSection).toBeTruthy();

          // 验证没有使用截断样式
          const truncateElements = container.querySelectorAll('.truncate');
          expect(truncateElements).toHaveLength(0);
        }
      ), { numRuns: 10 });
    });

    test('头部导航应该在不同屏幕尺寸下保持响应式', () => {
      const { container } = render(
        <TestWrapper>
          <GoldAnalysisPage />
        </TestWrapper>
      );

      // 验证头部使用了响应式容器
      const header = container.querySelector('header');
      expect(header).toBeTruthy();

      const headerContainer = header?.querySelector('.max-w-7xl');
      expect(headerContainer).toHaveClass('mx-auto');
      expect(headerContainer).toHaveClass('px-4');
      expect(headerContainer).toHaveClass('sm:px-6');
      expect(headerContainer).toHaveClass('lg:px-8');

      // 验证头部内容使用了flex布局
      const headerContent = headerContainer?.querySelector('.flex');
      expect(headerContent).toHaveClass('flex-col');
      expect(headerContent).toHaveClass('sm:flex-row');
      expect(headerContent).toHaveClass('sm:items-center');
      expect(headerContent).toHaveClass('sm:justify-between');
    });

    test('主要内容区域应该使用响应式容器', () => {
      const { container } = render(
        <TestWrapper>
          <GoldAnalysisPage />
        </TestWrapper>
      );

      // 验证主要内容区域使用了响应式容器
      const main = container.querySelector('main');
      expect(main).toBeTruthy();
      expect(main).toHaveClass('max-w-7xl');
      expect(main).toHaveClass('mx-auto');
      expect(main).toHaveClass('px-4');
      expect(main).toHaveClass('sm:px-6');
      expect(main).toHaveClass('lg:px-8');

      // 验证内容区域有适当的间距
      expect(main).toHaveClass('py-8');
    });
  });

  describe('数字显示完整性测试', () => {
    test('价格显示区域应该没有截断样式', () => {
      const { container } = render(
        <TestWrapper>
          <GoldAnalysisPage />
        </TestWrapper>
      );

      // 验证价格显示区域没有使用截断样式
      const priceSpans = container.querySelectorAll('span[class*="font-semibold"]');
      priceSpans.forEach(span => {
        expect(span).not.toHaveClass('truncate');
        expect(span).not.toHaveClass('whitespace-nowrap');
        expect(span).not.toHaveClass('overflow-hidden');
      });

      // 验证没有全局截断类
      const truncateElements = container.querySelectorAll('.truncate');
      expect(truncateElements).toHaveLength(0);
    });

    test('布局应该在任何状态下保持响应式', () => {
      const { container } = render(
        <TestWrapper>
          <GoldAnalysisPage />
        </TestWrapper>
      );

      // 验证响应式布局类存在
      const gridElement = container.querySelector('.grid');
      expect(gridElement).toHaveClass('grid-cols-1');
      expect(gridElement).toHaveClass('lg:grid-cols-3');
      expect(gridElement).toHaveClass('xl:grid-cols-5');

      // 验证内容区域使用响应式容器
      const main = container.querySelector('main');
      expect(main).toHaveClass('max-w-7xl');
      expect(main).toHaveClass('mx-auto');
    });
  });
});
