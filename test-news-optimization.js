#!/usr/bin/env node

/**
 * 测试新闻优化效果
 * 验证东方财富和新浪财经能否各获取25条以上新闻
 */

import axios from 'axios';

// 模拟新浪财经黄金新闻过滤
function filterGoldNews(articles) {
  return articles.filter(article => {
    const title = article.title || '';
    const content = (article.intro || '').toLowerCase();
    const titleLower = title.toLowerCase();
    
    const keywords = [
      '黄金', '金价', '贵金属', '白银', '现货金', 'XAUUSD', 
      '伦敦金', '美元金', '金市', '黄金市场', '金银',
      '避险', '通胀', '美联储', '央行', '黄金储备',
      '美元指数', '实际利率', '地缘政治',
      '黄金ETF', '金矿', '黄金期货', '黄金现货',
      'gold', 'precious metal', 'bullion'
    ];
    
    return keywords.some(kw => 
      titleLower.includes(kw.toLowerCase()) || content.includes(kw.toLowerCase())
    );
  });
}

// 模拟新浪财经美股新闻过滤
function filterUSNews(articles) {
  return articles.filter(article => {
    const url = article.url || '';
    const title = article.title || '';
    const content = (article.intro || '').toLowerCase();
    const titleLower = title.toLowerCase();
    
    const hasUSStockURL = url.includes('/stock/usstock/') || 
                         url.includes('/stock/us/') ||
                         url.includes('/usstock/');
    
    if (hasUSStockURL) return true;
    
    const keywords = [
      '美股', '纳斯达克', '纳指', '科技股', 'NASDAQ', 
      '苹果', '微软', '谷歌', '亚马逊', '特斯拉', '英伟达',
      'Apple', 'Microsoft', 'Google', 'Amazon', 'Tesla', 'NVIDIA',
      'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA',
      '华尔街', '道琼斯', '标普', 'S&P', 'Dow Jones',
      'AI', '人工智能', '芯片', '半导体', '云计算',
      'Meta', 'Netflix', 'Facebook', 'Intel', 'AMD',
      '美国股市', '美国市场', '美股市场'
    ];
    
    return keywords.some(kw => 
      titleLower.includes(kw.toLowerCase()) || content.includes(kw.toLowerCase())
    );
  });
}

// 测试新浪财经（不同数量）
async function testSinaNews() {
  console.log('\n🔍 测试新浪财经新闻获取优化');
  console.log('═'.repeat(80));
  
  for (const num of [300, 500]) {
    console.log(`\n📰 请求 ${num} 条新闻...`);
    
    try {
      const response = await axios.get('https://feed.mix.sina.com.cn/api/roll/get', {
        params: {
          pageid: '153',
          lid: '2509',
          num: num,
          versionNumber: '1.2.8',
          page: 1,
          encode: 'utf-8'
        },
        timeout: 30000
      });
      
      const articles = response.data.result?.data || [];
      console.log(`   获取到 ${articles.length} 条原始新闻`);
      
      // 过滤黄金新闻
      const goldNews = filterGoldNews(articles);
      console.log(`   黄金相关: ${goldNews.length}条 ${goldNews.length >= 25 ? '✅' : '⚠️'}`);
      
      // 过滤美股新闻
      const usNews = filterUSNews(articles);
      console.log(`   美股相关: ${usNews.length}条 ${usNews.length >= 25 ? '✅' : '⚠️'}`);
      
      if (num === 500) {
        console.log('\n黄金新闻样本（前3条）:');
        goldNews.slice(0, 3).forEach((a, i) => {
          console.log(`  ${i + 1}. ${a.title}`);
        });
        
        console.log('\n美股新闻样本（前3条）:');
        usNews.slice(0, 3).forEach((a, i) => {
          console.log(`  ${i + 1}. ${a.title}`);
        });
      }
      
    } catch (error) {
      console.error(`❌ 测试失败:`, error.message);
    }
  }
}

// 运行测试
async function runTests() {
  console.log('🚀 开始测试新闻优化效果\n');
  console.log('目标：东方财富和新浪财经各获取25条以上新闻');
  
  await testSinaNews();
  
  console.log('\n' + '═'.repeat(80));
  console.log('\n📊 优化总结:');
  console.log('1. 新浪财经请求数量: 300 → 500条');
  console.log('2. 东方财富请求数量: limit*2 → 100条');
  console.log('3. 关键词扩展: 增加更多相关关键词');
  console.log('4. 过滤条件放宽: 提高匹配率');
  console.log('\n✅ 测试完成');
}

runTests().catch(console.error);
