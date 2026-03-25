#!/usr/bin/env node

/**
 * 测试东方财富和新浪财经的新闻覆盖情况
 */

import axios from 'axios';

async function testCoverage() {
  console.log('🔍 测试东方财富和新浪财经新闻覆盖\n');
  console.log('═'.repeat(80));
  
  const baseURL = 'https://fin-sight.top';
  
  const tests = [
    { name: '纳斯达克', type: 'nasdaq', target: 30 },
    { name: '黄金', type: 'gold', target: 30 },
    { name: 'A股', type: 'astock', target: 30 }
  ];
  
  for (const test of tests) {
    console.log(`\n📊 ${test.name}页面`);
    console.log(`   目标: ${test.target}条新闻`);
    console.log('─'.repeat(80));
    
    try {
      // 模拟前端请求
      const response = await axios.get(`${baseURL}/api/news`, {
        params: {
          type: test.type,
          limit: 50
        },
        timeout: 30000
      });
      
      const articles = response.data?.articles || [];
      console.log(`✅ 获取到 ${articles.length} 条新闻`);
      
      if (articles.length >= test.target) {
        console.log(`✅ 达标！(${articles.length}/${test.target})`);
      } else {
        console.log(`⚠️ 不足！(${articles.length}/${test.target}) 缺少 ${test.target - articles.length} 条`);
      }
      
      // 统计新闻来源
      const sources = {};
      articles.forEach(article => {
        const source = article.source || '未知';
        sources[source] = (sources[source] || 0) + 1;
      });
      
      console.log(`\n   新闻来源分布:`);
      Object.entries(sources).forEach(([source, count]) => {
        console.log(`   - ${source}: ${count}条`);
      });
      
      // 显示前3条新闻
      if (articles.length > 0) {
        console.log(`\n   前3条新闻:`);
        articles.slice(0, 3).forEach((article, index) => {
          console.log(`   ${index + 1}. ${article.title}`);
          console.log(`      来源: ${article.source}`);
        });
      }
      
    } catch (error) {
      console.error(`❌ 请求失败:`, error.message);
    }
  }
  
  console.log('\n' + '═'.repeat(80));
  console.log('测试完成');
}

testCoverage().catch(console.error);
