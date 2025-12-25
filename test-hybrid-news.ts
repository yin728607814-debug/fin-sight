/**
 * 测试混合新闻源策略
 * 验证：新浪财经 + 东方财富 + Finnhub混合获取
 */

import { NewsService } from './services/newsService';

async function testHybridNewsStrategy() {
  console.log('🧪 开始测试混合新闻源策略\n');
  console.log('='.repeat(60));
  
  const newsService = new NewsService();
  
  try {
    console.log('\n📡 测试1: 获取纳斯达克新闻（混合策略）');
    console.log('-'.repeat(60));
    
    const startTime = Date.now();
    const news = await newsService.fetchMarketNews('nasdaq', 50);
    const duration = Date.now() - startTime;
    
    console.log(`\n✅ 获取成功！耗时: ${duration}ms`);
    console.log(`📊 新闻总数: ${news.length}条\n`);
    
    // 统计来源分布
    const sourceStats = news.reduce((acc, item) => {
      acc[item.source] = (acc[item.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('📈 来源分布:');
    Object.entries(sourceStats).forEach(([source, count]) => {
      console.log(`   ${source}: ${count}条`);
    });
    
    // 统计相关性评分
    const scores = news.map(n => n.relevanceScore);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const minScore = Math.min(...scores);
    const maxScore = Math.max(...scores);
    
    console.log('\n📊 相关性评分统计:');
    console.log(`   平均分: ${(avgScore * 100).toFixed(1)}分`);
    console.log(`   最低分: ${(minScore * 100).toFixed(1)}分`);
    console.log(`   最高分: ${(maxScore * 100).toFixed(1)}分`);
    
    // 显示前5条新闻
    console.log('\n📰 前5条新闻预览:');
    console.log('-'.repeat(60));
    news.slice(0, 5).forEach((item, index) => {
      console.log(`\n${index + 1}. ${item.title}`);
      console.log(`   来源: ${item.source}`);
      console.log(`   相关性: ${(item.relevanceScore * 100).toFixed(1)}分`);
      console.log(`   URL: ${item.url.substring(0, 80)}...`);
      console.log(`   内容: ${item.content.substring(0, 100)}...`);
    });
    
    // 验证相关性
    console.log('\n🔍 相关性验证:');
    console.log('-'.repeat(60));
    
    const highRelevance = news.filter(n => n.relevanceScore >= 0.6).length;
    const mediumRelevance = news.filter(n => n.relevanceScore >= 0.4 && n.relevanceScore < 0.6).length;
    const lowRelevance = news.filter(n => n.relevanceScore < 0.4).length;
    
    console.log(`   高相关性 (≥60分): ${highRelevance}条 (${(highRelevance/news.length*100).toFixed(1)}%)`);
    console.log(`   中相关性 (40-60分): ${mediumRelevance}条 (${(mediumRelevance/news.length*100).toFixed(1)}%)`);
    console.log(`   低相关性 (<40分): ${lowRelevance}条 (${(lowRelevance/news.length*100).toFixed(1)}%)`);
    
    // 关键词检查
    console.log('\n🔑 关键词覆盖检查:');
    console.log('-'.repeat(60));
    
    const keywords = {
      '纳斯达克/NASDAQ': ['纳斯达克', 'nasdaq', '纳指'],
      '美股/科技股': ['美股', '科技股'],
      '主要公司': ['苹果', '微软', '谷歌', '亚马逊', '特斯拉', '英伟达', 
                   'apple', 'microsoft', 'google', 'amazon', 'tesla', 'nvidia'],
      '股票代码': ['aapl', 'msft', 'googl', 'amzn', 'tsla', 'nvda']
    };
    
    Object.entries(keywords).forEach(([category, words]) => {
      const count = news.filter(n => {
        const text = (n.title + ' ' + n.content).toLowerCase();
        return words.some(w => text.includes(w.toLowerCase()));
      }).length;
      console.log(`   ${category}: ${count}条 (${(count/news.length*100).toFixed(1)}%)`);
    });
    
    // 测试结果评估
    console.log('\n' + '='.repeat(60));
    console.log('📋 测试结果评估:');
    console.log('='.repeat(60));
    
    const passed = [];
    const failed = [];
    
    // 检查1: 数量是否达标
    if (news.length >= 50) {
      passed.push('✅ 新闻数量达标 (≥50条)');
    } else {
      failed.push(`❌ 新闻数量不足 (${news.length}/50)`);
    }
    
    // 检查2: 平均相关性
    if (avgScore >= 0.5) {
      passed.push(`✅ 平均相关性良好 (${(avgScore * 100).toFixed(1)}分)`);
    } else {
      failed.push(`❌ 平均相关性偏低 (${(avgScore * 100).toFixed(1)}分)`);
    }
    
    // 检查3: 高相关性占比
    const highRatio = highRelevance / news.length;
    if (highRatio >= 0.3) {
      passed.push(`✅ 高相关性占比合格 (${(highRatio * 100).toFixed(1)}%)`);
    } else {
      failed.push(`❌ 高相关性占比不足 (${(highRatio * 100).toFixed(1)}%)`);
    }
    
    // 检查4: 来源多样性
    if (Object.keys(sourceStats).length >= 2) {
      passed.push(`✅ 来源多样性良好 (${Object.keys(sourceStats).length}个来源)`);
    } else {
      failed.push(`❌ 来源单一 (${Object.keys(sourceStats).length}个来源)`);
    }
    
    // 检查5: 关键词覆盖
    const nasdaqKeywordCount = news.filter(n => {
      const text = (n.title + ' ' + n.content).toLowerCase();
      return keywords['纳斯达克/NASDAQ'].some(w => text.includes(w.toLowerCase()));
    }).length;
    
    if (nasdaqKeywordCount >= 10) {
      passed.push(`✅ 纳斯达克关键词覆盖充足 (${nasdaqKeywordCount}条)`);
    } else {
      failed.push(`❌ 纳斯达克关键词覆盖不足 (${nasdaqKeywordCount}条)`);
    }
    
    console.log('\n通过的检查:');
    passed.forEach(p => console.log(`  ${p}`));
    
    if (failed.length > 0) {
      console.log('\n未通过的检查:');
      failed.forEach(f => console.log(`  ${f}`));
    }
    
    console.log('\n' + '='.repeat(60));
    if (failed.length === 0) {
      console.log('🎉 所有测试通过！混合策略工作正常！');
    } else {
      console.log(`⚠️ ${failed.length}项测试未通过，需要优化`);
    }
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error);
    console.error('错误详情:', error instanceof Error ? error.message : error);
  }
}

// 运行测试
testHybridNewsStrategy().catch(console.error);
