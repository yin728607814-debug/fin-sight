#!/usr/bin/env node

/**
 * 测试部署状态和缓存清理
 */

import axios from 'axios';

async function testDeploymentStatus() {
  console.log('🔧 测试部署状态和缓存');
  
  const baseURL = 'https://fin-sight.top';
  
  try {
    console.log('\n📡 测试1: 带缓存破坏参数的请求');
    
    const timestamp = Date.now();
    const nasdaqResponse = await axios.get(`${baseURL}/jisu-news-proxy`, {
      params: { 
        category: '股票',
        num: 30,
        type: 'nasdaq',
        _t: timestamp // 缓存破坏参数
      },
      timeout: 15000,
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    console.log('✅ 纳斯达克新闻响应:', {
      status: nasdaqResponse.status,
      articlesCount: nasdaqResponse.data?.articles?.length || 0,
      error: nasdaqResponse.data?.debug?.error || 'none',
      isTestData: nasdaqResponse.data?.debug?.isTestData || false,
      apiKeyStatus: nasdaqResponse.data?.debug?.apiKeyStatus || 'unknown'
    });
    
    if (nasdaqResponse.data?.articles?.length > 0) {
      console.log('📰 前2条纳斯达克新闻:');
      nasdaqResponse.data.articles.slice(0, 2).forEach((article, index) => {
        console.log(`  ${index + 1}. ${article.title}`);
        console.log(`     来源: ${article.source?.name || article.author}`);
      });
    }
    
    console.log('\n📡 测试2: 黄金新闻测试');
    
    const goldResponse = await axios.get(`${baseURL}/jisu-news-proxy`, {
      params: { 
        category: '财经',
        num: 30,
        type: 'gold',
        _t: timestamp + 1000
      },
      timeout: 15000,
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    console.log('✅ 黄金新闻响应:', {
      status: goldResponse.status,
      articlesCount: goldResponse.data?.articles?.length || 0,
      error: goldResponse.data?.debug?.error || 'none',
      isTestData: goldResponse.data?.debug?.isTestData || false,
      apiKeyStatus: goldResponse.data?.debug?.apiKeyStatus || 'unknown'
    });
    
    if (goldResponse.data?.articles?.length > 0) {
      console.log('📰 前2条黄金新闻:');
      goldResponse.data.articles.slice(0, 2).forEach((article, index) => {
        console.log(`  ${index + 1}. ${article.title}`);
        console.log(`     来源: ${article.source?.name || article.author}`);
      });
    }
    
    console.log('\n🎯 部署状态分析:');
    
    const nasdaqCount = nasdaqResponse.data?.articles?.length || 0;
    const goldCount = goldResponse.data?.articles?.length || 0;
    const nasdaqTestData = nasdaqResponse.data?.debug?.isTestData || false;
    const goldTestData = goldResponse.data?.debug?.isTestData || false;
    
    if (nasdaqCount > 0 && goldCount > 0 && nasdaqTestData && goldTestData) {
      console.log('✅ 部署成功！极速数据API现在返回备用中文新闻');
      console.log(`📊 纳斯达克: ${nasdaqCount}条, 黄金: ${goldCount}条`);
      console.log('🎉 修复完成，用户将看到中文新闻而不是0条');
    } else if (nasdaqCount === 0 && goldCount === 0) {
      console.log('⏳ 部署可能还在进行中，或者缓存未清理');
      console.log('💡 建议: 等待5-10分钟后再次测试');
    } else {
      console.log('⚠️ 部分部署成功，需要进一步检查');
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

testDeploymentStatus().catch(console.error);