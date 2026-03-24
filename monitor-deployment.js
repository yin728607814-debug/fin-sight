#!/usr/bin/env node

/**
 * 监控部署状态，等待新版本生效
 */

import axios from 'axios';

async function monitorDeployment() {
  console.log('🚀 监控部署状态，等待新版本生效...');
  console.log('⏰ 开始时间:', new Date().toLocaleString());
  
  const baseURL = 'https://fin-sight.top';
  let attempts = 0;
  const maxAttempts = 20; // 最多等待10分钟（每30秒检查一次）
  
  while (attempts < maxAttempts) {
    attempts++;
    console.log(`\n📡 第${attempts}次检查 (${new Date().toLocaleTimeString()})`);
    
    try {
      const timestamp = Date.now();
      const response = await axios.get(`${baseURL}/jisu-news-proxy`, {
        params: { 
          category: '股票',
          num: 5,
          type: 'nasdaq',
          _t: timestamp // 缓存破坏参数
        },
        timeout: 15000,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      const articlesCount = response.data?.articles?.length || 0;
      const isTestData = response.data?.debug?.isTestData || false;
      const error = response.data?.debug?.error || 'none';
      const reason = response.data?.debug?.reason || 'unknown';
      
      console.log('📊 响应状态:', {
        status: response.status,
        articlesCount,
        isTestData,
        error: error.substring(0, 50) + (error.length > 50 ? '...' : ''),
        reason
      });
      
      // 检查是否部署成功
      if (articlesCount > 0 && isTestData) {
        console.log('🎉 部署成功！新版本已生效');
        console.log(`✅ 现在返回 ${articlesCount} 条备用中文新闻`);
        console.log('📰 第一条新闻:', response.data.articles[0]?.title || 'N/A');
        console.log('⏰ 部署完成时间:', new Date().toLocaleString());
        console.log(`⌛ 总耗时: ${attempts * 30} 秒`);
        return true;
      } else if (articlesCount === 0 && !isTestData) {
        console.log('⏳ 旧版本仍在运行，继续等待...');
      } else {
        console.log('⚠️ 意外的响应状态，继续监控...');
      }
      
    } catch (error) {
      console.error('❌ 请求失败:', error.message);
    }
    
    if (attempts < maxAttempts) {
      console.log('⏳ 等待30秒后再次检查...');
      await new Promise(resolve => setTimeout(resolve, 30000));
    }
  }
  
  console.log('\n⏰ 监控超时');
  console.log('💡 建议: 手动检查Cloudflare Pages部署状态');
  console.log('🔗 部署面板: https://dash.cloudflare.com/');
  return false;
}

monitorDeployment().catch(console.error);