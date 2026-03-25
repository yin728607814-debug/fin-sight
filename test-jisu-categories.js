#!/usr/bin/env node

/**
 * 测试极速数据不同频道的新闻数量和相关性
 */

import axios from 'axios';

async function testCategories() {
  const apiKey = '5fb0e1d5106b8fc0';
  
  console.log('🔍 测试极速数据各频道新闻\n');
  console.log('目标: 每个页面至少30条相关新闻\n');
  console.log('═'.repeat(80));
  
  const tests = [
    { 
      name: '纳斯达克页面', 
      category: '股票', 
      keywords: ['美股', '纳斯达克', '科技股', '苹果', '微软', '谷歌', '特斯拉', '英伟达'],
      target: 30
    },
    { 
      name: '黄金页面', 
      category: '财经', 
      keywords: ['黄金', '金价', '贵金属', '白银', '避险'],
      target: 30
    },
    { 
      name: 'A股页面', 
      category: '股票', 
      keywords: ['A股', '上证', '深证', '创业板', '科创板', '沪指', '深指'],
      target: 30
    }
  ];
  
  for (const test of tests) {
    console.log(`\n📊 ${test.name}`);
    console.log(`   频道: ${test.category}`);
    console.log(`   目标: ${test.target}条相关新闻`);
    console.log('─'.repeat(80));
    
    try {
      // 请求50条新闻
      const response = await axios.get('https://api.jisuapi.com/news/get', {
        params: {
          appkey: apiKey,
          channel: test.category,
          num: 50
        },
        timeout: 10000
      });
      
      if (response.data.status === 0) {
        const allArticles = response.data.result?.list || [];
        console.log(`✅ 获取到 ${allArticles.length} 条新闻`);
        
        // 过滤相关新闻
        const relevantArticles = allArticles.filter(article => {
          const title = (article.title || '').toLowerCase();
          const content = (article.content || '').toLowerCase();
          
          return test.keywords.some(keyword => 
            title.includes(keyword.toLowerCase()) || 
            content.includes(keyword.toLowerCase())
          );
        });
        
        console.log(`🎯 相关新闻: ${relevantArticles.length} 条`);
        
        if (relevantArticles.length >= test.target) {
          console.log(`✅ 达标！(${relevantArticles.length}/${test.target})`);
        } else {
          console.log(`⚠️ 不足！(${relevantArticles.length}/${test.target}) 缺少 ${test.target - relevantArticles.length} 条`);
        }
        
        // 显示前5条相关新闻
        if (relevantArticles.length > 0) {
          console.log(`\n   前5条相关新闻:`);
          relevantArticles.slice(0, 5).forEach((article, index) => {
            console.log(`   ${index + 1}. ${article.title}`);
            console.log(`      来源: ${article.src} | 链接: ${article.weburl.substring(0, 60)}...`);
          });
        }
        
        // 显示不相关新闻的标题（帮助分析）
        const irrelevantArticles = allArticles.filter(article => {
          const title = (article.title || '').toLowerCase();
          const content = (article.content || '').toLowerCase();
          
          return !test.keywords.some(keyword => 
            title.includes(keyword.toLowerCase()) || 
            content.includes(keyword.toLowerCase())
          );
        });
        
        if (irrelevantArticles.length > 0) {
          console.log(`\n   ⚠️ 不相关新闻示例 (${irrelevantArticles.length}条):`);
          irrelevantArticles.slice(0, 3).forEach((article, index) => {
            console.log(`   ${index + 1}. ${article.title}`);
          });
        }
        
      } else {
        console.log(`❌ API返回错误: ${response.data.msg}`);
      }
      
    } catch (error) {
      console.error(`❌ 请求失败:`, error.message);
    }
  }
  
  console.log('\n' + '═'.repeat(80));
  console.log('测试完成');
}

testCategories().catch(console.error);
