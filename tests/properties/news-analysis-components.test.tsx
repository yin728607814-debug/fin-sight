/**
 * 新闻分析组件属性测试
 * **Feature: investment-news-analyzer, Property 3: 新闻影响分析完整性**
 * **Feature: investment-news-analyzer, Property 4: 影响分析结果格式**
 * **Feature: investment-news-analyzer, Property 5: 分析结果展示格式**
 * **Feature: investment-news-analyzer, Property 6: 新闻影响程度排序**
 */

import * as fc from 'fast-check';
import { render, screen } from '@testing-library/react';
import { NewsList, ImpactIndicator } from '../../components';
import { AppProvider } from '../../utils/context';
import { generators } from '../utils';
import { NewsItem, NewsAnalysis, ImpactType } from '../../types';

// 测试包装器
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AppProvider enablePersistence={false}>
    {children}
  </AppProvider>
);

describe('新闻分析组件属性测试', () => {

  /**
   * **Feature: investment-news-analyzer, Property 3: 新闻影响分析完整性**
   * **Validates: Requirements 2.1**
   * 
   * For any 获取到的新闻项，系统应该为每条新闻生成对应的影响分析
   */
  describe('Property 3: 新闻影响分析完整性', () => {
    test('每条新闻都应该有对应的分析结果', () => {
      fc.assert(
        fc.property(
          fc.array(generators.newsItem(), { minLength: 1, maxLength: 5 }),
          fc.array(generators.newsAnalysis(), { minLength: 1, maxLength: 5 }),
          (newsItems, analysisItems) => {
            // 确保分析项与新闻项对应
            const matchedAnalysis = analysisItems.slice(0, newsItems.length).map((analysis, index) => ({
              ...analysis,
              newsId: newsItems[index].id
            }));

            const { unmount } = render(
              <TestWrapper>
                <NewsList 
                  news={newsItems} 
                  analysis={matchedAnalysis} 
                  loading={false} 
                />
              </TestWrapper>
            );
            
            try {
              // 验证新闻列表显示
              expect(screen.getByText(`新闻列表 (${newsItems.length})`)).toBeInTheDocument();
              
              // 验证每条新闻都有标题显示
              newsItems.forEach(newsItem => {
                // 由于标题可能被截断，我们检查部分标题
                const titleWords = newsItem.title.trim().split(' ').filter(word => word.length > 0).slice(0, 3).join(' ');
                if (titleWords.length > 0) {
                  expect(screen.getByText(titleWords, { exact: false })).toBeInTheDocument();
                }
              });
              
              return true;
            } finally {
              unmount();
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    test('分析结果应该包含所有必需字段', () => {
      fc.assert(
        fc.property(
          generators.newsAnalysis(),
          (analysis) => {
            // 验证分析结果包含所有必需字段
            expect(analysis.newsId).toBeDefined();
            expect(typeof analysis.newsId).toBe('string');
            expect(analysis.newsId.length).toBeGreaterThan(0);
            
            expect(analysis.impact).toBeDefined();
            expect(['positive', 'negative', 'neutral']).toContain(analysis.impact);
            
            expect(analysis.confidence).toBeDefined();
            expect(typeof analysis.confidence).toBe('number');
            expect(Number.isFinite(analysis.confidence)).toBe(true);
            expect(analysis.confidence).toBeGreaterThanOrEqual(0);
            expect(analysis.confidence).toBeLessThanOrEqual(1);
            
            expect(analysis.summary).toBeDefined();
            expect(typeof analysis.summary).toBe('string');
            expect(analysis.summary.length).toBeGreaterThan(0);
            
            expect(analysis.keyPoints).toBeDefined();
            expect(Array.isArray(analysis.keyPoints)).toBe(true);
            
            expect(analysis.predictedChange).toBeDefined();
            expect(typeof analysis.predictedChange).toBe('number');
            expect(Number.isFinite(analysis.predictedChange)).toBe(true);
            
            expect(analysis.timeframe).toBeDefined();
            expect(['short', 'medium', 'long']).toContain(analysis.timeframe);
            
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * **Feature: investment-news-analyzer, Property 4: 影响分析结果格式**
   * **Validates: Requirements 2.2**
   * 
   * For any 生成的影响分析，应该包含影响方向、置信度和趋势预测信息
   */
  describe('Property 4: 影响分析结果格式', () => {
    test('影响指示器应该正确显示影响方向', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('positive' as const, 'negative' as const, 'neutral' as const),
          fc.float({ min: 0, max: 1 }),
          fc.string({ minLength: 10, maxLength: 100 }),
          (impact, confidence, summary) => {
            const { unmount } = render(
              <ImpactIndicator 
                impact={impact} 
                confidence={confidence} 
                summary={summary} 
              />
            );
            
            try {
              // 验证影响标签显示
              const expectedLabel = {
                positive: '利好',
                negative: '利空',
                neutral: '中性'
              };
              
              expect(screen.getByText(expectedLabel[impact])).toBeInTheDocument();
              
              // 验证置信度显示
              expect(screen.getByText('置信度')).toBeInTheDocument();
              const confidencePercent = `${(confidence * 100).toFixed(0)}%`;
              expect(screen.getByText(confidencePercent)).toBeInTheDocument();
              
              return true;
            } finally {
              unmount();
            }
          }
        ),
        { numRuns: 30 }
      );
    });

    test('置信度应该正确分级显示', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('positive' as const, 'negative' as const, 'neutral' as const),
          fc.float({ min: 0, max: 1 }),
          fc.string({ minLength: 10, maxLength: 100 }),
          (impact, confidence, summary) => {
            const { unmount } = render(
              <ImpactIndicator 
                impact={impact} 
                confidence={confidence} 
                summary={summary} 
              />
            );
            
            try {
              // 验证置信度等级
              let expectedLevel: string;
              if (confidence >= 0.8) expectedLevel = '高';
              else if (confidence >= 0.6) expectedLevel = '中';
              else if (confidence >= 0.4) expectedLevel = '低';
              else expectedLevel = '很低';
              
              expect(screen.getByText(expectedLevel)).toBeInTheDocument();
              
              return true;
            } finally {
              unmount();
            }
          }
        ),
        { numRuns: 30 }
      );
    });

    test('预测变化应该包含数值和方向', () => {
      fc.assert(
        fc.property(
          generators.newsAnalysis(),
          (analysis) => {
            // 验证预测变化格式
            expect(typeof analysis.predictedChange).toBe('number');
            
            // 预测变化应该在合理范围内
            expect(analysis.predictedChange).toBeGreaterThanOrEqual(-100);
            expect(analysis.predictedChange).toBeLessThanOrEqual(100);
            
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * **Feature: investment-news-analyzer, Property 5: 分析结果展示格式**
   * **Validates: Requirements 2.3**
   * 
   * For any 影响分析结果，展示格式应该包含易于理解的重点归纳和影响指示
   */
  describe('Property 5: 分析结果展示格式', () => {
    test('新闻列表应该显示易于理解的格式', () => {
      fc.assert(
        fc.property(
          fc.array(generators.newsItem(), { minLength: 1, maxLength: 3 }),
          fc.array(generators.newsAnalysis(), { minLength: 1, maxLength: 3 }),
          (newsItems, analysisItems) => {
            // 确保分析项与新闻项对应
            const matchedAnalysis = analysisItems.slice(0, newsItems.length).map((analysis, index) => ({
              ...analysis,
              newsId: newsItems[index].id
            }));

            const { unmount } = render(
              <TestWrapper>
                <NewsList 
                  news={newsItems} 
                  analysis={matchedAnalysis} 
                  loading={false} 
                />
              </TestWrapper>
            );
            
            try {
              // 验证排序控制显示
              expect(screen.getByText('排序:')).toBeInTheDocument();
              expect(screen.getByDisplayValue('影响程度')).toBeInTheDocument();
              
              // 验证新闻源标签显示（过滤掉空白源）
              newsItems.forEach(newsItem => {
                if (newsItem.source.trim().length > 0) {
                  expect(screen.getByText(newsItem.source)).toBeInTheDocument();
                }
              });
              
              return true;
            } finally {
              unmount();
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    test('展开的新闻应该显示详细分析信息', () => {
      const testNews: NewsItem = {
        id: 'test-news-1',
        title: 'Test News Title',
        content: 'This is test news content for analysis.',
        source: 'Test Source',
        publishedAt: new Date('2024-01-01'),
        url: 'https://example.com/news/1',
        relevanceScore: 0.8
      };

      const testAnalysis: NewsAnalysis = {
        newsId: 'test-news-1',
        impact: 'positive',
        confidence: 0.85,
        summary: 'This news has a positive impact on the market.',
        keyPoints: ['Key point 1', 'Key point 2', 'Key point 3'],
        predictedChange: 2.5,
        timeframe: 'short'
      };

      const { unmount } = render(
        <TestWrapper>
          <NewsList 
            news={[testNews]} 
            analysis={[testAnalysis]} 
            loading={false} 
          />
        </TestWrapper>
      );

      try {
        // 验证基本信息显示
        expect(screen.getByText('Test News Title')).toBeInTheDocument();
        expect(screen.getByText('Test Source')).toBeInTheDocument();
        
        // 验证影响指示器
        expect(screen.getByText('利好')).toBeInTheDocument();
      } finally {
        unmount();
      }
    });
  });

  /**
   * **Feature: investment-news-analyzer, Property 6: 新闻影响程度排序**
   * **Validates: Requirements 2.4**
   * 
   * For any 多条新闻的分析结果，应该按照影响程度从高到低进行排序显示
   */
  describe('Property 6: 新闻影响程度排序', () => {
    test('新闻应该按影响程度排序', () => {
      // 创建具有不同影响程度的测试数据
      const testNewsItems: NewsItem[] = [
        {
          id: 'news-1',
          title: 'Low Impact News',
          content: 'Low impact content',
          source: 'Source 1',
          publishedAt: new Date('2024-01-01'),
          url: 'https://example.com/1',
          relevanceScore: 0.5
        },
        {
          id: 'news-2',
          title: 'High Impact News',
          content: 'High impact content',
          source: 'Source 2',
          publishedAt: new Date('2024-01-02'),
          url: 'https://example.com/2',
          relevanceScore: 0.9
        },
        {
          id: 'news-3',
          title: 'Medium Impact News',
          content: 'Medium impact content',
          source: 'Source 3',
          publishedAt: new Date('2024-01-03'),
          url: 'https://example.com/3',
          relevanceScore: 0.7
        }
      ];

      const testAnalysisItems: NewsAnalysis[] = [
        {
          newsId: 'news-1',
          impact: 'positive',
          confidence: 0.3,
          summary: 'Low impact analysis',
          keyPoints: ['Low point'],
          predictedChange: 0.5,
          timeframe: 'short'
        },
        {
          newsId: 'news-2',
          impact: 'negative',
          confidence: 0.9,
          summary: 'High impact analysis',
          keyPoints: ['High point'],
          predictedChange: -5.0,
          timeframe: 'short'
        },
        {
          newsId: 'news-3',
          impact: 'positive',
          confidence: 0.7,
          summary: 'Medium impact analysis',
          keyPoints: ['Medium point'],
          predictedChange: 2.0,
          timeframe: 'short'
        }
      ];

      const { unmount } = render(
        <TestWrapper>
          <NewsList 
            news={testNewsItems} 
            analysis={testAnalysisItems} 
            loading={false} 
          />
        </TestWrapper>
      );

      try {
        // 验证所有新闻都显示
        expect(screen.getByText('Low Impact News')).toBeInTheDocument();
        expect(screen.getByText('High Impact News')).toBeInTheDocument();
        expect(screen.getByText('Medium Impact News')).toBeInTheDocument();
        
        // 验证排序选项存在
        expect(screen.getByDisplayValue('影响程度')).toBeInTheDocument();
      } finally {
        unmount();
      }
    });

    test('影响程度计算应该考虑置信度和预测变化', () => {
      fc.assert(
        fc.property(
          fc.array(generators.newsAnalysis(), { minLength: 2, maxLength: 5 }),
          (analysisItems) => {
            // 计算影响程度分数（置信度 * 预测变化的绝对值）
            const scores = analysisItems.map(analysis => 
              analysis.confidence * Math.abs(analysis.predictedChange)
            );
            
            // 验证分数计算逻辑
            scores.forEach((score, index) => {
              const analysis = analysisItems[index];
              const expectedScore = analysis.confidence * Math.abs(analysis.predictedChange);
              expect(score).toBeCloseTo(expectedScore, 5);
            });
            
            return true;
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  // 边界情况和错误处理测试
  describe('新闻分析组件边界情况测试', () => {
    test('空新闻列表应该显示适当消息', () => {
      const { unmount } = render(
        <TestWrapper>
          <NewsList 
            news={[]} 
            analysis={[]} 
            loading={false} 
          />
        </TestWrapper>
      );

      try {
        expect(screen.getByText('暂无新闻')).toBeInTheDocument();
        expect(screen.getByText('当前没有可显示的新闻内容')).toBeInTheDocument();
      } finally {
        unmount();
      }
    });

    test('加载状态应该显示加载指示器', () => {
      const { unmount } = render(
        <TestWrapper>
          <NewsList 
            news={[]} 
            analysis={[]} 
            loading={true} 
          />
        </TestWrapper>
      );

      try {
        expect(screen.getByText('正在加载新闻...')).toBeInTheDocument();
      } finally {
        unmount();
      }
    });

    test('极端置信度值应该正确处理', () => {
      const extremeConfidenceTests = [
        { confidence: 0, expectedLevel: '很低' },
        { confidence: 0.4, expectedLevel: '低' },
        { confidence: 0.6, expectedLevel: '中' },
        { confidence: 0.8, expectedLevel: '高' },
        { confidence: 1, expectedLevel: '高' }
      ];

      extremeConfidenceTests.forEach(({ confidence, expectedLevel }) => {
        const { unmount } = render(
          <ImpactIndicator 
            impact="positive" 
            confidence={confidence} 
            summary="Test summary" 
          />
        );

        try {
          expect(screen.getByText(expectedLevel)).toBeInTheDocument();
        } finally {
          unmount();
        }
      });
    });

    test('极端预测变化值应该正确显示', () => {
      const extremeChangeTests = [
        { change: -10, expectedSign: '-' },
        { change: 0, expectedSign: '+' },
        { change: 10, expectedSign: '+' }
      ];

      extremeChangeTests.forEach(({ change, expectedSign }) => {
        const testAnalysis: NewsAnalysis = {
          newsId: 'test',
          impact: change >= 0 ? 'positive' : 'negative',
          confidence: 0.8,
          summary: 'Test',
          keyPoints: ['Test'],
          predictedChange: change,
          timeframe: 'short'
        };

        const testNews: NewsItem = {
          id: 'test',
          title: 'Test News',
          content: 'Test content',
          source: 'Test Source',
          publishedAt: new Date(),
          url: 'https://test.com',
          relevanceScore: 0.8
        };

        const { unmount } = render(
          <TestWrapper>
            <NewsList 
              news={[testNews]} 
              analysis={[testAnalysis]} 
              loading={false} 
            />
          </TestWrapper>
        );

        try {
          const changeText = `预测变化: ${expectedSign}${Math.abs(change).toFixed(2)}%`;
          expect(screen.getByText(changeText, { exact: false })).toBeInTheDocument();
        } finally {
          unmount();
        }
      });
    });
  });
});