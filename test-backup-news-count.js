#!/usr/bin/env node

/**
 * 测试备用新闻数量和质量
 */

import axios from 'axios';

async function testBackupNewsCount() {
  console.log('🔧 测试备用新闻数量和质量');
  
  const baseURL = 'https://fin-sight.top';
  
  try {
    // 测试不同数量的请求
    const testCases = [
      { type: 'nasdaq', num: 10, name: '纳斯达克10条' },
      { type: 'nasdaq', num: 30, name: '纳斯达克30条' },
      { type: 'nasdaq', num: 50, name: '纳斯达克50条' },
      { type: 'gold', num: 10, name: '黄金10条' },
      { type: 'gold', num: 30, name: '黄金30条' },
      { type: 'gold', num: 50, name: '黄金50条' },
    ];
    
    for (const testCase of testCases) {
      console.log(`\n📡 测试: ${testCase.name}`);
      
      const response = await axios.get(`${baseURL}/jisu-news-proxy`, {
        params: { 
          category: testCase.type === 'gold' ? '财经' : '股票',
          num: testCase.num,
          type: testCase.type,
          _t: Date.now()
        },
        timeout: 15000
      });
      
      const articlesCount = response.data?.articles?.length || 0;
      const isTestData = response.data?.debug?.isTestData || false;
      
      console.log(`📊 结果: ${articlesCount}条 (请求${testCase.num}条)`);
      console.log(`📰 是否备用数据: ${isTestData ? '是' : '否'}`);
      
      if (articlesCount > 0) {
        console.log('📰 新闻标题示例:');
        response.data.articles.slice(0, 3).forEach((article, index) => {
          console.log(`  ${index + 1}. ${article.title.substring(0, 40)}...`);
        });
      }
      
      // 检查是否达到预期数量
      if (articlesCount < Math.min(testCase.num, 30)) {
        console.log(`⚠️ 警告: 新闻数量不足，期望至少${Math.min(testCase.num, 30)}条`);
      } else {
        console.log(`✅ 数量充足`);
      }
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

testBackupNewsCount().catch(console.error);