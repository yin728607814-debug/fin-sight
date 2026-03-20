#!/usr/bin/env node

/**
 * 测试生产环境极速数据API修复
 */

import axios from 'axios';

async function testProductionFix() {
  console.log('🔧 测试生产环境极速数据API修复');
  
  const baseURL = 'https://fin-sight.top';
  
  try {
    console.log('\n📡 测试1: 纳斯达克分析 - 极速数据');
    console.log('URL: /jisu-news-proxy?category=股票&num=50&type=nasdaq');
    
    const nasdaqResponse = await axios.get(`${baseURL}/jisu-news-proxy`, {
      params: { 
        category: '股票',
        num: 50,
        type: 'nasdaq'
      },
      timeout: 15000
    });
    
    console.log('✅ 纳斯达克新闻响应:', {
      status: nasdaqResponse.status,
      articlesCount: nasdaqResponse.data?.articles?.length || 0,
      isTestData: nasdaqResponse.data?.debug?.isTestData || false,
      errorMessage: nasdaqResponse.data?.debug?.error || 'none'
    });
    
    if (nasdaqResponse.data?.articles?.length > 0) {
      console.log('📰 前3条纳斯达克新闻标题:');
      nasdaqResponse.data.articles.slice(0, 3).forEach((article, index) => {
        console.log(`  ${index + 1}. ${article.title}`);
      });
    }
    
    console.log('\n📡 测试2: 黄金分析 - 极速数据');
    console.log('URL: /jisu-news-proxy?category=财经&num=50&type=gold');
    
    const goldResponse = await axios.get(`${baseURL}/jisu-news-proxy`, {
      params: { 
        category: '财经',
        num: 50,
        type: 'gold'
      },
      timeout: 15000
    });
    
    console.log('✅ 黄金新闻响应:', {
      status: goldResponse.status,
      articlesCount: goldResponse.data?.articles?.length || 0,
      isTestData: goldResponse.data?.debug?.isTestData || false,
      errorMessage: goldResponse.data?.debug?.error || 'none'
    });
    
    if (goldResponse.data?.articles?.length > 0) {
      console.log('📰 前3条黄金新闻标题:');
      goldResponse.data.articles.slice(0, 3).forEach((article, index) => {
        console.log(`  ${index + 1}. ${article.title}`);
      });
    }
    
    console.log('\n🎉 测试完成！');
    
    const bothWorking = nasdaqResponse.status === 200 && goldResponse.status === 200;
    const hasArticles = (nasdaqResponse.data?.articles?.length || 0) > 0 && 
                       (goldResponse.data?.articles?.length || 0) > 0;
    
    if (bothWorking && hasArticles) {
      console.log('✅ 修复成功！极速数据API现在正常工作');
    } else {
      console.log('⚠️  API可以访问但可能仍在使用测试数据');
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

testProductionFix().catch(console.error);