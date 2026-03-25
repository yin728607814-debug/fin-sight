#!/usr/bin/env node

/**
 * 测试极速数据真实新闻（使用频道接口）
 */

import axios from 'axios';

async function testRealNews() {
  const apiKey = '5fb0e1d5106b8fc0';
  
  console.log('🔍 测试极速数据真实新闻\n');
  
  const tests = [
    { name: '财经频道', category: '财经', num: 10 },
    { name: '股票频道', category: '股票', num: 10 }
  ];
  
  for (const test of tests) {
    console.log(`📡 测试: ${test.name}`);
    
    try {
      const response = await axios.get('https://api.jisuapi.com/news/get', {
        params: {
          appkey: apiKey,
          channel: test.category,
          num: test.num
        },
        timeout: 10000
      });
      
      if (response.data.status === 0) {
        const articles = response.data.result?.list || [];
        console.log(`✅ 成功获取 ${articles.length} 条新闻`);
        
        if (articles.length > 0) {
          console.log(`   示例新闻:`);
          articles.slice(0, 2).forEach((article, index) => {
            console.log(`   ${index + 1}. ${article.title}`);
            console.log(`      链接: ${article.weburl}`);
            console.log(`      来源: ${article.src}`);
          });
        }
      } else {
        console.log(`❌ API返回错误: ${response.data.msg}`);
      }
      
      console.log('');
    } catch (error) {
      console.error(`❌ 请求失败:`, error.message);
      console.log('');
    }
  }
}

testRealNews().catch(console.error);
