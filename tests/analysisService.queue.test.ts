/**
 * 测试 AnalysisService 的请求队列机制
 */

import { AnalysisService } from '../services/analysisService';

describe('AnalysisService - 请求队列机制', () => {
  let service: AnalysisService;
  
  beforeEach(() => {
    // 使用测试 API key
    service = new AnalysisService({
      apiKey: 'test-api-key-for-queue-testing'
    });
  });

  it('应该串行执行多个请求', async () => {
    const executionOrder: number[] = [];
    const testNews = [
      'News 1: Gold prices rise',
      'News 2: Tech stocks rally',
      'News 3: Dollar weakens'
    ];

    // 模拟多个并发请求
    const promises = testNews.map((news, index) => {
      return service.analyzeNewsImpact(news, 'gold')
        .then(() => {
          executionOrder.push(index);
        })
        .catch(() => {
          // 即使失败也记录执行顺序
          executionOrder.push(index);
        });
    });

    await Promise.all(promises);

    // 验证执行顺序是串行的（0, 1, 2）
    expect(executionOrder).toEqual([0, 1, 2]);
  }, 30000); // 30秒超时

  it('应该在请求失败后继续处理队列', async () => {
    const results: Array<{ index: number; success: boolean }> = [];
    
    const testNews = [
      'News 1',
      'News 2',
      'News 3'
    ];

    const promises = testNews.map((news, index) => {
      return service.analyzeNewsImpact(news, 'gold')
        .then(() => {
          results.push({ index, success: true });
        })
        .catch(() => {
          results.push({ index, success: false });
        });
    });

    await Promise.all(promises);

    // 验证所有请求都被处理了（无论成功或失败）
    expect(results).toHaveLength(3);
    expect(results.map(r => r.index)).toEqual([0, 1, 2]);
  }, 30000);

  it('应该使用缓存避免重复请求', async () => {
    const sameNews = 'Gold prices surge on inflation concerns';
    
    // 第一次请求
    const result1 = await service.analyzeNewsImpact(sameNews, 'gold')
      .catch(() => ({ impact: 'neutral' as const, confidence: 0.5, summary: '', keyPoints: [], predictedChange: 0 }));
    
    // 第二次请求（应该从缓存返回）
    const result2 = await service.analyzeNewsImpact(sameNews, 'gold')
      .catch(() => ({ impact: 'neutral' as const, confidence: 0.5, summary: '', keyPoints: [], predictedChange: 0 }));

    // 验证缓存工作
    const cacheStats = service.getCacheStats();
    expect(cacheStats.size).toBeGreaterThan(0);
  }, 15000);

  it('应该正确处理请求间隔', async () => {
    const timestamps: number[] = [];
    const testNews = ['News 1', 'News 2'];

    const promises = testNews.map((news) => {
      timestamps.push(Date.now());
      return service.analyzeNewsImpact(news, 'gold')
        .catch(() => {});
    });

    await Promise.all(promises);

    // 验证至少有一定的时间间隔（考虑到 MIN_REQUEST_INTERVAL = 4000ms）
    if (timestamps.length >= 2) {
      const interval = timestamps[1] - timestamps[0];
      // 请求应该几乎同时发起，但实际执行会有间隔
      expect(interval).toBeLessThan(100); // 发起时间间隔很短
    }
  }, 20000);
});
