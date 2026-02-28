/**
 * 测试新浪新闻获取速度
 * 使用方法：node scripts/test-sina-news.js
 */

import axios from 'axios';

// 配置你的部署URL
const BASE_URL = 'http://localhost:3001'; // 本地测试服务器
// const BASE_URL = 'https://your-app.pages.dev'; // 生产环境测试

async function testSinaNews(num) {
  console.log(`\n📰 测试获取 ${num} 条新闻...`);
  const startTime = Date.now();
  
  try {
    const response = await axios.get(`${BASE_URL}/sina-news-proxy`, {
      params: {
        category: 'finance',
        num: num
      },
      timeout: 60000 // 60秒超时
    });
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    if (response.data.status === 'ok') {
      console.log(`✅ 成功获取 ${response.data.articles.length} 条新闻`);
      console.log(`⏱️  耗时: ${duration} 秒`);
      console.log(`📊 平均速度: ${(response.data.articles.length / duration).toFixed(1)} 条/秒`);
      
      // 显示前3条新闻标题
      console.log('\n前3条新闻:');
      response.data.articles.slice(0, 3).forEach((article, index) => {
        console.log(`  ${index + 1}. ${article.title}`);
      });
      
      return true;
    } else {
      console.log(`❌ 失败: ${response.data.message}`);
      return false;
    }
  } catch (error) {
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    if (error.code === 'ECONNABORTED') {
      console.log(`❌ 超时 (${duration} 秒)`);
    } else if (error.code === 'ECONNREFUSED') {
      console.log(`❌ 连接被拒绝 - 请确保服务器正在运行`);
    } else {
      console.log(`❌ 错误: ${error.message}`);
    }
    return false;
  }
}

async function runTests() {
  console.log('🚀 开始测试新浪新闻获取速度\n');
  console.log(`📍 测试地址: ${BASE_URL}/sina-news-proxy\n`);
  console.log('=' .repeat(60));
  
  // 测试不同数量的新闻
  const testCases = [50, 100, 200, 500];
  const results = [];
  
  for (const num of testCases) {
    const success = await testSinaNews(num);
    results.push({ num, success });
    
    // 等待1秒再进行下一个测试
    if (num !== testCases[testCases.length - 1]) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 测试总结:');
  results.forEach(({ num, success }) => {
    console.log(`  ${num} 条: ${success ? '✅ 成功' : '❌ 失败'}`);
  });
  
  const successCount = results.filter(r => r.success).length;
  console.log(`\n总计: ${successCount}/${results.length} 个测试通过`);
}

// 运行测试
runTests().catch(error => {
  console.error('测试失败:', error);
  process.exit(1);
});
