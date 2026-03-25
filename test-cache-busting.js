#!/usr/bin/env node

/**
 * 强力缓存破坏测试
 */

import axios from 'axios';

async function testCacheBusting() {
  console.log('🔧 强力缓存破坏测试');
  
  const baseURL = 'https://fin-sight.top';
  
  for (let i = 1; i <= 5; i++) {
    console.log(`\n📡 第${i}次测试 (${new Date().toLocaleTimeString()})`);
    
    try {
      const timestamp = Date.now() + i * 1000;
      const randomParam = Math.random().toString(36).substring(7);
      
      const response = await axios.get(`${baseURL}/jisu-news-proxy`, {
        params: { 
          category: '股票',
          num: 30,
          type: 'nasdaq',
          _t: timestamp,
          _r: randomParam,
          _v: '2024.3.24.v2'
        },
        timeout: 15000,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'User-Agent': `TestAgent-${randomParam}`
        }
      });
      
      const articlesCount = response.data?.articles?.length || 0;
      const isTestData = response.data?.debug?.isTestData || false;
      
      console.log(`📊 结果: ${articlesCount}条新闻`);
      
      if (articlesCount >= 30) {
        console.log('🎉 成功！新版本已生效，返回30+条新闻');
        
        // 显示前5条新闻标题
        console.log('📰 前5条新闻:');
        response.data.articles.slice(0, 5).forEach((article, index) => {
          console.log(`  ${index + 1}. ${article.title.substring(0, 50)}...`);
        });
        
        return true;
      } else {
        console.log(`⏳ 还是旧版本，只有${articlesCount}条新闻`);
      }
      
    } catch (error) {
      console.error(`❌ 第${i}次测试失败:`, error.message);
    }
    
    if (i < 5) {
      console.log('⏳ 等待30秒后再次测试...');
      await new Promise(resolve => setTimeout(resolve, 30000));
    }
  }
  
  console.log('\n⚠️ 5次测试都未检测到新版本');
  console.log('💡 可能需要更长时间等待Cloudflare Pages部署完成');
  return false;
}

testCacheBusting().catch(console.error);