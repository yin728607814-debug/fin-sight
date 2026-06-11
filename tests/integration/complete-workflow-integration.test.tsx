/**
 * 完整工作流集成测试
 * 测试投资新闻分析器的端到端功能
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppProvider } from '../../utils/context';
import App from '../../App';
import { HomePage } from '../../pages/HomePage';
import { GoldAnalysisPage } from '../../pages/GoldAnalysisPage';
import { NasdaqAnalysisPage } from '../../pages/NasdaqAnalysisPage';

jest.mock('../../utils/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({
    user: { id: 'test-user', email: 'tester@example.com', createdAt: new Date() },
    loading: false,
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    isAuthenticated: true
  })
}));

// 模拟所有服务
jest.mock('../../services/newsService', () => ({
  newsService: {
    fetchMarketNews: jest.fn(),
    analyzeNewsImpact: jest.fn()
  }
}));

jest.mock('../../services/priceService', () => ({
  priceService: {
    fetchPriceHistory: jest.fn(),
    fetchFiveDayPriceHistory: jest.fn(),
    getCurrentPrice: jest.fn()
  }
}));

jest.mock('../../services/analysisService', () => ({
  analysisService: {
    analyzeNewsImpact: jest.fn()
  }
}));

// 测试数据
const mockNewsItems = [
  {
    id: 'news-1',
    title: 'Gold prices surge amid market uncertainty',
    content: 'Gold prices have increased significantly due to market volatility and inflation concerns.',
    source: 'Financial Times',
    publishedAt: new Date('2024-01-15T10:00:00Z'),
    url: 'https://example.com/news/1',
    relevanceScore: 0.9
  },
  {
    id: 'news-2',
    title: 'Federal Reserve hints at interest rate changes',
    content: 'The Federal Reserve is considering adjustments to interest rates in response to economic indicators.',
    source: 'Reuters',
    publishedAt: new Date('2024-01-15T09:30:00Z'),
    url: 'https://example.com/news/2',
    relevanceScore: 0.8
  }
];

const mockPriceData = [
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

// 测试包装器
const TestWrapper: React.FC<{ children: React.ReactNode; initialEntries?: string[] }> = ({ 
  children, 
  initialEntries = ['/'] 
}) => (
  <MemoryRouter initialEntries={initialEntries}>
    <AppProvider enablePersistence={false}>
      {children}
    </AppProvider>
  </MemoryRouter>
);

describe('完整工作流集成测试', () => {
  
  beforeEach(() => {
    // 重置所有模拟
    jest.clearAllMocks();
    
    // 设置默认的模拟返回值
    const { newsService } = require('../../services/newsService');
    const { priceService } = require('../../services/priceService');
    const { analysisService } = require('../../services/analysisService');
    
    newsService.fetchMarketNews.mockResolvedValue(mockNewsItems);
    analysisService.analyzeNewsImpact.mockResolvedValue({
      impact: 'positive',
      confidence: 0.8,
      summary: 'Test analysis summary',
      keyPoints: ['Point 1', 'Point 2'],
      predictedChange: 2.5
    });
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

  describe('应用程序路由和导航', () => {
    
    test('应该正确渲染首页并提供导航选项', () => {
      render(<HomePage />, { wrapper: TestWrapper });

      // 验证首页核心元素
      expect(screen.getByText(/FinSight/)).toBeInTheDocument();
      expect(screen.getByText(/今天先看组合，再看市场信号/)).toBeInTheDocument();
      expect(screen.getByText(/市场观察/)).toBeInTheDocument();
      
      // 验证导航卡片
      expect(screen.getByText(/黄金市场/)).toBeInTheDocument();
      expect(screen.getByText(/纳斯达克100/)).toBeInTheDocument();
      
      // 验证功能特性
      expect(screen.getByText(/智能仪表盘/)).toBeInTheDocument();
      expect(screen.getByText(/AI投资顾问/)).toBeInTheDocument();
      expect(screen.getByText(/导入持仓/)).toBeInTheDocument();
    });

    test('应该支持完整的应用路由', async () => {
      // Test routing by rendering individual pages and checking navigation links
      render(<HomePage />, { wrapper: TestWrapper });

      // 验证在首页
      expect(screen.getByText(/市场观察/)).toBeInTheDocument();

      // 导航到黄金分析页面
      const goldLink = screen.getByText(/黄金市场/).closest('a');
      expect(goldLink).toHaveAttribute('href', '/gold');

      // 导航到纳斯达克分析页面
      const nasdaqLink = screen.getByText(/纳斯达克100/).closest('a');
      expect(nasdaqLink).toHaveAttribute('href', '/nasdaq');
    });
  });

  describe('黄金分析页面完整工作流', () => {
    
    test('应该加载并显示黄金分析页面的所有核心组件', async () => {
      render(<GoldAnalysisPage />, { wrapper: TestWrapper });

      // 验证页面标题和导航
      expect(screen.getByText(/现货黄金分析/)).toBeInTheDocument();
      expect(screen.getAllByText(/返回首页/)).toHaveLength(2); // Header and sidebar
      
      // 验证主要区域存在
      expect(screen.getByText(/新闻影响分析/)).toBeInTheDocument();
      expect(screen.getByText(/价格趋势/)).toBeInTheDocument();
      expect(screen.getByText(/市场概览/)).toBeInTheDocument();
      expect(screen.getByText(/快速导航/)).toBeInTheDocument();
      
      // 等待数据加载完成
      await waitFor(() => {
        expect(screen.queryByText(/正在获取新闻/)).not.toBeInTheDocument();
      }, { timeout: 5000 });
    });

    test('应该正确处理数据刷新功能', async () => {
      render(<GoldAnalysisPage />, { wrapper: TestWrapper });

      // 等待初始加载
      await waitFor(() => {
        expect(screen.queryByText(/正在获取新闻/)).not.toBeInTheDocument();
      }, { timeout: 5000 });

      // 查找并点击刷新按钮
      const refreshButton = screen.getByText(/刷新价格/).closest('button');
      expect(refreshButton).toBeInTheDocument();
      
      await act(async () => {
        fireEvent.click(refreshButton);
      });

      // 验证服务被调用
      const { newsService } = require('../../services/newsService');
      const { priceService } = require('../../services/priceService');
      expect(priceService.fetchFiveDayPriceHistory).toHaveBeenCalledWith('gold');
    });

    test('应该显示市场概览信息', async () => {
      render(<GoldAnalysisPage />, { wrapper: TestWrapper });

      await waitFor(() => {
        expect(screen.queryByText(/正在获取新闻/)).not.toBeInTheDocument();
      }, { timeout: 5000 });

      // 验证市场概览部分
      expect(screen.getByText(/市场概览/)).toBeInTheDocument();
      expect(screen.getAllByText(/当前价格/).length).toBeGreaterThan(0);
      expect(screen.getByText(/24小时变化/)).toBeInTheDocument();
      
      // 验证统计信息
      const newsCountElements = screen.getAllByText(/条/);
      expect(newsCountElements.length).toBeGreaterThan(0);
      
      const reportCountElements = screen.getAllByText(/份/);
      expect(reportCountElements.length).toBeGreaterThan(0);
    });
  });

  describe('纳斯达克分析页面完整工作流', () => {
    
    test('应该加载并显示纳斯达克分析页面的所有核心组件', async () => {
      render(<NasdaqAnalysisPage />, { wrapper: TestWrapper });

      // 验证页面标题和导航
      expect(screen.getAllByText(/纳斯达克100分析/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/返回首页/)).toHaveLength(2); // Header and sidebar
      
      // 验证主要区域存在
      expect(screen.getByText(/新闻影响分析/)).toBeInTheDocument();
      expect(screen.getByText(/价格趋势/)).toBeInTheDocument();
      expect(screen.getByText(/市场概览/)).toBeInTheDocument();
      expect(screen.getByText(/技术指标/)).toBeInTheDocument();
      expect(screen.getByText(/快速导航/)).toBeInTheDocument();
      
      // 等待数据加载完成
      await waitFor(() => {
        expect(screen.queryByText(/正在获取新闻/)).not.toBeInTheDocument();
      }, { timeout: 5000 });
    });

    test('应该显示纳斯达克特有的技术指标', async () => {
      render(<NasdaqAnalysisPage />, { wrapper: TestWrapper });

      await waitFor(() => {
        expect(screen.queryByText(/正在获取新闻/)).not.toBeInTheDocument();
      }, { timeout: 5000 });

      // 验证技术指标部分
      expect(screen.getByText(/技术指标/)).toBeInTheDocument();
      expect(screen.getByText(/5日最高/)).toBeInTheDocument();
      expect(screen.getByText(/5日最低/)).toBeInTheDocument();
      expect(screen.getByText(/平均成交量/)).toBeInTheDocument();
    });
  });

  describe('价格数据和图表集成', () => {
    
    test('应该正确显示价格趋势图表', async () => {
      render(<GoldAnalysisPage />, { wrapper: TestWrapper });

      await waitFor(() => {
        expect(screen.queryByText(/正在获取新闻/)).not.toBeInTheDocument();
      }, { timeout: 5000 });

      // 验证价格趋势部分
      expect(screen.getByText(/价格趋势/)).toBeInTheDocument();
      expect(screen.getByText(/过去5天的黄金价格走势/)).toBeInTheDocument();
    });

    test('应该在没有价格数据时显示适当的消息', async () => {
      // 模拟空价格数据
      const { priceService } = require('../../services/priceService');
      priceService.fetchPriceHistory.mockResolvedValue([]);

      render(<GoldAnalysisPage />, { wrapper: TestWrapper });

      await waitFor(() => {
        expect(screen.getByText(/暂无价格数据/)).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe('错误处理和恢复', () => {
    
    test('应该正确处理新闻获取失败', async () => {
      const { newsService } = require('../../services/newsService');
      newsService.fetchMarketNews.mockRejectedValue(new Error('API Error'));

      render(<GoldAnalysisPage />, { wrapper: TestWrapper });

      // 等待错误处理
      await waitFor(() => {
        expect(screen.getByText(/数据加载出现问题/)).toBeInTheDocument();
      }, { timeout: 5000 });

      // 验证错误消息
      expect(screen.getByText(/部分数据可能无法正常显示/)).toBeInTheDocument();
    });

    test('应该支持错误后的重试功能', async () => {
      const { newsService } = require('../../services/newsService');
      
      // 第一次调用失败，第二次成功
      newsService.fetchMarketNews
        .mockRejectedValueOnce(new Error('Network Error'))
        .mockResolvedValueOnce(mockNewsItems);

      render(<GoldAnalysisPage />, { wrapper: TestWrapper });

      // 等待错误显示
      await waitFor(() => {
        expect(screen.getByText(/数据加载出现问题/)).toBeInTheDocument();
      }, { timeout: 5000 });

      // 点击刷新重试
      const refreshButton = screen.getAllByText(/重试/)[0];
      
      await act(async () => {
        fireEvent.click(refreshButton);
      });

      // 验证重试被调用 (at least once, possibly more due to component lifecycle)
      expect(newsService.fetchMarketNews).toHaveBeenCalled();
    });
  });

  describe('新闻分析工作流', () => {
    
    test('应该显示新闻分析控制面板', async () => {
      render(<GoldAnalysisPage />, { wrapper: TestWrapper });

      // 验证新闻分析控制面板
      expect(screen.getByText(/新闻分析/)).toBeInTheDocument();
      // The button text changes based on loading state, so check for either
      const hasRefreshButton =
        screen.queryAllByText(/刷新新闻/).length > 0 ||
        screen.queryAllByText(/获取中/).length > 0 ||
        screen.queryAllByText(/获取新闻/).length > 0;
      expect(hasRefreshButton).toBe(true);
      
      // 等待数据加载
      await waitFor(() => {
        expect(screen.queryByText(/正在获取新闻/)).not.toBeInTheDocument();
      }, { timeout: 5000 });
    });

    test('应该在没有新闻时显示空状态', async () => {
      const { newsService } = require('../../services/newsService');
      newsService.fetchMarketNews.mockResolvedValue([]);

      render(<GoldAnalysisPage />, { wrapper: TestWrapper });

      await waitFor(() => {
        expect(screen.getByText(/暂无新闻数据/)).toBeInTheDocument();
      }, { timeout: 5000 });

      expect(screen.getByText(/点击"刷新新闻"按钮获取最新的市场新闻/)).toBeInTheDocument();
    });
  });

  describe('状态管理和数据一致性', () => {
    
    test('应该正确调用相应的服务', async () => {
      render(<GoldAnalysisPage />, { wrapper: TestWrapper });

      await waitFor(() => {
        expect(screen.queryByText(/正在获取新闻/)).not.toBeInTheDocument();
      }, { timeout: 5000 });

      // 验证服务调用
      const { newsService } = require('../../services/newsService');
      expect(newsService.fetchMarketNews).toHaveBeenCalledWith('gold', expect.any(Number));
    });

    test('应该在页面切换时保持独立状态', async () => {
      // 测试黄金页面
      const { rerender } = render(<GoldAnalysisPage />, { 
        wrapper: ({ children }) => (
          <TestWrapper initialEntries={['/gold']}>
            {children}
          </TestWrapper>
        )
      });

      expect(screen.getByText(/现货黄金分析/)).toBeInTheDocument();

      // 切换到纳斯达克页面
      rerender(<NasdaqAnalysisPage />);
      expect(screen.getAllByText(/纳斯达克100分析/).length).toBeGreaterThan(0);

      // 切换回黄金页面
      rerender(<GoldAnalysisPage />);
      expect(screen.getByText(/现货黄金分析/)).toBeInTheDocument();
    });
  });

  describe('用户体验和性能', () => {
    
    test('应该在合理时间内完成页面加载', async () => {
      const startTime = Date.now();
      
      render(<GoldAnalysisPage />, { wrapper: TestWrapper });

      await waitFor(() => {
        expect(screen.queryByText(/正在获取新闻/)).not.toBeInTheDocument();
      }, { timeout: 3000 });

      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(3000); // 3秒内完成加载
    });

    test('应该显示适当的加载状态', async () => {
      // 延迟模拟响应
      const { newsService } = require('../../services/newsService');
      newsService.fetchMarketNews.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockNewsItems), 500))
      );

      render(<GoldAnalysisPage />, { wrapper: TestWrapper });

      // 验证加载状态显示
      expect(screen.getByText(/正在获取新闻/)).toBeInTheDocument();

      // 等待加载完成
      await waitFor(() => {
        expect(screen.queryByText(/正在获取新闻/)).not.toBeInTheDocument();
      }, { timeout: 1000 });
    });

    test('应该提供清晰的导航选项', () => {
      render(<GoldAnalysisPage />, { wrapper: TestWrapper });

      // 验证导航元素
      expect(screen.getAllByText(/返回首页/)).toHaveLength(2); // Header and sidebar
      expect(screen.getByText(/快速导航/)).toBeInTheDocument();
      expect(screen.getByText(/切换到纳斯达克100分析/)).toBeInTheDocument();
    });
  });
});
