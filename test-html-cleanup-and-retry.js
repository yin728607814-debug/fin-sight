#!/usr/bin/env node

/**
 * 测试HTML清理和新浪新闻重试机制
 */

import axios from 'axios';

// HTML清理函数
function stripHtmlTags(html) {
  if (!html) return '';
  
  // 移除所有HTML标签
  let text = html.replace(/<[^>]*>/g, ' ');
  
  // 解码HTML实体
  text = text.replace(/&nbsp;/g, ' ')
             .replace(/&lt;/g, '<')
             .replace(/&gt;/g, '>')
             .replace(/&amp;/g, '&')
             .replace(/&quot;/g, '"')
             .replace(/&#39;/g, "'");
  
  // 移除多余空格
  text = text.replace(/\s+/g, ' ').trim();
  
  return text;
}

// 测试极速数据HTML清理
async function testJisuHtmlCleanup() {
  console.log('\n🔍 测试极速数据HTML清理');
  console.log('═'.repeat(80));
  
  try {
    const response = await axios.get('https://api.jisuapi.com/news/get', {
      params: {
        appkey: '5fb0e1d5106b8fc0',
        channel: '科技',
        num: 5
      },
      timeout: 10000
    });
    
    if (response.data.status === 0) {
      const articles = response.data.result?.list || [];
      
      console.log(`\n获取到 ${articles.length} 条新闻\n`);
      
      articles.slice(0, 3).forEach((article, index) => {
        console.log(`新闻 ${index + 1}:`);
        console.log(`标题（原始）: ${article.title.substring(0, 100)}...`);
        console.log(`标题（清理）: ${stripHtmlTags(article.title).substring(0, 100)}...`);
        console.log(`内容（原始）: ${article.content.substring(0, 150)}...`);
        console.log(`内容（清理）: ${stripHtmlTags(article.content).substring(0, 150)}...`);
        console.log('');
      });
      
      console.log('✅ HTML清理测试完成');
    }
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

// 测试新浪新闻重试机制
async function testSinaRetry() {
  console.log('\n🔍 测试新浪新闻重试机制');
  console.log('═'.repeat(80));
  
  const maxRetries = 3;
  const timeout = 15000;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`\n尝试第 ${attempt}/${maxRetries} 次...`);
      const startTime = Date.now();
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`超时(${timeout/1000}秒)`)), timeout)
      );
      
      const fetchPromise = axios.get('https://feed.mix.sina.com.cn/api/roll/get', {
        params: {
          pageid: '153',
          lid: '2509',
          num: 50,
          versionNumber: '1.2.8',
          page: 1,
          encode: 'utf-8'
        },
        timeout: timeout
      });
      
      const response = await Promise.race([fetchPromise, timeoutPromise]);
      const elapsed = Date.now() - startTime;
      
      console.log(`✅ 第 ${attempt} 次尝试成功 (耗时: ${elapsed}ms)`);
      console.log(`   获取到 ${response.data.result?.data?.length || 0} 条新闻`);
      
      return response.data;
      
    } catch (error) {
      const elapsed = Date.now() - startTime;
      console.warn(`⚠️ 第 ${attempt} 次尝试失败 (耗时: ${elapsed}ms):`, error.message);
      
      if (attempt === maxRetries) {
        console.error(`❌ 所有 ${maxRetries} 次尝试都失败`);
        throw error;
      }
      
      // 等待后重试（递增延迟）
      const delay = attempt * 2000;
      console.log(`⏳ 等待 ${delay/1000} 秒后重试...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// 运行所有测试
async function runTests() {
  console.log('🚀 开始测试\n');
  
  await testJisuHtmlCleanup();
  await testSinaRetry();
  
  console.log('\n' + '═'.repeat(80));
  console.log('✅ 所有测试完成');
}

runTests().catch(console.error);
