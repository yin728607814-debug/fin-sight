/**
 * 页面内容过滤属性测试
 * **Feature: investment-news-analyzer, Property 7: 页面内容过滤 - 黄金**
 * **Feature: investment-news-analyzer, Property 8: 页面内容过滤 - 纳斯达克**
 */

import * as fc from 'fast-check';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ReactNode } from 'react';
import { AppProvider } from '../../utils/context';
import { GoldAnalysisPage } from '../../pages/GoldAnalysisPage';
import { NasdaqAnalysisPage } from '../../pages/NasdaqAnalysisPage';
import { generators } from '../utils';
import { AssetType, NewsItem, NewsAnalysis, PriceData } from '../../types';

// 测试包装器组件
const createTestWrapper = (initialState?: any) => {
  return ({ children }: { children: ReactNode }) => (
    <BrowserRouter>
      <AppProvider initialState={initialState} enablePersistence={false}>
        {children}
      </AppProvider>
    </BrowserRouter>
  );
};

// 模拟组件以避免复杂的API调用
jest.mock('../../components/NewsAnalyzer', () => ({
  NewsAnalyzer: ({ assetType }: { assetType: AssetType }) => (
    <div data-testid={`news-analyzer-${assetType}`}>
      News Analyzer for {assetType}
    </div>
  )
}));

jest.mock('../../components/TrendChart', () => ({
  TrendChart: ({ assetType, data }: { assetType: AssetType; data: PriceData[] }) => (
    <div data-testid={`trend-chart-${assetType}`}>
      Trend Chart for {assetType} with {data.length} data points
    </div>
  )
}));

jest.mock('../../components/NewsList', () => ({
  NewsList: ({ news, analysis }: { news: NewsItem[]; analysis: NewsAnalysis[] }) => (
    <div data-testid="news-list">
      <div data-testid="news-count">{news.length}</div>
      <div data-testid="analysis-count">{analysis.length}</div>
      {news.map((item, index) => (
        <div key={item.id} data-testid={`news-item-${index}`} data-asset-related={item.title.toLowerCase().includes('gold') || item.title.toLowerCase().includes('nasdaq')}>
          {item.title}
        </div>
      ))}
      {analysis.map((item, index) => (
        <div key={item.newsId} data-testid={`analysis-item-${index}`}>
          Analysis for {item.newsId}
        </div>
      ))}
    </div>
  )
}));

