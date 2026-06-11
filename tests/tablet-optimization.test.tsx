/**
 * 平板设备优化测试
 * 测试平板设备上的布局和横竖屏切换效果
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
  Line: ({ data, options }: any) => (
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

describe('平板设备优化测试', () => {
  beforeEach(() => {
    // 重置视口到默认桌面尺寸
    mockViewport(1024, 768);
  });

  describe('TrendChart 平板适配', () => {
    it('应该在平板竖屏使用2x2网格布局', () => {
      mockViewport(768, 1024); // iPad竖屏
      
      render(
        <TrendChart 
          data={mockPriceData} 
          assetType="gold" 
          timeRange={5} 
        />
      );

      // 检查统计卡片容器使用平板网格布局
      const statsContainer = screen.getByText('当前价格').closest('.grid');
      expect(statsContainer).toHaveClass('grid-cols-2');
      expect(statsContainer).toHaveClass('lg:grid-cols-4');
    });

    it('应该在平板横屏使用1x4网格布局', () => {
      mockViewport(1024, 768); // iPad横屏
      
      render(
        <TrendChart 
          data={mockPriceData} 
          assetType="gold" 
          timeRange={5} 
        />
      );

      const statsContainer = screen.getByText('当前价格').closest('.grid');
      expect(statsContainer).toHaveClass('lg:grid-cols-4');
    });

    it('应该在平板设备调整图表高度', () => {
      mockViewport(768, 1024);
      
      render(
        <TrendChart 
          data={mockPriceData} 
          assetType="gold" 
          timeRange={5} 
        />
      );

      const chartContainer = screen.getByTestId('chart').parentElement;
      expect(chartContainer).toHaveClass('md:h-72');
      expect(chartContainer).toHaveClass('lg:h-80');
    });

    it('应该在平板设备优化字体大小', () => {
      mockViewport(768, 1024);
      
      render(
        <TrendChart 
          data={mockPriceData} 
          assetType="gold" 
          timeRange={5} 
        />
      );

      // 检查图表配置中的字体大小设置
      const chart = screen.getByTestId('chart');
      const chartOptions = JSON.parse(chart.getAttribute('data-chart-options') || '{}');
      
      // 验证图表配置针对平板设备进行了优化
      expect(chartOptions.plugins.legend.labels.font.size).toBeGreaterThan(10);
      expect(chartOptions.plugins.title.font.size).toBeGreaterThan(14);
    });

    it('应该在平板设备优化区间显示', () => {
      mockViewport(768, 1024);
      
      render(
        <TrendChart 
          data={mockPriceData} 
          assetType="gold" 
          timeRange={5} 
        />
      );

      // 在平板尺寸下，区间应该显示为垂直布局
      const rangeContainer = screen.getByText('1,995.25').closest('.flex');
      expect(rangeContainer).toHaveClass('flex-col');
      expect(rangeContainer).toHaveClass('lg:flex-row');
    });
  });

  describe('GoldAnalysisPage 平板适配', () => {
    const renderWithRouter = (component: React.ReactElement) => {
      return render(
        <BrowserRouter>
          {component}
        </BrowserRouter>
      );
    };

    it('应该在平板竖屏使用单列布局', () => {
      mockViewport(768, 1024); // iPad竖屏
      
      renderWithRouter(<GoldAnalysisPage />);

      const mainGrid = screen.getByText('新闻影响分析').closest('.grid');
      expect(mainGrid).toHaveClass('grid-cols-1');
      expect(mainGrid).toHaveClass('md:grid-cols-2');
    });

    it('应该在平板横屏使用双列布局', () => {
      mockViewport(1024, 768); // iPad横屏
      
      renderWithRouter(<GoldAnalysisPage />);

      const mainGrid = screen.getByText('新闻影响分析').closest('.grid');
      expect(mainGrid).toHaveClass('lg:grid-cols-3');
    });

    it('应该在平板设备优化市场概览布局', () => {
      mockViewport(768, 1024);
      
      renderWithRouter(<GoldAnalysisPage />);

      // 检查市场概览在平板上的布局
      const marketOverviewElements = screen.getAllByText('当前价格');
      const marketOverviewElement = marketOverviewElements[1]; // 第二个是市场概览中的
      const marketOverview = marketOverviewElement.closest('.grid');
      
      expect(marketOverview).toHaveClass('md:grid-cols-1');
      expect(marketOverview).toHaveClass('lg:grid-cols-2');
    });

    it('应该在平板设备优化头部布局', () => {
      mockViewport(768, 1024);
      
      renderWithRouter(<GoldAnalysisPage />);

      const header = screen.getByText('现货黄金分析').closest('header');
      const headerContent = header?.querySelector('.flex');
      expect(headerContent).toHaveClass('sm:flex-row');
    });

    it('应该在平板设备优化按钮文本对齐', () => {
      mockViewport(768, 1024);
      
      renderWithRouter(<GoldAnalysisPage />);

      const navButton = screen.getByText('切换到纳斯达克100分析');
      expect(navButton).toHaveClass('md:text-left');
    });
  });

  describe('横竖屏切换测试', () => {
    const renderWithRouter = (component: React.ReactElement) => {
      return render(
        <BrowserRouter>
          {component}
        </BrowserRouter>
      );
    };

    it('应该正确处理从竖屏到横屏的切换', () => {
      // 开始时是竖屏
      mockViewport(768, 1024);
      
      const { rerender } = renderWithRouter(<GoldAnalysisPage />);
      
      // 验证竖屏布局
      let mainGrid = screen.getByText('新闻影响分析').closest('.grid');
      expect(mainGrid).toHaveClass('md:grid-cols-2');
      
      // 切换到横屏
      mockViewport(1024, 768);
      rerender(
        <BrowserRouter>
          <GoldAnalysisPage />
        </BrowserRouter>
      );
      
      // 验证横屏布局
      mainGrid = screen.getByText('新闻影响分析').closest('.grid');
      expect(mainGrid).toHaveClass('lg:grid-cols-3');
    });

    it('应该在横竖屏切换时保持TrendChart的响应性', () => {
      // 竖屏
      mockViewport(768, 1024);
      
      const { rerender } = render(
        <TrendChart 
          data={mockPriceData} 
          assetType="gold" 
          timeRange={5} 
        />
      );
      
      let statsContainer = screen.getByText('当前价格').closest('.grid');
      expect(statsContainer).toHaveClass('grid-cols-2');
      
      // 横屏
      mockViewport(1024, 768);
      rerender(
        <TrendChart 
          data={mockPriceData} 
          assetType="gold" 
          timeRange={5} 
        />
      );
      
      statsContainer = screen.getByText('当前价格').closest('.grid');
      expect(statsContainer).toHaveClass('lg:grid-cols-4');
    });
  });

  describe('平板特定尺寸测试', () => {
    const tabletSizes = [
      { name: 'iPad Mini', width: 768, height: 1024 },
      { name: 'iPad', width: 820, height: 1180 },
      { name: 'iPad Air', width: 834, height: 1194 },
      { name: 'iPad Pro 11"', width: 834, height: 1194 },
      { name: 'iPad Pro 12.9"', width: 1024, height: 1366 },
      // 横屏模式
      { name: 'iPad Mini 横屏', width: 1024, height: 768 },
      { name: 'iPad 横屏', width: 1180, height: 820 },
      { name: 'iPad Air 横屏', width: 1194, height: 834 },
    ];

    tabletSizes.forEach(({ name, width, height }) => {
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
        
        // 验证统计卡片布局适应屏幕尺寸
        const statsContainer = screen.getByText('当前价格').closest('.grid');
        expect(statsContainer).toHaveClass('grid-cols-2');
      });
    });
  });

  describe('平板触摸优化', () => {
    it('应该为平板设备提供适当的触摸目标', () => {
      mockViewport(768, 1024);
      
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

    it('应该在平板设备上提供合适的内边距', () => {
      mockViewport(768, 1024);
      
      render(
        <TrendChart 
          data={mockPriceData} 
          assetType="gold" 
          timeRange={5} 
        />
      );

      // 检查卡片在平板上有适当的内边距
      const statCard = screen.getByText('当前价格').closest('.p-3');
      expect(statCard).toHaveClass('md:p-4');
    });
  });

  describe('平板性能优化', () => {
    it('应该在平板设备上优化图表渲染性能', () => {
      mockViewport(768, 1024);
      
      render(
        <TrendChart 
          data={mockPriceData} 
          assetType="gold" 
          timeRange={5} 
        />
      );

      const chart = screen.getByTestId('chart');
      const chartOptions = JSON.parse(chart.getAttribute('data-chart-options') || '{}');
      
      // 验证图表配置针对平板进行了优化
      expect(chartOptions.scales.x.ticks.maxTicksLimit).toBeGreaterThan(5);
      expect(chartOptions.scales.y.ticks.maxTicksLimit).toBeGreaterThan(6);
    });

    it('应该在平板设备上使用合适的点大小', () => {
      mockViewport(768, 1024);
      
      render(
        <TrendChart 
          data={mockPriceData} 
          assetType="gold" 
          timeRange={5} 
        />
      );

      const chart = screen.getByTestId('chart');
      const chartOptions = JSON.parse(chart.getAttribute('data-chart-options') || '{}');
      
      // 验证点的大小适合平板触摸
      expect(chartOptions.elements.point.radius).toBeGreaterThanOrEqual(3);
      expect(chartOptions.elements.point.hoverRadius).toBeGreaterThanOrEqual(5);
    });
  });
});
