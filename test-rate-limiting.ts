/**
 * 测试 API 速率限制和队列机制
 */

import { AnalysisService } from './services/analysisService';

// 模拟新闻内容
const testNews = [
  'Gold prices surge as inflation concerns mount. Federal Reserve signals potential rate cuts.',
  'Tech stocks rally on strong earnings reports. Nasdaq hits new highs.',
  'Dollar weakens amid global economic uncertainty. Safe haven assets gain.',
  'Central banks coordinate policy response. Markets show mixed reactions.',
  'Oil prices fluctuate on supply concerns. Energy sector volatility increases.'
];

async function testRateLimiting() {
  console.log('🧪 开始测试 API 速率限制和队列机制\n');
  
  // 创建测试服务实例
  const service = new AnalysisService({
    apiKey: process.env.VITE_GEMINI_API_KEY || 'test-key'
  });
  
  console.log('📊 测试场景：同时发起 5 个分析请求\n');
  
  const startTime = Date.now();
  
  // 同时发起多个请求
  const promises = testNews.map((news, index) => {
    console.log(`🚀 发起请求 ${index + 1}: ${news.substring(0, 50)}...`);
    return service.analyzeNewsImpact(news, index % 2 === 0 ? 'gold' : 'nasdaq')
      .then(result => {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`✅ 请求 ${index + 1} 完成 (${elapsed}s): ${result.impact} (置信度: ${result.confidence.toFixed(2)})`);
        return { index: index + 1, success: true, result, elapsed };
      })
      .catch(error => {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`❌ 请求 ${index + 1} 失败 (${elapsed}s): ${error.message}`);
        return { index: index + 1, success: false, error: error.message, elapsed };
      });
  });
  
  // 等待所有请求完成
  const results = await Promise.all(promises);
  
  const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
  
  console.log('\n📈 测试结果统计:');
  console.log(`总耗时: ${totalTime}秒`);
  console.log(`成功: ${results.filter(r => r.success).length}/${results.length}`);
  console.log(`失败: ${results.filter(r => !r.success).length}/${results.length}`);
  
  // 验证请求间隔
  console.log('\n⏱️  请求时间分析:');
  results.forEach((r, i) => {
    if (i > 0) {
      const prevElapsed = parseFloat(results[i - 1].elapsed);
      const currElapsed = parseFloat(r.elapsed);
      const interval = (currElapsed - prevElapsed).toFixed(2);
      console.log(`请求 ${r.index} 与前一个请求间隔: ${interval}秒`);
    }
  });
  
  // 检查缓存
  console.log('\n💾 缓存统计:');
  const cacheStats = service.getCacheStats();
  console.log(`缓存条目数: ${cacheStats.size}`);
  
  console.log('\n✨ 测试完成！');
}

// 运行测试
testRateLimiting().catch(error => {
  console.error('测试失败:', error);
  process.exit(1);
});
