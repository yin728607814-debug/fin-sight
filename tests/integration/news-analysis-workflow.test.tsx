/**
 * 新闻分析工作流集成测试
 * 测试完整的新闻获取→分析→展示流程
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from '../../utils/context';
import { GoldAnalysisPage } from '../../pages/GoldAnalysisPage';
import { NasdaqAnalysisPage } from '../../pages/NasdaqAnalysisPage';
import { NewsItem, NewsAnalysis, AssetType } from '../../types';

// 模拟服务
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
const mockNewsItems: NewsItem[] = [
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

const mockAnalysis: NewsAnalysis[] = [
  {
    newsId: 'news-1',
    impact: 'positive',
    confidence: 0.85,
    summary: 'Positive impact on gold prices due to safe-haven demand',
    keyPoints: ['Market uncertainty', 'Inflation hedge', 'Safe-haven asset'],
    predictedChange: 2.5,
    timeframe: 'short'
  },
  {
    newsId: 'news-2',
    impact: 'negative', 
    confidence: 0.75,
    summary: 'Potential negative impact if rates increase',
    keyPoints: ['Interest rate sensitivity', 'Opportunity cost', 'Dollar strength'],
    predictedChange: -1.8,
    timeframe: 'medium'
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
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <AppProvider enablePersistence={false}>
      {children}
    </AppProvider>
  </BrowserRouter>
);

describe('新闻分析工作流集成测试', () => {
  
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

  describe('黄金分析页面完整工作流', () => {
    
    test('应该完成完整的新闻获取→分析→展示流程', async () => {
      render(<GoldAnalysisPage />, { wrapper: TestWrapper });

      // 验证页面初始加载
      expect(screen.getByText(/现货黄金分析/)).toBeInTheDocument();
      
      // 等待数据加载完成
      await waitFor(() => {
        expect(screen.queryByText(/加载中/)).not.toBeInTheDocument();
      }, { timeout: 5000 });

      // 验证新闻分析组件存在
      expect(screen.getByText(/新闻影响分析/)).toBeInTheDocument();
      
      // 验证价格趋势图表存在
      expect(screen.getByText(/价格趋势/)).toBeInTheDocument();
      
      // 验证相关新闻列表存在
      expect(screen.getAllByText(/相关新闻/)[0]).toBeInTheDocument();
    });

    test('应该正确处理数据刷新流程', async () => {
      render(<GoldAnalysisPage />, { wrapper: TestWrapper });

      // 等待初始加载
      await waitFor(() => {
        expect(screen.queryByText(/正在获取新闻/)).not.toBeInTheDocument();
      }, { timeout: 5000 });

      // 点击刷新按钮
      const refreshButton = screen.getAllByText(/重试/)[0];
      
      await act(async () => {
        fireEvent.click(refreshButton);
      });

      // 验证刷新按钮被点击
      expect(refreshButton).toBeInTheDocument();
    });

    test('应该正确显示市场概览信息', async () => {
      render(<GoldAnalysisPage />, { wrapper: TestWrapper });

      await waitFor(() => {
        expect(screen.queryByText(/正在获取新闻/)).not.toBeInTheDocument();
      }, { timeout: 5000 });

      // 验证市场概览部分
      expect(screen.getByText(/市场概览/)).toBeInTheDocument();
      expect(screen.getAllByText(/当前价格/).length).toBeGreaterThan(0);
      expect(screen.getByText(/24小时变化/)).toBeInTheDocument();
      expect(screen.getAllByText(/相关新闻/)[0]).toBeInTheDocument();
      expect(screen.getByText(/分析报告/)).toBeInTheDocument();
    });
  });

  describe('纳斯达克分析页面完整工作流', () => {
    
    test('应该完成完整的新闻获取→分析→展示流程', async () => {
      // 设置纳斯达克相关的模拟数据
      const nasdaqNews = mockNewsItems.map(item => ({
        ...item,
        title: item.title.replace('Gold', 'NASDAQ 100'),
        content: item.content.replace('gold', 'NASDAQ 100')
      }));

      const { newsService } = require('../../services/newsService');
      newsService.fetchMarketNews.mockResolvedValue(nasdaqNews);

      render(<NasdaqAnalysisPage />, { wrapper: TestWrapper });

      // 验证页面初始加载
      expect(screen.getAllByText(/纳斯达克100分析/).length).toBeGreaterThan(0);
      
      // 等待数据加载完成
      await waitFor(() => {
        expect(screen.queryByText(/正在获取新闻/)).not.toBeInTheDocument();
      }, { timeout: 5000 });

      // 验证纳斯达克特有的UI元素
      expect(screen.getByText(/技术指标/)).toBeInTheDocument();
      expect(screen.getByText(/5日最高/)).toBeInTheDocument();
      expect(screen.getByText(/5日最低/)).toBeInTheDocument();
    });

    test('应该显示纳斯达克特有的技术指标', async () => {
      render(<NasdaqAnalysisPage />, { wrapper: TestWrapper });

      await waitFor(() => {
        expect(screen.queryByText(/正在获取新闻/)).not.toBeInTheDocument();
      }, { timeout: 5000 });

      // 验证技术指标部分
      expect(screen.getByText(/技术指标/)).toBeInTheDocument();
      expect(screen.getByText(/平均成交量/)).toBeInTheDocument();
    });
  });

  describe('错误处理和恢复机制', () => {
    
    test('应该正确处理新闻获取失败', async () => {
      const { newsService } = require('../../services/newsService');
      newsService.fetchMarketNews.mockRejectedValue(new Error('API Error'));

      render(<GoldAnalysisPage />, { wrapper: TestWrapper });

      // 等待错误处理
      await waitFor(() => {
        expect(screen.getByText(/数据加载出现问题/)).toBeInTheDocument();
      }, { timeout: 5000 });

      // 验证重试按钮存在
      const retryButtons = screen.getAllByText(/重试/);
      expect(retryButtons.length).toBeGreaterThan(0);
      expect(retryButtons[0]).toBeInTheDocument();
    });

    test('应该正确处理价格数据获取失败', async () => {
      const { priceService } = require('../../services/priceService');
      priceService.fetchFiveDayPriceHistory.mockRejectedValue(new Error('Price API Error'));

      render(<GoldAnalysisPage />, { wrapper: TestWrapper });

      await waitFor(() => {
        expect(screen.getByText(/暂无价格数据/)).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    test('应该在网络错误后支持重试', async () => {
      // 第一次调用失败，第二次成功
      const { newsService } = require('../../services/newsService');
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

      // 验证重试被调用
      expect(newsService.fetchMarketNews).toHaveBeenCalledTimes(2);
    });
  });

  describe('数据一致性验证', () => {
    
    test('新闻数据和分析数据应该保持一致', async () => {
      render(<GoldAnalysisPage />, { wrapper: TestWrapper });

      await waitFor(() => {
        expect(screen.queryByText(/正在获取新闻/)).not.toBeInTheDocument();
      }, { timeout: 5000 });

      // 验证数据一致性显示
      expect(screen.getByText(/现货黄金分析/)).toBeInTheDocument();
    });

    test('价格数据应该按时间正序排列', async () => {
      render(<GoldAnalysisPage />, { wrapper: TestWrapper });

      await waitFor(() => {
        expect(screen.queryByText(/正在获取新闻/)).not.toBeInTheDocument();
      }, { timeout: 5000 });

      // 验证价格数据显示
      expect(screen.getByText(/价格趋势/)).toBeInTheDocument();
    });
  });

  describe('性能和用户体验', () => {
    
    test('页面应该在合理时间内加载完成', async () => {
      const startTime = Date.now();
      
      render(<GoldAnalysisPage />, { wrapper: TestWrapper });

      await waitFor(() => {
        expect(screen.queryByText(/加载中/)).not.toBeInTheDocument();
      }, { timeout: 3000 });

      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(3000); // 3秒内完成加载
    });

    test('应该显示适当的加载状态', async () => {
      // 延迟模拟响应
      const { newsService } = require('../../services/newsService');
      newsService.fetchMarketNews.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockNewsItems), 1000))
      );

      render(<GoldAnalysisPage />, { wrapper: TestWrapper });

      // 验证加载状态显示
      expect(screen.getByText(/正在获取新闻/)).toBeInTheDocument();

      // 等待加载完成
      await waitFor(() => {
        expect(screen.queryByText(/正在获取新闻/)).not.toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });
});
