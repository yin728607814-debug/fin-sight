/**
 * 测试A股新闻获取
 * 使用方法: node scripts/test-astock-news.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testAStockNews(limit) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`测试获取 ${limit} 条A股新闻`);
  console.log('='.repeat(60));
  
  const startTime = Date.now();
  
  try {
    const response = await axios.get(`${BASE_URL}/api/news`, {
      params: {
        assetType: 'astock',
        limit: limit
      },
      timeout: 120000 // 2分钟超时
    });
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    if (response.data && Array.isArray(response.data)) {
      console.log(`✅ 成功获取 ${response.data.length} 条新闻`);
      console.log(`⏱️  耗时: ${duration}秒`);
      
      // 统计来源
      const sources = {};
      response.data.forEach(item => {
        sources[item.source] = (sources[item.source] || 0) + 1;
      });
      
      console.log('\n📊 新闻来源统计:');
      Object.entries(sources).forEach(([source, count]) => {
        console.log(`   ${source}: ${count}条`);
      });
      
      // 显示前5条新闻标题
      console.log('\n📰 前5条新闻标题:');
      response.data.slice(0, 5).forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.title}`);
        console.log(`      来源: ${item.source} | 相关性: ${(item.relevanceScore * 100).toFixed(0)}分`);
      });
      
      return true;
    } else {
      console.log('❌ 返回数据格式错误');
      return false;
    }
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`❌ 请求失败 (耗时: ${duration}秒)`);
    console.log(`错误: ${error.message}`);
    if (error.response) {
      console.log(`状态码: ${error.response.status}`);
      console.log(`响应: ${JSON.stringify(error.response.data)}`);
    }
    return false;
  }
}

async function runTests() {
  console.log('🚀 开始测试A股新闻获取功能');
  console.log(`📡 服务器地址: ${BASE_URL}`);
  
  const tests = [
    { limit: 50, name: '小量测试' },
    { limit: 100, name: '中量测试' },
    { limit: 200, name: '大量测试' }
  ];
  
  let successCount = 0;
  
  for (const test of tests) {
    const success = await testAStockNews(test.limit);
    if (success) successCount++;
    await new Promise(resolve => setTimeout(resolve, 2000)); // 等待2秒
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`测试完成: ${successCount}/${tests.length} 通过`);
  console.log('='.repeat(60));
}

runTests().catch(console.error);
