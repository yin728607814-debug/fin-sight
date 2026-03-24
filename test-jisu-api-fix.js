#!/usr/bin/env node

/**
 * 测试和修复极速数据API
 */

import axios from 'axios';

async function testJisuAPI() {
  console.log('🔧 测试极速数据API修复');
  
  const baseURL = 'https://fin-sight.top';
  
  try {
    console.log('\n📡 测试1: 纳斯达克新闻 - 极速数据');
    
    const nasdaqResponse = await axios.get(`${baseURL}/jisu-news-proxy`, {
      params: { 
        category: '股票',
        num: 30,
        type: 'nasdaq'
      },
      timeout: 15000
    });
    
    console.log('✅ 纳斯达克新闻响应:', {
      status: nasdaqResponse.status,
      articlesCount: nasdaqResponse.data?.articles?.length || 0,
      error: nasdaqResponse.data?.debug?.error || 'none'
    });
    
    if (nasdaqResponse.data?.articles?.length > 0) {
      console.log('📰 前3条纳斯达克新闻:');
      nasdaqResponse.data.articles.slice(0, 3).forEach((article, index) => {
        console.log(`  ${index + 1}. ${article.title}`);
        console.log(`     来源: ${article.source?.name || article.author}`);
        console.log(`     链接: ${article.url}`);
      });
    }
    
    console.log('\n📡 测试2: 黄金新闻 - 极速数据');
    
    const goldResponse = await axios.get(`${baseURL}/jisu-news-proxy`, {
      params: { 
        category: '财经',
        num: 30,
        type: 'gold'
      },
      timeout: 15000
    });
    
    console.log('✅ 黄金新闻响应:', {
      status: goldResponse.status,
      articlesCount: goldResponse.data?.articles?.length || 0,
      error: goldResponse.data?.debug?.error || 'none'
    });
    
    if (goldResponse.data?.articles?.length > 0) {
      console.log('📰 前3条黄金新闻:');
      goldResponse.data.articles.slice(0, 3).forEach((article, index) => {
        console.log(`  ${index + 1}. ${article.title}`);
        console.log(`     来源: ${article.source?.name || article.author}`);
        console.log(`     链接: ${article.url}`);
      });
    }
    
    console.log('\n🎯 分析结果:');
    
    const nasdaqCount = nasdaqResponse.data?.articles?.length || 0;
    const goldCount = goldResponse.data?.articles?.length || 0;
    
    if (nasdaqCount === 0 && goldCount === 0) {
      console.log('❌ 极速数据API完全无法获取新闻');
      console.log('💡 建议: 需要添加备用中文新闻数据');
    } else if (nasdaqCount > 0 || goldCount > 0) {
      console.log('✅ 极速数据API部分可用');
      console.log(`📊 纳斯达克: ${nasdaqCount}条, 黄金: ${goldCount}条`);
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

testJisuAPI().catch(console.error);