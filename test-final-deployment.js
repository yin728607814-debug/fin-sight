#!/usr/bin/env node

/**
 * 测试最终部署效果 - 验证所有新闻数量
 */

import axios from 'axios';

async function testFinalDeployment() {
  console.log('🎯 测试最终部署效果\n');
  
  const baseURL = 'https://fin-sight.top';
  const timestamp = Date.now();
  
  const tests = [
    { name: '纳斯达克', type: 'nasdaq', category: '股票', expected: 30 },
    { name: '黄金', type: 'gold', category: '财经', expected: 30 },
    { name: 'A股', type: 'astock', category: '股票', expected: 16 }
  ];
  
  const results = [];
  
  for (const test of tests) {
    try {
      console.log(`📡 测试 ${test.name} 新闻...`);
      
      const response = await axios.get(`${baseURL}/jisu-news-proxy`, {
        params: { 
          category: test.category,
          num: 50,
          type: test.type,
          _t: timestamp + Math.random() * 1000
        },
        timeout: 15000,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      const count = response.data?.articles?.length || 0;
      const isTestData = response.data?.debug?.isTestData || false;
      const status = count >= test.expected ? '✅' : '⚠️';
      
      results.push({
        name: test.name,
        count,
        expected: test.expected,
        status,
        isTestData
      });
      
      console.log(`${status} ${test.name}: ${count}条 (目标: ${test.expected}条)`);
      
      if (count > 0) {
        console.log(`   前2条新闻:`);
        response.data.articles.slice(0, 2).forEach((article, index) => {
          console.log(`   ${index + 1}. ${article.title}`);
        });
      }
      console.log('');
      
    } catch (error) {
      console.error(`❌ ${test.name} 测试失败:`, error.message);
      results.push({
        name: test.name,
        count: 0,
        expected: test.expected,
        status: '❌',
        error: error.message
      });
    }
  }
  
  // 汇总结果
  console.log('\n📊 测试结果汇总:');
  console.log('═'.repeat(60));
  console.log('类型\t\t实际数量\t目标数量\t状态');
  console.log('─'.repeat(60));
  
  results.forEach(result => {
    const tabs = result.name.length < 4 ? '\t\t' : '\t';
    console.log(`${result.name}${tabs}${result.count}条\t\t${result.expected}条\t\t${result.status}`);
  });
  
  console.log('═'.repeat(60));
  
  // 总体评估
  const allPassed = results.every(r => r.count >= r.expected);
  const totalCount = results.reduce((sum, r) => sum + r.count, 0);
  const totalExpected = results.reduce((sum, r) => sum + r.expected, 0);
  
  console.log(`\n总计: ${totalCount}条 / ${totalExpected}条`);
  
  if (allPassed) {
    console.log('\n🎉 所有测试通过！备用新闻数量充足！');
    console.log('✅ 纳斯达克: 充足');
    console.log('✅ 黄金: 充足');
    console.log('✅ A股: 充足');
  } else {
    console.log('\n⚠️ 部分测试未达标，可能需要进一步优化');
    results.forEach(r => {
      if (r.count < r.expected) {
        console.log(`⚠️ ${r.name}: ${r.count}/${r.expected}条`);
      }
    });
  }
}

testFinalDeployment().catch(console.error);
