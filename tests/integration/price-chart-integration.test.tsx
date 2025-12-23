/**
 * 价格数据和图表集成测试
 * 测试价格数据获取和图表渲染的完整流程
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from '../../utils/context';
import { TrendChart } from '../../components/TrendChart';
import { GoldAnalysisPage } from '../../pages/GoldAnalysisPage';
import { NasdaqAnalysisPage } from '../../pages/NasdaqAnalysisPage';
import { PriceData } from '../../types';

// 模拟Chart.js
jest.mock('react-chartjs-2', () => ({
  Line: ({ data, options }: any) => (
    <div data-testid="chart-component">
      <div data-testid="chart-data">{JSON.stringify(data)}</div>
      <div data-testid="chart-options">{JSON.stringify(options)}</div>
    </div>
  )
}));

// 模拟价格服务
jest.mock('../../services/priceService', () => ({
  priceService: {
    fetchPriceHistory: jest.fn(),
    fetchFiveDayPriceHistory: jest.fn(),
    getCurrentPrice: jest.fn()
  }
}));

// 测试数据
const mockPriceData: PriceData[] = [
  {
    date: new Date('2024-01-11'),
    open: 2020.50,
    high: 2035.75,
    low: 2018.25,
    close: 2032.80,
    volume: 125000,
    change: 12.30,
    changePercent: 0.61
  },
  {
    date: new Date('2024-01-12'),
    open: 2032.80,
    high: 2045.60,
    low: 2028.90,
    close: 2041.25,
    volume: 132000,
    change: 8.45,
    changePercent: 0.42
  },
  {
    date: new Date('2024-01-13'),
    open: 2041.25,
    high: 2055.30,
    low: 2038.75,
    close: 2048.90,
    volume: 118000,
    change: 7.65,
    changePercent: 0.37
  },
  {
    date: new Date('2024-01-14'),
    open: 2048.90,
    high: 2062.15,
    low: 2045.20,
    close: 2058.75,
    volume: 145000,
    change: 9.85,
    changePercent: 0.48
  },
  {
    date: new Date('2024-01-15'),
    open: 2058.75,
    high: 2075.40,
    low: 2055.60,
    close: 2071.20,
    volume: 156000,
    change: 12.45,
    changePercent: 0.60
  }
];

const mockNasdaqPriceData: PriceData[] = [
  {
    date: new Date('2024-01-11'),
    open: 16850.25,
    high: 16920.75,
    low: 16830.50,
    close: 16895.30,
    volume: 2500000,
    change: 45.05,
    changePercent: 0.27
  },
  {
    date: new Date('2024-01-12'),
    open: 16895.30,
    high: 16950.80,
    low: 16875.20,
    close: 16925.60,
    volume: 2650000,
    change: 30.30,
    changePercent: 0.18
  },
  {
    date: new Date('2024-01-13'),
    open: 16925.60,
    high: 16980.45,
    low: 16910.75,
    close: 16965.85,
    volume: 2400000,
    change: 40.25,
    changePercent: 0.24
  },
  {
    date: new Date('2024-01-14'),
    open: 16965.85,
    high: 17020.30,
    low: 16945.60,
    close: 17005.20,
    volume: 2750000,
    change: 39.35,
    changePercent: 0.23
  },
  {
    date: new Date('2024-01-15'),
    open: 17005.20,
    high: 17065.90,
    low: 16995.40,
    close: 17045.75,
    volume: 2850000,
    change: 40.55,
    changePercent: 0.24
  }
];

// 测试包装器
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <AppProvider enablePersistence={false}>
      {children}
    </AppProvider>
  </BrowserRouter>
);

describe('价格数据和图表集成测试', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    const { priceService } = require('../../services/priceService');
    priceService.fetchPriceHistory.mockResolvedValue(mockPriceData);
    priceService.fetchFiveDayPriceHistory.mockResolvedValue(mockPriceData);
    priceService.getCurrentPrice.mockResolvedValue({
      symbol: 'XAUUSD',
      name: '现货黄金',
      currentPrice: 2071.20,
      currency: 'USD',
      lastUpdated: new Date()
    });
  });

  describe('TrendChart组件集成测试', () => {
    
    test('应该正确渲染价格数据到图表', () => {
      render(
        <TrendChart 
          data={mockPriceData} 
          assetType="gold" 
          timeRange={5} 
        />, 
        { wrapper: TestWrapper }
      );

      // 验证图表组件存在
      expect(screen.getByTestId('chart-component')).toBeInTheDocument();
      
      // 验证图表数据
      const chartData = screen.getByTestId('chart-data');
      const parsedData = JSON.parse(chartData.textContent || '{}');
      
      expect(parsedData.labels).toHaveLength(5);
      expect(parsedData.datasets).toHaveLength(1);
      expect(parsedData.datasets[0].data).toHaveLength(5);
    });

    test('应该正确计算和显示统计信息', () => {
      render(
        <TrendChart 
          data={mockPriceData} 
          assetType="gold" 
          timeRange={5} 
        />, 
        { wrapper: TestWrapper }
      );

      // 验证统计信息
      expect(screen.getByText(/当前价格/)).toBeInTheDocument();
      expect(screen.getByText(/总变化/)).toBeInTheDocument();
      expect(screen.getByText(/涨跌幅/)).toBeInTheDocument();
      expect(screen.getByText(/区间/)).toBeInTheDocument();

      // 验证具体数值 - 使用逗号分隔的格式
      expect(screen.getByText('2,071.2')).toBeInTheDocument(); // 当前价格
      expect(screen.getByText('+38.4')).toBeInTheDocument(); // 总变化
      expect(screen.getByText('+1.89%')).toBeInTheDocument(); // 涨跌幅
    });

    test('应该正确处理空数据情况', () => {
      render(
        <TrendChart 
          data={[]} 
          assetType="gold" 
          timeRange={5} 
        />, 
        { wrapper: TestWrapper }
      );

      // 验证空数据提示
      expect(screen.getByText(/暂无价格数据/)).toBeInTheDocument();
    });

    test('应该根据资产类型显示正确的标题', () => {
      const { rerender } = render(
        <TrendChart 
          data={mockPriceData} 
          assetType="gold" 
          timeRange={5} 
        />, 
        { wrapper: TestWrapper }
      );

      // 验证黄金标题
      const chartOptions = screen.getByTestId('chart-options');
      let parsedOptions = JSON.parse(chartOptions.textContent || '{}');
      expect(parsedOptions.plugins.title.text).toContain('现货黄金');

      // 重新渲染为纳斯达克
      rerender(
        <TrendChart 
          data={mockNasdaqPriceData} 
          assetType="nasdaq" 
          timeRange={5} 
        />
      );

      const updatedOptions = screen.getByTestId('chart-options');
      parsedOptions = JSON.parse(updatedOptions.textContent || '{}');
      expect(parsedOptions.plugins.title.text).toContain('纳斯达克100');
    });

    test('应该正确设置图表颜色基于趋势', () => {
      // 测试上涨趋势（绿色）
      render(
        <TrendChart 
          data={mockPriceData} 
          assetType="gold" 
          timeRange={5} 
        />, 
        { wrapper: TestWrapper }
      );

      const chartData = screen.getByTestId('chart-data');
      const parsedData = JSON.parse(chartData.textContent || '{}');
      
      // 验证上涨趋势使用绿色
      expect(parsedData.datasets[0].borderColor).toBe('#10b981');
      expect(parsedData.datasets[0].backgroundColor).toBe('rgba(16, 185, 129, 0.1)');
    });
  });

  describe('页面级别的价格数据集成', () => {
    
    test('黄金分析页面应该正确集成价格数据和图表', async () => {
      render(<GoldAnalysisPage />, { wrapper: TestWrapper });

      // 等待数据加载
      await waitFor(() => {
        expect(screen.getByText(/价格趋势/)).toBeInTheDocument();
      });

      // 验证价格服务被正确调用
      const { priceService } = require('../../services/priceService');
      expect(priceService.fetchPriceHistory).toHaveBeenCalledWith('gold', 10);

      // 验证价格趋势图表存在
      expect(screen.getByText(/价格趋势/)).toBeInTheDocument();
    });

    test('纳斯达克分析页面应该正确集成价格数据和图表', async () => {
      const { priceService } = require('../../services/priceService');
      priceService.fetchPriceHistory.mockResolvedValue(mockNasdaqPriceData);
      priceService.getCurrentPrice.mockResolvedValue({
        symbol: 'NDX',
        name: '纳斯达克100指数',
        currentPrice: 17045.75,
        currency: 'USD',
        lastUpdated: new Date()
      });

      render(<NasdaqAnalysisPage />, { wrapper: TestWrapper });

      // 等待数据加载
      await waitFor(() => {
        expect(screen.getByText(/价格趋势/)).toBeInTheDocument();
      });

      // 验证纳斯达克特有的技术指标
      expect(screen.getByText(/技术指标/)).toBeInTheDocument();
      expect(screen.getByText(/5日最高/)).toBeInTheDocument();
      expect(screen.getByText(/5日最低/)).toBeInTheDocument();
    });
  });

  describe('价格数据处理和验证', () => {
    
    test('应该正确处理价格数据的时间排序', () => {
      // 创建乱序的价格数据
      const unorderedData = [...mockPriceData].reverse();
      
      render(
        <TrendChart 
          data={unorderedData} 
          assetType="gold" 
          timeRange={5} 
        />, 
        { wrapper: TestWrapper }
      );

      const chartData = screen.getByTestId('chart-data');
      const parsedData = JSON.parse(chartData.textContent || '{}');
      
      // 验证标签按时间正序排列
      const labels = parsedData.labels;
      expect(labels[0]).toContain('1月11日');
      expect(labels[4]).toContain('1月15日');
    });

    test('应该正确计算价格变化统计', () => {
      render(
        <TrendChart 
          data={mockPriceData} 
          assetType="gold" 
          timeRange={5} 
        />, 
        { wrapper: TestWrapper }
      );

      // 验证统计计算
      const expectedChange = mockPriceData[4].close - mockPriceData[0].close; // 2071.20 - 2032.80
      const expectedChangePercent = (expectedChange / mockPriceData[0].close) * 100;

      expect(screen.getByText(`+${expectedChange.toFixed(1)}`)).toBeInTheDocument();
      expect(screen.getByText(`+${expectedChangePercent.toFixed(2)}%`)).toBeInTheDocument();
    });

    test('应该正确处理价格数据中的异常值', () => {
      // 创建包含异常值的数据
      const dataWithOutliers = [
        ...mockPriceData,
        {
          date: new Date('2024-01-16'),
          open: 2071.20,
          high: 9999.99, // 异常高值
          low: 0.01, // 异常低值
          close: 2075.50,
          volume: 160000,
          change: 4.30,
          changePercent: 0.21
        }
      ];

      render(
        <TrendChart 
          data={dataWithOutliers} 
          assetType="gold" 
          timeRange={6} 
        />, 
        { wrapper: TestWrapper }
      );

      // 验证图表仍然能正常渲染
      expect(screen.getByTestId('chart-component')).toBeInTheDocument();
      
      // 验证统计信息包含异常值
      expect(screen.getByText(/区间/)).toBeInTheDocument();
    });
  });

  describe('图表交互和工具提示', () => {
    
    test('应该配置正确的工具提示回调', () => {
      render(
        <TrendChart 
          data={mockPriceData} 
          assetType="gold" 
          timeRange={5} 
        />, 
        { wrapper: TestWrapper }
      );

      const chartOptions = screen.getByTestId('chart-options');
      const parsedOptions = JSON.parse(chartOptions.textContent || '{}');
      
      // 验证工具提示配置
      expect(parsedOptions.plugins.tooltip).toBeDefined();
      expect(parsedOptions.plugins.tooltip.backgroundColor).toBe('rgba(0, 0, 0, 0.8)');
      expect(parsedOptions.plugins.tooltip.displayColors).toBe(false);
    });

    test('应该配置正确的图表交互模式', () => {
      render(
        <TrendChart 
          data={mockPriceData} 
          assetType="gold" 
          timeRange={5} 
        />, 
        { wrapper: TestWrapper }
      );

      const chartOptions = screen.getByTestId('chart-options');
      const parsedOptions = JSON.parse(chartOptions.textContent || '{}');
      
      // 验证交互配置
      expect(parsedOptions.interaction.intersect).toBe(false);
      expect(parsedOptions.interaction.mode).toBe('index');
    });
  });

  describe('响应式和性能', () => {
    
    test('应该配置图表为响应式', () => {
      render(
        <TrendChart 
          data={mockPriceData} 
          assetType="gold" 
          timeRange={5} 
        />, 
        { wrapper: TestWrapper }
      );

      const chartOptions = screen.getByTestId('chart-options');
      const parsedOptions = JSON.parse(chartOptions.textContent || '{}');
      
      // 验证响应式配置
      expect(parsedOptions.responsive).toBe(true);
      expect(parsedOptions.maintainAspectRatio).toBe(false);
    });

    test('应该在数据变化时正确更新图表', () => {
      const { rerender } = render(
        <TrendChart 
          data={mockPriceData.slice(0, 3)} 
          assetType="gold" 
          timeRange={3} 
        />, 
        { wrapper: TestWrapper }
      );

      // 验证初始数据
      let chartData = screen.getByTestId('chart-data');
      let parsedData = JSON.parse(chartData.textContent || '{}');
      expect(parsedData.datasets[0].data).toHaveLength(3);

      // 更新数据
      rerender(
        <TrendChart 
          data={mockPriceData} 
          assetType="gold" 
          timeRange={5} 
        />
      );

      // 验证更新后的数据
      chartData = screen.getByTestId('chart-data');
      parsedData = JSON.parse(chartData.textContent || '{}');
      expect(parsedData.datasets[0].data).toHaveLength(5);
    });
  });
});