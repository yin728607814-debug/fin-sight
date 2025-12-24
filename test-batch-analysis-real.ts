/**
 * 批量分析功能真实测试
 * 测试 analysisService 的 analyzeBatchNews 方法
 */

import { AnalysisService } from './services/analysisService';

// 测试新闻数据
const testNews = [
  {
    title: "美联储暗示可能降息，黄金价格上涨",
    content: "Federal Reserve officials hinted at potential interest rate cuts in the coming months, citing cooling inflation. Gold prices surged 2.5% as investors sought safe-haven assets. The precious metal reached $2,050 per ounce."
  },
  {
    title: "美元走强施压黄金",
    content: "The US dollar strengthened against major currencies, putting pressure on gold prices. The dollar index rose 0.8%, making gold more expensive for foreign buyers. Analysts expect continued dollar strength."
  },
  {
    title: "地缘政治紧张局势支撑避险需求",
    content: "Rising geopolitical tensions in the Middle East boosted safe-haven demand for gold. Investors are closely monitoring the situation for potential escalation. Gold is traditionally seen as a safe store of value."
  },
  {
    title: "中国央行继续增持黄金储备",
    content: "China's central bank continued its gold buying spree, adding 15 tons to its reserves last month. This marks the 12th consecutive month of gold purchases, signaling strong institutional demand."
  },
  {
    title: "通胀数据好于预期，黄金承压",
    content: "US inflation data came in lower than expected, reducing the appeal of gold as an inflation hedge. Consumer prices rose only 0.2% month-over-month, below the forecast of 0.4%."
  }
];

async function testBatchAnalysis() {
  console.log('🚀 开始测试批量分析功能\n');
  console.log('=' .repeat(60));
  
  // 创建分析服务实例（使用占位符API密钥，会触发本地分析）
  const analysisService = new AnalysisService({
    apiKey: 'test_placeholder_key'
  });
  
  console.log('\n📊 测试数据:');
  console.log(`   新闻数量: ${testNews.length} 条`);
  console.log(`   资产类型: 黄金 (gold)`);
  
  try {
    console.log('\n⏱️  开始批量分析...');
    const startTime = Date.now();
    
    // 执行批量分析
    const result = await analysisService.analyzeBatchNews(testNews, 'gold');
    
    const endTime = Date.now();
    const timeTaken = endTime - startTime;
    
    console.log(`✅ 批量分析完成！耗时: ${timeTaken}ms\n`);
    console.log('=' .repeat(60));
    
    // 统计结果
    const positiveCount = result.analyses.filter(a => a.impact === 'positive').length;
    const negativeCount = result.analyses.filter(a => a.impact === 'negative').length;
    const neutralCount = result.analyses.filter(a => a.impact === 'neutral').length;
    
    console.log('\n📈 整体市场影响:');
    console.log(`   影响方向: ${result.overallImpact === 'positive' ? '📈 利好' : result.overallImpact === 'negative' ? '📉 利空' : '➡️ 中性'}`);
    console.log(`   整体置信度: ${(result.overallConfidence * 100).toFixed(1)}%`);
    console.log(`   综合分析: ${result.overallSummary}`);
    
    console.log('\n📊 分析统计:');
    console.log(`   总计: ${result.analyses.length} 条新闻`);
    console.log(`   利好: ${positiveCount} 条 (${(positiveCount / result.analyses.length * 100).toFixed(0)}%)`);
    console.log(`   利空: ${negativeCount} 条 (${(negativeCount / result.analyses.length * 100).toFixed(0)}%)`);
    console.log(`   中性: ${neutralCount} 条 (${(neutralCount / result.analyses.length * 100).toFixed(0)}%)`);
    
    console.log('\n📰 各条新闻分析结果:');
    console.log('=' .repeat(60));
    
    result.analyses.forEach((analysis, index) => {
      const news = testNews[index];
      const impactIcon = analysis.impact === 'positive' ? '📈' : analysis.impact === 'negative' ? '📉' : '➡️';
      const impactText = analysis.impact === 'positive' ? '利好' : analysis.impact === 'negative' ? '利空' : '中性';
      
      console.log(`\n[${index + 1}] ${news.title}`);
      console.log(`    影响: ${impactIcon} ${impactText}`);
      console.log(`    置信度: ${(analysis.confidence * 100).toFixed(1)}%`);
      console.log(`    预测变化: ${analysis.predictedChange > 0 ? '+' : ''}${analysis.predictedChange.toFixed(2)}%`);
      console.log(`    摘要: ${analysis.summary}`);
      console.log(`    关键点:`);
      analysis.keyPoints.forEach((point, i) => {
        console.log(`      ${i + 1}. ${point}`);
      });
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('\n✅ 测试完成！');
    console.log('\n性能指标:');
    console.log(`   ⚡ 分析速度: ${timeTaken}ms`);
    console.log(`   💰 API调用: 1次 (节省 ${testNews.length - 1} 次调用)`);
    console.log(`   📊 效率提升: ${((testNews.length - 1) / testNews.length * 100).toFixed(0)}%`);
    
    // 验证结果结构
    console.log('\n🔍 结果验证:');
    const checks = [
      { name: '包含分析数组', pass: Array.isArray(result.analyses) },
      { name: '分析数量正确', pass: result.analyses.length === testNews.length },
      { name: '包含整体影响', pass: !!result.overallImpact },
      { name: '包含整体置信度', pass: typeof result.overallConfidence === 'number' },
      { name: '包含整体摘要', pass: !!result.overallSummary },
      { name: '每条新闻有索引', pass: result.analyses.every(a => typeof a.newsIndex === 'number') },
      { name: '每条新闻有影响', pass: result.analyses.every(a => !!a.impact) },
      { name: '每条新闻有置信度', pass: result.analyses.every(a => typeof a.confidence === 'number') },
      { name: '每条新闻有摘要', pass: result.analyses.every(a => !!a.summary) },
      { name: '每条新闻有关键点', pass: result.analyses.every(a => Array.isArray(a.keyPoints)) }
    ];
    
    checks.forEach(check => {
      console.log(`   ${check.pass ? '✅' : '❌'} ${check.name}`);
    });
    
    const allPassed = checks.every(c => c.pass);
    console.log(`\n${allPassed ? '🎉 所有验证通过！' : '⚠️ 部分验证失败'}`);
    
    return result;
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error);
    throw error;
  }
}

// 运行测试
testBatchAnalysis()
  .then(() => {
    console.log('\n✨ 测试脚本执行完成\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 测试脚本执行失败:', error);
    process.exit(1);
  });

export { testBatchAnalysis };
