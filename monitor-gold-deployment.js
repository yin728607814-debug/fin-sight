#!/usr/bin/env node

/**
 * 监控黄金新闻部署状态
 */

import axios from 'axios';

async function checkGoldNews() {
  try {
    const response = await axios.get('https://fin-sight.top/jisu-news-proxy', {
      params: { 
        category: '财经',
        num: 50,
        type: 'gold',
        _t: Date.now()
      },
      timeout: 15000,
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    const count = response.data?.articles?.length || 0;
    return count;
  } catch (error) {
    console.error('请求失败:', error.message);
    return 0;
  }
}

async function monitor() {
  console.log('🔍 开始监控黄金新闻部署状态...\n');
  console.log('目标: 从9条增加到35条');
  console.log('预计部署时间: 2-5分钟\n');
  
  let attempts = 0;
  const maxAttempts = 10;
  const interval = 30000; // 30秒
  
  while (attempts < maxAttempts) {
    attempts++;
    const timestamp = new Date().toLocaleTimeString('zh-CN');
    
    console.log(`[${timestamp}] 第 ${attempts}/${maxAttempts} 次检查...`);
    
    const count = await checkGoldNews();
    
    if (count >= 35) {
      console.log(`\n🎉 部署成功！黄金新闻已更新到 ${count} 条！`);
      console.log('✅ 目标达成 (35条)');
      break;
    } else if (count > 9) {
      console.log(`📈 部署进行中... 当前 ${count} 条 (目标 35条)`);
    } else {
      console.log(`⏳ 等待部署... 当前 ${count} 条 (旧版本)`);
    }
    
    if (attempts < maxAttempts) {
      console.log(`   等待30秒后再次检查...\n`);
      await new Promise(resolve => setTimeout(resolve, interval));
    }
  }
  
  if (attempts >= maxAttempts) {
    console.log('\n⚠️ 已达到最大检查次数');
    console.log('💡 建议: 手动检查 Cloudflare Pages 部署日志');
  }
}

monitor().catch(console.error);
