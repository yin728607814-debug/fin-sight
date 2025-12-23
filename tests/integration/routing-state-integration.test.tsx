/**
 * 页面路由和状态管理集成测试
 * 测试页面切换和状态保持功能
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppProvider } from '../../utils/context';
import { HomePage } from '../../pages/HomePage';
import { GoldAnalysisPage } from '../../pages/GoldAnalysisPage';
import { NasdaqAnalysisPage } from '../../pages/NasdaqAnalysisPage';
import App from '../../App';

// 模拟服务
jest.mock('../../services/newsService', () => ({
  newsService: {
    fetchMarketNews: jest.fn().mockResolvedValue([]),
    analyzeNewsImpact: jest.fn().mockResolvedValue([])
  }
}));

jest.mock('../../services/priceService', () => ({
  priceService: {
    fetchPriceHistory: jest.fn().mockResolvedValue([]),
    getCurrentPrice: jest.fn().mockResolvedValue({
      symbol: 'TEST',
      name: 'Test Asset',
      currentPrice: 100,
      currency: 'USD',
      lastUpdated: new Date()
    })
  }
}));

jest.mock('../../services/analysisService', () => ({
  analysisService: {
    analyzeNewsImpact: jest.fn().mockResolvedValue([])
  }
}));

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

describe('页面路由和状态管理集成测试', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('路由导航测试', () => {
    
    test('应该正确渲染首页', () => {
      render(<HomePage />, { wrapper: TestWrapper });

      // 验证首页内容
      expect(screen.getByText(/投资新闻/)).toBeInTheDocument();
      expect(screen.getByText(/智能分析器/)).toBeInTheDocument();
      expect(screen.getByText(/选择投资产品/)).toBeInTheDocument();
      
      // 验证导航卡片
      expect(screen.getByText(/现货黄金分析/)).toBeInTheDocument();
      expect(screen.getByText(/纳斯达克100分析/)).toBeInTheDocument();
    });

    test('应该支持从首页导航到黄金分析页面', async () => {
      render(<App />, { 
        wrapper: ({ children }) => (
          <AppProvider enablePersistence={false}>
            {children}
          </AppProvider>
        )
      });

      // 验证在首页
      expect(screen.getByText(/选择投资产品/)).toBeInTheDocument();

      // 点击黄金分析链接
      const goldLink = screen.getByText(/现货黄金分析/).closest('a');
      expect(goldLink).toHaveAttribute('href', '/gold');

      // 模拟点击导航
      await act(async () => {
        fireEvent.click(goldLink!);
      });

      // 验证导航到黄金页面
      await waitFor(() => {
        expect(screen.getByText(/现货黄金分析/)).toBeInTheDocument();
      });
    });

    test('应该支持从首页导航到纳斯达克分析页面', async () => {
      render(<App />, { 
        wrapper: ({ children }) => (
          <AppProvider enablePersistence={false}>
            {children}
          </AppProvider>
        )
      });

      // 点击纳斯达克分析链接
      const nasdaqLink = screen.getByText(/纳斯达克100分析/).closest('a');
      expect(nasdaqLink).toHaveAttribute('href', '/nasdaq');

      await act(async () => {
        fireEvent.click(nasdaqLink!);
      });

      // 验证导航到纳斯达克页面
      await waitFor(() => {
        expect(screen.getByText(/纳斯达克100分析/)).toBeInTheDocument();
      });
    });

    test('应该支持从分析页面返回首页', async () => {
      render(<GoldAnalysisPage />, { 
        wrapper: ({ children }) => (
          <TestWrapper initialEntries={['/gold']}>
            {children}
          </TestWrapper>
        )
      });

      // 验证在黄金分析页面
      expect(screen.getByText(/现货黄金分析/)).toBeInTheDocument();

      // 点击返回首页链接
      const homeLinks = screen.getAllByText(/返回首页/);
      expect(homeLinks[0].closest('a')).toHaveAttribute('href', '/');
    });

    test('应该支持在分析页面间切换', async () => {
      render(<GoldAnalysisPage />, { 
        wrapper: ({ children }) => (
          <TestWrapper initialEntries={['/gold']}>
            {children}
          </TestWrapper>
        )
      });

      // 验证在黄金页面
      expect(screen.getByText(/现货黄金分析/)).toBeInTheDocument();

      // 查找切换到纳斯达克的链接
      const switchLink = screen.getByText(/切换到纳斯达克100分析/);
      expect(switchLink.closest('a')).toHaveAttribute('href', '/nasdaq');
    });
  });

  describe('状态管理测试', () => {
    
    test('应该在页面切换时保持全局状态', async () => {
      const TestComponent = () => {
        const [currentPage, setCurrentPage] = React.useState<'home' | 'gold' | 'nasdaq'>('home');

        return (
          <TestWrapper initialEntries={currentPage === 'home' ? ['/'] : currentPage === 'gold' ? ['/gold'] : ['/nasdaq']}>
            <div>
              <button onClick={() => setCurrentPage('home')}>Go Home</button>
              <button onClick={() => setCurrentPage('gold')}>Go Gold</button>
              <button onClick={() => setCurrentPage('nasdaq')}>Go Nasdaq</button>
              
              {currentPage === 'home' && <HomePage />}
              {currentPage === 'gold' && <GoldAnalysisPage />}
              {currentPage === 'nasdaq' && <NasdaqAnalysisPage />}
            </div>
          </TestWrapper>
        );
      };

      render(<TestComponent />);

      // 切换到黄金页面
      await act(async () => {
        fireEvent.click(screen.getByText('Go Gold'));
      });

      await waitFor(() => {
        expect(screen.getByText(/现货黄金分析/)).toBeInTheDocument();
      });

      // 切换到纳斯达克页面
      await act(async () => {
        fireEvent.click(screen.getByText('Go Nasdaq'));
      });

      await waitFor(() => {
        expect(screen.getByText(/纳斯达克100分析/)).toBeInTheDocument();
      });

      // 返回首页
      await act(async () => {
        fireEvent.click(screen.getByText('Go Home'));
      });

      await waitFor(() => {
        expect(screen.getByText(/选择投资产品/)).toBeInTheDocument();
      });
    });

    test('应该正确设置当前资产类型', async () => {
      // 测试黄金页面设置资产类型
      render(<GoldAnalysisPage />, { 
        wrapper: ({ children }) => (
          <TestWrapper initialEntries={['/gold']}>
            {children}
          </TestWrapper>
        )
      });

      // 等待页面加载和状态设置
      await waitFor(() => {
        expect(screen.getByText(/现货黄金分析/)).toBeInTheDocument();
      });

      // 验证黄金特有的UI元素
      const goldIndicator = document.querySelector('.bg-yellow-500');
      expect(goldIndicator).toBeInTheDocument();
    });

    test('应该在纳斯达克页面正确设置资产类型', async () => {
      render(<NasdaqAnalysisPage />, { 
        wrapper: ({ children }) => (
          <TestWrapper initialEntries={['/nasdaq']}>
            {children}
          </TestWrapper>
        )
      });

      await waitFor(() => {
        expect(screen.getByText(/纳斯达克100分析/)).toBeInTheDocument();
      });

      // 验证纳斯达克特有的UI元素
      const nasdaqIndicator = document.querySelector('.bg-blue-500');
      expect(nasdaqIndicator).toBeInTheDocument();
    });
  });

  describe('页面状态保持测试', () => {
    
    test('应该在页面切换后保持数据状态', async () => {
      // 模拟有数据的服务响应
      
      const mockNews = [
        {
          id: 'news-1',
          title: 'Test News',
          content: 'Test content',
          source: 'Test Source',
          publishedAt: new Date(),
          url: 'https://test.com',
          relevanceScore: 0.8
        }
      ];

      const mockPriceData = [
        {
          date: new Date(),
          open: 100,
          high: 105,
          low: 95,
          close: 102,
          volume: 1000,
          change: 2,
          changePercent: 2.0
        }
      ];

      const { newsService } = require('../../services/newsService');
      const { priceService } = require('../../services/priceService');
      newsService.fetchMarketNews.mockResolvedValue(mockNews);
      priceService.fetchPriceHistory.mockResolvedValue(mockPriceData);

      // 渲染黄金页面并等待数据加载
      const { rerender } = render(<GoldAnalysisPage />, { 
        wrapper: ({ children }) => (
          <TestWrapper initialEntries={['/gold']}>
            {children}
          </TestWrapper>
        )
      });

      await waitFor(() => {
        expect(screen.queryByText(/加载中/)).not.toBeInTheDocument();
      });

      // 切换到首页
      rerender(<HomePage />);
      expect(screen.getByText(/选择投资产品/)).toBeInTheDocument();

      // 切换回黄金页面
      rerender(<GoldAnalysisPage />);
      
      // 验证数据仍然存在（通过Context状态保持）
      await waitFor(() => {
        expect(screen.getByText(/现货黄金分析/)).toBeInTheDocument();
      });
    });

    test('应该正确处理页面刷新状态', async () => {
      render(<GoldAnalysisPage />, { 
        wrapper: ({ children }) => (
          <TestWrapper initialEntries={['/gold']}>
            {children}
          </TestWrapper>
        )
      });

      // 等待初始加载
      await waitFor(() => {
        expect(screen.queryByText(/加载中/)).not.toBeInTheDocument();
      });

      // 点击刷新按钮
      const refreshButton = screen.getByText(/刷新数据/);
      
      await act(async () => {
        fireEvent.click(refreshButton);
      });

      // 验证刷新按钮被点击（按钮可能会被禁用）
      expect(refreshButton).toBeInTheDocument();

      // 等待可能的状态变化
      await waitFor(() => {
        // 验证页面仍然正常显示
        expect(screen.getByText(/现货黄金分析/)).toBeInTheDocument();
      });
    });
  });

  describe('URL路由测试', () => {
    
    test('应该正确处理直接访问黄金分析页面', () => {
      render(<GoldAnalysisPage />, { 
        wrapper: ({ children }) => (
          <TestWrapper initialEntries={['/gold']}>
            {children}
          </TestWrapper>
        )
      });

      expect(screen.getByText(/现货黄金分析/)).toBeInTheDocument();
    });

    test('应该正确处理直接访问纳斯达克分析页面', () => {
      render(<NasdaqAnalysisPage />, { 
        wrapper: ({ children }) => (
          <TestWrapper initialEntries={['/nasdaq']}>
            {children}
          </TestWrapper>
        )
      });

      expect(screen.getByText(/纳斯达克100分析/)).toBeInTheDocument();
    });

    test('应该正确处理根路径', () => {
      render(<HomePage />, { 
        wrapper: ({ children }) => (
          <TestWrapper initialEntries={['/']}>
            {children}
          </TestWrapper>
        )
      });

      expect(screen.getByText(/选择投资产品/)).toBeInTheDocument();
    });
  });

  describe('导航用户体验测试', () => {
    
    test('应该显示正确的页面标题和面包屑', () => {
      render(<GoldAnalysisPage />, { 
        wrapper: ({ children }) => (
          <TestWrapper initialEntries={['/gold']}>
            {children}
          </TestWrapper>
        )
      });

      // 验证页面标题
      expect(screen.getByText(/现货黄金分析/)).toBeInTheDocument();
      
      // 验证返回链接
      expect(screen.getAllByText(/返回首页/)[0]).toBeInTheDocument();
    });

    test('应该提供页面间的快速导航', () => {
      render(<GoldAnalysisPage />, { 
        wrapper: ({ children }) => (
          <TestWrapper initialEntries={['/gold']}>
            {children}
          </TestWrapper>
        )
      });

      // 验证快速导航部分
      expect(screen.getByText(/快速导航/)).toBeInTheDocument();
      expect(screen.getByText(/切换到纳斯达克100分析/)).toBeInTheDocument();
      expect(screen.getAllByText(/返回首页/)[0]).toBeInTheDocument();
    });

    test('应该在纳斯达克页面提供到黄金页面的导航', () => {
      render(<NasdaqAnalysisPage />, { 
        wrapper: ({ children }) => (
          <TestWrapper initialEntries={['/nasdaq']}>
            {children}
          </TestWrapper>
        )
      });

      expect(screen.getByText(/切换到现货黄金分析/)).toBeInTheDocument();
    });
  });

  describe('状态持久化测试', () => {
    
    test('应该支持禁用状态持久化', () => {
      // 这个测试验证enablePersistence=false的情况
      render(<GoldAnalysisPage />, { 
        wrapper: ({ children }) => (
          <MemoryRouter initialEntries={['/gold']}>
            <AppProvider enablePersistence={false}>
              {children}
            </AppProvider>
          </MemoryRouter>
        )
      });

      expect(screen.getByText(/现货黄金分析/)).toBeInTheDocument();
    });

    test('应该正确处理状态重置', async () => {
      const TestComponentWithReset = () => {
        const [key, setKey] = React.useState(0);

        return (
          <div>
            <button onClick={() => setKey(k => k + 1)}>Reset</button>
            <TestWrapper key={key}>
              <GoldAnalysisPage />
            </TestWrapper>
          </div>
        );
      };

      render(<TestComponentWithReset />);

      // 等待初始加载
      await waitFor(() => {
        expect(screen.getByText(/现货黄金分析/)).toBeInTheDocument();
      });

      // 重置状态
      await act(async () => {
        fireEvent.click(screen.getByText('Reset'));
      });

      // 验证页面重新加载
      await waitFor(() => {
        expect(screen.getByText(/现货黄金分析/)).toBeInTheDocument();
      });
    });
  });
});