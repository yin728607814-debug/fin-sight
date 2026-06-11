/**
 * 移动端显示单元测试
 * 测试不同视口尺寸下的布局和数字显示完整性
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import { TrendChart } from '../components/TrendChart';
import GoldAnalysisPage from '../pages/GoldAnalysisPage';
import { HistoricalPriceData } from '../types';

// Mock Chart.js
jest.mock('react-chartjs-2', () => ({
  Line: ({ data, options }: unknown) => (
    <div data-testid="chart" data-chart-data={JSON.stringify(data)} data-chart-options={JSON.stringify(options)}>
      Mock Chart
    </div>
  )
}));

// Mock context hooks
jest.mock('../utils/context', () => ({
  useCurrentAsset: () => ({ setCurrentAsset: jest.fn() }),
  useNews: () => ({ news: [], loading: false, error: null }),
  useAnalysis: () => ({ analysis: [], loading: false, error: null }),
  useOverallAnalysis: () => ({ overallAnalysis: null, setOverallAnalysis: jest.fn() }),
  usePriceData: () => ({ priceData: mockPriceData, loading: false, error: null }),
  useLoading: () => ({ loading: { news: false, analysis: false, prices: false } }),
  useErrors: () => ({ errors: { news: null, analysis: null, prices: null } })
}));

// Mock helpers
jest.mock('../utils/helpers', () => ({
  formatUpdateTime: () => '刚刚更新',
  formatExpirationWarning: () => '',
  isDataExpired: () => false
}));

// Mock components
jest.mock('../components/NewsAnalyzer', () => ({
  NewsAnalyzer: () => <div data-testid="news-analyzer">News Analyzer</div>
}));

jest.mock('../components/NewsList', () => ({
  NewsList: () => <div data-testid="news-list">News List</div>
}));

jest.mock('../components/LoadingSpinner', () => ({
  LoadingSpinner: () => <div data-testid="loading-spinner">Loading...</div>
}));

jest.mock('../components/ErrorMessage', () => ({
  ErrorMessage: () => <div data-testid="error-message">Error</div>
}));

// Mock price data
const mockPriceData: HistoricalPriceData[] = [
  {
    date: '2024-01-01',
    open: 2000.50,
    high: 2050.75,
    low: 1995.25,
    close: 2025.30,
    volume: 1000000,
    change: 24.80,
    changePercent: 1.24,
    source: 'Alpha Vantage',
    isReal: true,
    lastUpdated: '2024-01-01T12:00:00Z'
  },
  {
    date: '2024-01-02',
    open: 2025.30,
    high: 2075.90,
    low: 2010.15,
    close: 2055.60,
    volume: 1200000,
    change: 30.30,
    changePercent: 1.50,
    source: 'Alpha Vantage',
    isReal: true,
    lastUpdated: '2024-01-02T12:00:00Z'
  }
];

// 模拟不同的视口尺寸
const mockViewport = (width: number, height: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });
  
  // 触发resize事件
  fireEvent(window, new Event('resize'));
};

describe('移动端显示测试', () => {
  beforeEach(() => {
    // 重置视口到默认桌面尺寸
    mockViewport(1024, 768);
  });

  describe('TrendChart 移动端适配', () => {
    it('应该在移动端使用2x2网格布局显示统计信息', () => {
      mockViewport(375, 667); // iPhone SE尺寸
      
      render(
        <TrendChart 
          data={mockPriceData} 
          assetType="gold" 
          timeRange={5} 
        />
      );

      // 检查统计卡片容器使用移动端网格布局
      const statsContainer = screen.getByText('当前价格').closest('.grid');
      expect(statsContainer).toHaveClass('grid-cols-2');
      expect(statsContainer).toHaveClass('lg:grid-cols-4');
    });

    it('应该在移动端正确显示完整的价格数字', () => {
      mockViewport(375, 667);
      
      render(
        <TrendChart 
          data={mockPriceData} 
          assetType="gold" 
          timeRange={5} 
        />
      );

      // 检查价格数字完整显示，没有被截断
      const currentPrice = screen.getByText('2,055.6');
      expect(currentPrice).toBeInTheDocument();
      expect(currentPrice.closest('span')).toHaveClass('break-all');
      
      // 检查变化数字
      const change = screen.getByText('+30.3');
      expect(change).toBeInTheDocument();
      expect(change.closest('span')).toHaveClass('break-all');
      
      // 检查百分比
      const changePercent = screen.getByText('+1.50%');
      expect(changePercent).toBeInTheDocument();
      expect(changePercent.closest('span')).toHaveClass('break-all');
    });

    it('应该在移动端调整图表高度', () => {
      mockViewport(375, 667);
      
      render(
        <TrendChart 
          data={mockPriceData} 
          assetType="gold" 
          timeRange={5} 
        />
      );

      const chartContainer = screen.getByTestId('chart').parentElement;
      expect(chartContainer).toHaveClass('h-64');
      expect(chartContainer).toHaveClass('md:h-72');
      expect(chartContainer).toHaveClass('lg:h-80');
    });

    it('应该在移动端优化数据来源信息布局', () => {
      mockViewport(375, 667);
      
      render(
        <TrendChart 
          data={mockPriceData} 
          assetType="gold" 
          timeRange={5} 
        />
      );

      // 检查数据来源信息的主容器使用垂直布局
      const dataSourceMainContainer = screen.getByText(/数据来源:/).closest('.flex.flex-col');
      expect(dataSourceMainContainer).toBeInTheDocument();
      expect(dataSourceMainContainer).toHaveClass('md:flex-row');
    });

    it('应该在平板尺寸使用中等间距', () => {
      mockViewport(768, 1024); // iPad尺寸
      
      render(
        <TrendChart 
          data={mockPriceData} 
          assetType="gold" 
          timeRange={5} 
        />
      );

      const statsContainer = screen.getByText('当前价格').closest('.grid');
      expect(statsContainer).toHaveClass('md:gap-4');
    });

    it('应该在移动端显示区间信息为垂直布局', () => {
      mockViewport(375, 667);
      
      render(
        <TrendChart 
          data={mockPriceData} 
          assetType="gold" 
          timeRange={5} 
        />
      );

      // 检查区间显示容器
      const rangeContainer = screen.getByText('1,995.25').closest('.flex');
      expect(rangeContainer).toHaveClass('flex-col');
      expect(rangeContainer).toHaveClass('lg:flex-row');
      
      // 检查分隔符在移动端显示为"至"
      expect(screen.getByText('至')).toBeInTheDocument();
    });
  });

  describe('GoldAnalysisPage 移动端适配', () => {
    const renderWithRouter = (component: React.ReactElement) => {
      return render(
        <BrowserRouter>
          {component}
        </BrowserRouter>
      );
    };

    it('应该在移动端使用垂直布局的头部', () => {
      mockViewport(375, 667);
      
      renderWithRouter(<GoldAnalysisPage />);

      const header = screen.getByText('现货黄金分析').closest('header');
      const headerContent = header?.querySelector('.flex');
      expect(headerContent).toHaveClass('flex-col');
      expect(headerContent).toHaveClass('sm:flex-row');
    });

    it('应该在移动端优化刷新按钮布局', () => {
      mockViewport(375, 667);
      
      renderWithRouter(<GoldAnalysisPage />);

      const refreshButton = screen.getByText('刷新价格').closest('button');
      expect(refreshButton).toHaveClass('justify-center');
      expect(refreshButton).toHaveClass('touch-manipulation');
    });

    it('应该在移动端使用单列网格布局', () => {
      mockViewport(375, 667);
      
      renderWithRouter(<GoldAnalysisPage />);

      // 检查主要内容区域使用单列布局
      const mainGrid = screen.getByText('新闻影响分析').closest('.grid');
      expect(mainGrid).toHaveClass('grid-cols-1');
      expect(mainGrid).toHaveClass('lg:grid-cols-3');
    });

    it('应该在移动端优化市场概览布局', () => {
      mockViewport(375, 667);
      
      renderWithRouter(<GoldAnalysisPage />);

      // 检查市场概览使用2列网格在移动端 - 使用getAllByText获取所有匹配的元素
      const currentPriceElements = screen.getAllByText('当前价格');
      // 找到在市场概览部分的那个（第二个）
      const marketOverviewElement = currentPriceElements[1];
      const marketOverview = marketOverviewElement.closest('.grid');
      expect(marketOverview).toHaveClass('grid-cols-2');
      expect(marketOverview).toHaveClass('md:grid-cols-1');
    });

    it('应该在移动端居中显示快速导航按钮', () => {
      mockViewport(375, 667);
      
      renderWithRouter(<GoldAnalysisPage />);

      const navButton = screen.getByText('切换到纳斯达克100分析');
      expect(navButton).toHaveClass('text-center');
      expect(navButton).toHaveClass('md:text-left');
      expect(navButton).toHaveClass('touch-manipulation');
    });

    it('应该在不同屏幕尺寸下正确调整内边距', () => {
      mockViewport(375, 667);
      
      renderWithRouter(<GoldAnalysisPage />);

      // 检查卡片内边距
      const cardContent = screen.getByText('新闻影响分析').closest('.px-4');
      expect(cardContent).toHaveClass('px-4');
      expect(cardContent).toHaveClass('sm:px-6');
    });
  });

  describe('响应式断点测试', () => {
    const testBreakpoints = [
      { name: '小手机', width: 320, height: 568 },
      { name: 'iPhone SE', width: 375, height: 667 },
      { name: 'iPhone 12', width: 390, height: 844 },
      { name: '小平板', width: 768, height: 1024 },
      { name: '大平板', width: 1024, height: 1366 },
      { name: '桌面', width: 1280, height: 720 }
    ];

    testBreakpoints.forEach(({ name, width, height }) => {
      it(`应该在${name}(${width}x${height})上正确显示`, () => {
        mockViewport(width, height);
        
        render(
          <TrendChart 
            data={mockPriceData} 
            assetType="gold" 
            timeRange={5} 
          />
        );

        // 验证组件能够正常渲染
        expect(screen.getByText('当前价格')).toBeInTheDocument();
        expect(screen.getByTestId('chart')).toBeInTheDocument();
        
        // 验证数字完整显示
        expect(screen.getByText('2,055.6')).toBeInTheDocument();
        expect(screen.getByText('+1.50%')).toBeInTheDocument();
      });
    });
  });

  describe('触摸交互优化', () => {
    it('应该为交互元素添加touch-manipulation类', () => {
      mockViewport(375, 667);
      
      render(
        <TrendChart 
          data={mockPriceData} 
          assetType="gold" 
          timeRange={5} 
        />
      );

      // 检查统计卡片有触摸优化
      const statCards = screen.getAllByText(/当前价格|总变化|涨跌幅|区间/);
      statCards.forEach(card => {
        const cardElement = card.closest('.touch-manipulation');
        expect(cardElement).toBeInTheDocument();
      });
    });

    it('应该为按钮添加适当的触摸目标尺寸', () => {
      mockViewport(375, 667);
      
      const { container } = render(
        <BrowserRouter>
          <GoldAnalysisPage />
        </BrowserRouter>
      );

      const buttons = container.querySelectorAll('button, a');
      let buttonsWithPadding = 0;
      let totalButtons = 0;
      
      buttons.forEach(button => {
        totalButtons++;
        // 检查按钮有足够的内边距用于触摸
        const hasAdequatePadding = 
          button.classList.contains('px-4') || 
          button.classList.contains('p-3') ||
          button.classList.contains('p-4') ||
          button.classList.contains('py-2') ||
          button.classList.contains('py-3') ||
          button.classList.contains('py-4') ||
          button.classList.contains('px-2') ||
          button.classList.contains('px-3');
        
        if (hasAdequatePadding) {
          buttonsWithPadding++;
        }
      });
      
      // 至少70%的按钮应该有适当的触摸目标尺寸
      expect(buttonsWithPadding / totalButtons).toBeGreaterThan(0.7);
    });
  });

  describe('数字显示完整性验证', () => {
    it('应该确保长数字在移动端不被截断', () => {
      const longNumberData: HistoricalPriceData[] = [{
        date: '2024-01-01',
        open: 123456.789,
        high: 123999.999,
        low: 123000.001,
        close: 123456.789,
        volume: 9999999,
        change: 1234.567,
        changePercent: 12.3456,
        source: 'Test',
        isReal: true,
        lastUpdated: '2024-01-01T12:00:00Z'
      }];

      mockViewport(320, 568); // 最小手机尺寸
      
      render(
        <TrendChart 
          data={longNumberData} 
          assetType="gold" 
          timeRange={5} 
        />
      );

      // 验证长数字能够完整显示
      expect(screen.getByText('123,456.79')).toBeInTheDocument();
      // 注意：由于只有一个数据点，总变化和百分比会是0
      expect(screen.getByText(/^\+0$/)).toBeInTheDocument();
      expect(screen.getByText(/^\+0\.00%$/)).toBeInTheDocument();
      
      // 验证区间数字
      expect(screen.getByText('123,000')).toBeInTheDocument();
      expect(screen.getByText('124,000')).toBeInTheDocument();
    });

    it('应该在极小屏幕上保持数字可读性', () => {
      mockViewport(280, 480); // 极小屏幕
      
      render(
        <TrendChart 
          data={mockPriceData} 
          assetType="gold" 
          timeRange={5} 
        />
      );

      // 验证所有数字元素的父容器都有break-all类来处理长数字
      const priceContainers = screen.getAllByText(/[\d,]+\.?\d*/)[0].closest('.break-all');
      expect(priceContainers).toBeInTheDocument();
    });
  });
});