describe('页面内容过滤属性测试', () => {

  /**
   * **Feature: investment-news-analyzer, Property 7: 页面内容过滤 - 黄金**
   * **Validates: Requirements 3.2**
   * 
   * For any 现货黄金页面的内容，显示的新闻和分析应该只与黄金市场相关
   */
  describe('Property 7: 页面内容过滤 - 黄金', () => {
    test('黄金页面应该只显示与黄金相关的内容', () => {
      fc.assert(
        fc.property(
          fc.array(generators.newsItem(), { minLength: 1, maxLength: 5 }),
          fc.array(generators.newsAnalysis(), { minLength: 1, maxLength: 5 }),
          fc.array(generators.priceData(), { minLength: 1, maxLength: 10 }),
          (goldNews, goldAnalysis, goldPriceData) => {
            try {
              // 确保新闻标题包含黄金相关关键词
              const goldRelatedNews = goldNews.map(news => ({
                ...news,
                title: `Gold market ${news.title}`,
                content: `Gold related content: ${news.content}`
              }));

              const initialState = {
                currentAsset: 'gold' as AssetType,
                news: {
                  gold: goldRelatedNews,
                  nasdaq: []
                },
                analysis: {
                  gold: goldAnalysis,
                  nasdaq: []
                },
                priceData: {
                  gold: goldPriceData,
                  nasdaq: []
                }
              };

              const TestWrapper = createTestWrapper(initialState);
              const { unmount } = render(<GoldAnalysisPage />, { wrapper: TestWrapper });

              // 验证页面标题包含黄金相关信息
              expect(screen.getByText(/现货黄金分析/)).toBeInTheDocument();

              // 验证NewsAnalyzer组件针对黄金资产
              expect(screen.getByTestId('news-analyzer-gold')).toBeInTheDocument();
              expect(screen.queryByTestId('news-analyzer-nasdaq')).not.toBeInTheDocument();

              // 验证TrendChart组件针对黄金资产
              expect(screen.getByTestId('trend-chart-gold')).toBeInTheDocument();
              expect(screen.queryByTestId('trend-chart-nasdaq')).not.toBeInTheDocument();

              // 验证新闻列表显示正确数量的黄金相关新闻
              const newsCount = screen.getByTestId('news-count');
              expect(newsCount.textContent).toBe(goldRelatedNews.length.toString());

              // 验证分析数量
              const analysisCount = screen.getByTestId('analysis-count');
              expect(analysisCount.textContent).toBe(goldAnalysis.length.toString());

              // 清理DOM
              unmount();
              cleanup();

              return true;
            } catch (error) {
              cleanup();
              throw error;
            }
          }
        ),
        { numRuns: 20 }
      );
    });

    test('黄金页面的新闻内容应该与黄金市场相关', () => {
      fc.assert(
        fc.property(
          fc.array(generators.newsItem(), { minLength: 1, maxLength: 3 }),
          (newsItems) => {
            try {
              // 创建明确与黄金相关的新闻
              const goldNews = newsItems.map(news => ({
                ...news,
                title: `Gold prices ${news.title}`,
                content: `This news affects gold market: ${news.content}`
              }));

              const initialState = {
                currentAsset: 'gold' as AssetType,
                news: {
                  gold: goldNews,
                  nasdaq: []
                },
                analysis: { gold: [], nasdaq: [] },
                priceData: { gold: [], nasdaq: [] }
              };

              const TestWrapper = createTestWrapper(initialState);
              const { unmount } = render(<GoldAnalysisPage />, { wrapper: TestWrapper });

              // 验证所有显示的新闻都与黄金相关
              goldNews.forEach((_, index) => {
                const newsItem = screen.getByTestId(`news-item-${index}`);
                expect(newsItem.textContent).toMatch(/gold/i);
              });

              // 清理DOM
              unmount();
              cleanup();

              return true;
            } catch (error) {
              cleanup();
              throw error;
            }
          }
        ),
        { numRuns: 15 }
      );
    });

    test('黄金页面应该设置正确的当前资产类型', () => {
      const TestWrapper = createTestWrapper();
      const { unmount } = render(<GoldAnalysisPage />, { wrapper: TestWrapper });

      // 验证页面标识符
      expect(screen.getByText(/现货黄金分析/)).toBeInTheDocument();
      
      // 验证黄金特有的UI元素
      const goldIndicator = document.querySelector('[class*="yellow-500"]');
      expect(goldIndicator).toBeInTheDocument();

      // 清理DOM
      unmount();
      cleanup();
    });

    test('黄金页面的价格数据应该针对黄金资产', () => {
      fc.assert(
        fc.property(
          fc.array(generators.priceData(), { minLength: 1, maxLength: 5 }),
          (priceData) => {
            try {
              const initialState = {
                currentAsset: 'gold' as AssetType,
                news: { gold: [], nasdaq: [] },
                analysis: { gold: [], nasdaq: [] },
                priceData: {
                  gold: priceData,
                  nasdaq: []
                }
              };

              const TestWrapper = createTestWrapper(initialState);
              const { unmount } = render(<GoldAnalysisPage />, { wrapper: TestWrapper });

              // 验证趋势图表显示黄金数据
              const trendChart = screen.getByTestId('trend-chart-gold');
              expect(trendChart.textContent).toContain(`${priceData.length} data points`);

              // 清理DOM
              unmount();
              cleanup();

              return true;
            } catch (error) {
              cleanup();
              throw error;
            }
          }
        ),
        { numRuns: 15 }
      );
    });
  });

  /**
   * **Feature: investment-news-analyzer, Property 8: 页面内容过滤 - 纳斯达克**
   * **Validates: Requirements 3.3**
   * 
   * For any 纳斯达克100页面的内容，显示的新闻和分析应该只与纳斯达克100相关
   */
  describe('Property 8: 页面内容过滤 - 纳斯达克', () => {
    test('纳斯达克页面应该只显示与纳斯达克相关的内容', () => {
      fc.assert(
        fc.property(
          fc.array(generators.newsItem(), { minLength: 1, maxLength: 5 }),
          fc.array(generators.newsAnalysis(), { minLength: 1, maxLength: 5 }),
          fc.array(generators.priceData(), { minLength: 1, maxLength: 10 }),
          (nasdaqNews, nasdaqAnalysis, nasdaqPriceData) => {
            try {
              // 确保新闻标题包含纳斯达克相关关键词
              const nasdaqRelatedNews = nasdaqNews.map(news => ({
                ...news,
                title: `NASDAQ 100 ${news.title}`,
                content: `NASDAQ related content: ${news.content}`
              }));

              const initialState = {
                currentAsset: 'nasdaq' as AssetType,
                news: {
                  gold: [],
                  nasdaq: nasdaqRelatedNews
                },
                analysis: {
                  gold: [],
                  nasdaq: nasdaqAnalysis
                },
                priceData: {
                  gold: [],
                  nasdaq: nasdaqPriceData
                }
              };

              const TestWrapper = createTestWrapper(initialState);
              const { unmount } = render(<NasdaqAnalysisPage />, { wrapper: TestWrapper });

              // 验证页面标题包含纳斯达克相关信息
              expect(screen.getAllByText(/纳斯达克100分析/).length).toBeGreaterThan(0);

              // 验证NewsAnalyzer组件针对纳斯达克资产
              expect(screen.getByTestId('news-analyzer-nasdaq')).toBeInTheDocument();
              expect(screen.queryByTestId('news-analyzer-gold')).not.toBeInTheDocument();

              // 验证TrendChart组件针对纳斯达克资产
              expect(screen.getByTestId('trend-chart-nasdaq')).toBeInTheDocument();
              expect(screen.queryByTestId('trend-chart-gold')).not.toBeInTheDocument();

              // 验证新闻列表显示正确数量的纳斯达克相关新闻
              const newsCount = screen.getByTestId('news-count');
              expect(newsCount.textContent).toBe(nasdaqRelatedNews.length.toString());

              // 验证分析数量
              const analysisCount = screen.getByTestId('analysis-count');
              expect(analysisCount.textContent).toBe(nasdaqAnalysis.length.toString());

              // 清理DOM
              unmount();
              cleanup();

              return true;
            } catch (error) {
              cleanup();
              throw error;
            }
          }
        ),
        { numRuns: 20 }
      );
    });

    test('纳斯达克页面的新闻内容应该与纳斯达克100相关', () => {
      fc.assert(
        fc.property(
          fc.array(generators.newsItem(), { minLength: 1, maxLength: 3 }),
          (newsItems) => {
            try {
              // 创建明确与纳斯达克相关的新闻
              const nasdaqNews = newsItems.map(news => ({
                ...news,
                title: `NASDAQ 100 index ${news.title}`,
                content: `This news affects NASDAQ market: ${news.content}`
              }));

              const initialState = {
                currentAsset: 'nasdaq' as AssetType,
                news: {
                  gold: [],
                  nasdaq: nasdaqNews
                },
                analysis: { gold: [], nasdaq: [] },
                priceData: { gold: [], nasdaq: [] }
              };

              const TestWrapper = createTestWrapper(initialState);
              const { unmount } = render(<NasdaqAnalysisPage />, { wrapper: TestWrapper });

              // 验证所有显示的新闻都与纳斯达克相关
              nasdaqNews.forEach((_, index) => {
                const newsItem = screen.getByTestId(`news-item-${index}`);
                expect(newsItem.textContent).toMatch(/nasdaq/i);
              });

              // 清理DOM
              unmount();
              cleanup();

              return true;
            } catch (error) {
              cleanup();
              throw error;
            }
          }
        ),
        { numRuns: 15 }
      );
    });

    test('纳斯达克页面应该设置正确的当前资产类型', () => {
      const TestWrapper = createTestWrapper();
      const { unmount } = render(<NasdaqAnalysisPage />, { wrapper: TestWrapper });

      // 验证页面标识符
      expect(screen.getAllByText(/纳斯达克100分析/).length).toBeGreaterThan(0);
      
      // 验证纳斯达克特有的UI元素
      const nasdaqIndicator = document.querySelector('[class*="blue-500"]');
      expect(nasdaqIndicator).toBeInTheDocument();

      // 清理DOM
      unmount();
      cleanup();
    });

    test('纳斯达克页面的价格数据应该针对纳斯达克资产', () => {
      fc.assert(
        fc.property(
          fc.array(generators.priceData(), { minLength: 1, maxLength: 5 }),
          (priceData) => {
            try {
              const initialState = {
                currentAsset: 'nasdaq' as AssetType,
                news: { gold: [], nasdaq: [] },
                analysis: { gold: [], nasdaq: [] },
                priceData: {
                  gold: [],
                  nasdaq: priceData
                }
              };

              const TestWrapper = createTestWrapper(initialState);
              const { unmount } = render(<NasdaqAnalysisPage />, { wrapper: TestWrapper });

              // 验证趋势图表显示纳斯达克数据
              const trendChart = screen.getByTestId('trend-chart-nasdaq');
              expect(trendChart.textContent).toContain(`${priceData.length} data points`);

              // 清理DOM
              unmount();
              cleanup();

              return true;
            } catch (error) {
              cleanup();
              throw error;
            }
          }
        ),
        { numRuns: 15 }
      );
    });

    test('纳斯达克页面应该显示技术指标信息', () => {
      fc.assert(
        fc.property(
          fc.array(generators.priceData(), { minLength: 2, maxLength: 5 }),
          (priceData) => {
            try {
              const initialState = {
                currentAsset: 'nasdaq' as AssetType,
                news: { gold: [], nasdaq: [] },
                analysis: { gold: [], nasdaq: [] },
                priceData: {
                  gold: [],
                  nasdaq: priceData
                }
              };

              const TestWrapper = createTestWrapper(initialState);
              const { unmount } = render(<NasdaqAnalysisPage />, { wrapper: TestWrapper });

              // 验证技术指标部分存在（使用getAllByText来处理可能的多个匹配）
              const techIndicators = screen.getAllByText(/技术指标/);
              expect(techIndicators.length).toBeGreaterThan(0);
              
              const highLabels = screen.getAllByText(/5日最高/);
              expect(highLabels.length).toBeGreaterThan(0);
              
              const lowLabels = screen.getAllByText(/5日最低/);
              expect(lowLabels.length).toBeGreaterThan(0);

              // 清理DOM
              unmount();
              cleanup();

              return true;
            } catch (error) {
              cleanup();
              throw error;
            }
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  // 跨页面一致性测试
  describe('页面间数据隔离测试', () => {
    test('不同页面的数据应该完全隔离', () => {
      fc.assert(
        fc.property(
          fc.array(generators.newsItem(), { minLength: 1, maxLength: 3 }),
          fc.array(generators.newsItem(), { minLength: 1, maxLength: 3 }),
          (goldNews, nasdaqNews) => {
            const goldNewsWithKeywords = goldNews.map(news => ({
              ...news,
              title: `Gold market ${news.title}`
            }));

            const nasdaqNewsWithKeywords = nasdaqNews.map(news => ({
              ...news,
              title: `NASDAQ 100 ${news.title}`
            }));

            // 测试黄金页面
            const goldInitialState = {
              currentAsset: 'gold' as AssetType,
              news: {
                gold: goldNewsWithKeywords,
                nasdaq: []
              },
              analysis: { gold: [], nasdaq: [] },
              priceData: { gold: [], nasdaq: [] }
            };

            const GoldWrapper = createTestWrapper(goldInitialState);
            const { unmount: unmountGold } = render(<GoldAnalysisPage />, { wrapper: GoldWrapper });

            // 验证黄金页面只显示黄金新闻数量
            expect(screen.getByTestId('news-count').textContent).toBe(goldNewsWithKeywords.length.toString());

            // 完全清理DOM
            unmountGold();

            // 测试纳斯达克页面
            const nasdaqInitialState = {
              currentAsset: 'nasdaq' as AssetType,
              news: {
                gold: [],
                nasdaq: nasdaqNewsWithKeywords
              },
              analysis: { gold: [], nasdaq: [] },
              priceData: { gold: [], nasdaq: [] }
            };

            const NasdaqWrapper = createTestWrapper(nasdaqInitialState);
            const { unmount: unmountNasdaq } = render(<NasdaqAnalysisPage />, { wrapper: NasdaqWrapper });

            // 验证纳斯达克页面只显示纳斯达克新闻数量
            expect(screen.getByTestId('news-count').textContent).toBe(nasdaqNewsWithKeywords.length.toString());

            // 清理
            unmountNasdaq();

            return true;
          }
        ),
        { numRuns: 20 }
      );
    });
  });
});
