#!/usr/bin/env node

/**
 * 直接测试极速数据API响应格式
 */

import axios from 'axios';

async function testJisuApiDirect() {
  console.log('🔧 直接测试极速数据API');
  
  const baseURL = 'https://fin-sight.top';
  
  try {
    console.log('\n📡 测试纳斯达克新闻请求');
    
    const response = await axios.get(`${baseURL}/jisu-news-proxy`, {
      params: { 
        category: '股票',
        num: 5,
        type: 'nasdaq',
        _debug: true
      },
      timeout: 15000
    });
    
    console.log('📊 完整响应数据:');
    console.log(JSON.stringify(response.data, null, 2));
    
    console.log('\n🔍 响应分析:');
    console.log('- status:', response.status);
    console.log('- data.status:', response.data?.status);
    console.log('- articles count:', response.data?.articles?.length || 0);
    console.log('- debug info:', response.data?.debug);
    
    if (response.data?.debug?.error) {
      console.log('\n❌ 发现错误:', response.data.debug.error);
      console.log('- isTestData:', response.data.debug.isTestData);
      console.log('- reason:', response.data.debug.reason);
    }
    
  } catch (error) {
    console.error('❌ 请求失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

testJisuApiDirect().catch(console.error);