/**
 * 测试50条新闻的批量分析
 */

import { AnalysisService } from './services/analysisService';

// 生成50条测试新闻
function generate50News() {
  const templates = [
    { title: "美联储暗示降息", content: "Federal Reserve hints at rate cuts, gold surges." },
    { title: "美元走强", content: "Dollar strengthens, putting pressure on gold prices." },
    { title: "地缘政治紧张", content: "Geopolitical tensions boost safe-haven demand." },
    { title: "央行增持黄金", content: "Central banks continue gold buying spree." },
    { title: "通胀数据公布", content: "Inflation data impacts gold market sentiment." },
    { title: "科技股上涨", content: "Tech stocks rally on strong earnings." },
    { title: "经济数据好于预期", content: "Economic data beats expectations." },
    { title: "市场波动加剧", content: "Market volatility increases uncertainty." },
    { title: "投资者情绪转变", content: "Investor sentiment shifts amid uncertainty." },
    { title: "贸易谈判进展", content: "Trade negotiations show progress." }
  ];
  
  const news = [];
  for (let i = 0; i < 50; i++) {
    const template = templates[i % templates.length];
    news.push({
      title: `${template.title} (${i + 1})`,
      content: `${template.content} News item ${i + 1} with additional context.`
    });
  }
  
  return news;
}

async function test50News() {
  console.log('🚀 测试50条新闻批量分析\n');
  console.log('='.repeat(60));
  
  const analysisService = new AnalysisService({
    apiKey: 'test_placeholder_key'
  });
  
  const news = generate50News();
  console.log(`\n📊 生成了 ${news.length} 条测试新闻`);
  
  try {
    console.log('\n⏱️  开始批量分析...');
    const startTime = Date.now();
    
    const result = await analysisService.analyzeBatchNews(news, 'gold');
    
    const endTime = Date.now();
    const timeTaken = endTime - startTime;
    
    console.log(`✅ 批量分析完成！耗时: ${timeTaken}ms\n`);
    console.log('='.repeat(60));
    
    // 统计
    const positiveCount = result.analyses.filter(a => a.impact === 'positive').length;
    const negativeCount = result.analyses.filter(a => a.impact === 'negative').length;
    const neutralCount = result.analyses.filter(a => a.impact === 'neutral').length;
    
    console.log('\n📊 分析统计:');
    console.log(`   总计: ${result.analyses.length} 条`);
    console.log(`   利好: ${positiveCount} 条 (${(positiveCount / result.analyses.length * 100).toFixed(0)}%)`);
    console.log(`   利空: ${negativeCount} 条 (${(negativeCount / result.analyses.length * 100).toFixed(0)}%)`);
    console.log(`   中性: ${neutralCount} 条 (${(neutralCount / result.analyses.length * 100).toFixed(0)}%)`);
    
    console.log('\n📈 整体影响:');
    console.log(`   方向: ${result.overallImpact}`);
    console.log(`   置信度: ${(result.overallConfidence * 100).toFixed(1)}%`);
    console.log(`   摘要: ${result.overallSummary}`);
    
    console.log('\n⚡ 性能指标:');
    console.log(`   分析速度: ${timeTaken}ms`);
    console.log(`   API调用: 1次`);
    console.log(`   节省调用: ${news.length - 1}次`);
    console.log(`   效率提升: ${((news.length - 1) / news.length * 100).toFixed(1)}%`);
    
    console.log('\n🔍 前5条新闻分析示例:');
    result.analyses.slice(0, 5).forEach((analysis, index) => {
      console.log(`\n[${index + 1}] ${news[index].title}`);
      console.log(`    影响: ${analysis.impact} | 置信度: ${(analysis.confidence * 100).toFixed(0)}% | 变化: ${analysis.predictedChange > 0 ? '+' : ''}${analysis.predictedChange.toFixed(2)}%`);
    });
    
    console.log('\n✅ 测试成功！50条新闻批量分析正常工作');
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error);
    throw error;
  }
}

test50News()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
