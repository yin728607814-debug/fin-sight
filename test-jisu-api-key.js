#!/usr/bin/env node

/**
 * 测试极速数据API Key是否可用
 */

import axios from 'axios';

async function testJisuApiKey() {
  const apiKey = '5fb0e1d5106b8fc0';
  
  console.log('🔍 测试极速数据API Key...\n');
  console.log(`API Key: ${apiKey}\n`);
  
  // 测试1: 财经频道
  console.log('📡 测试1: 财经频道新闻');
  try {
    const response1 = await axios.get('https://api.jisuapi.com/news/get', {
      params: {
        appkey: apiKey,
        channel: '财经',
        num: 10
      },
      timeout: 10000
    });
    
    console.log('✅ 财经频道响应:');
    console.log('   状态码:', response1.data.status);
    console.log('   消息:', response1.data.msg);
    console.log('   数据:', response1.data.result ? `${response1.data.result.list?.length || 0}条新闻` : '无数据');
    console.log('');
  } catch (error) {
    console.error('❌ 财经频道失败:', error.response?.data || error.message);
    console.log('');
  }
  
  // 测试2: 搜索黄金
  console.log('📡 测试2: 搜索"黄金"关键词');
  try {
    const response2 = await axios.get('https://api.jisuapi.com/news/search', {
      params: {
        appkey: apiKey,
        keyword: '黄金',
        num: 10
      },
      timeout: 10000
    });
    
    console.log('✅ 黄金搜索响应:');
    console.log('   状态码:', response2.data.status);
    console.log('   消息:', response2.data.msg);
    console.log('   数据:', response2.data.result ? `${response2.data.result.list?.length || 0}条新闻` : '无数据');
    console.log('');
  } catch (error) {
    console.error('❌ 黄金搜索失败:', error.response?.data || error.message);
    console.log('');
  }
  
  // 测试3: 搜索纳斯达克
  console.log('📡 测试3: 搜索"纳斯达克"关键词');
  try {
    const response3 = await axios.get('https://api.jisuapi.com/news/search', {
      params: {
        appkey: apiKey,
        keyword: '纳斯达克',
        num: 10
      },
      timeout: 10000
    });
    
    console.log('✅ 纳斯达克搜索响应:');
    console.log('   状态码:', response3.data.status);
    console.log('   消息:', response3.data.msg);
    console.log('   数据:', response3.data.result ? `${response3.data.result.list?.length || 0}条新闻` : '无数据');
    console.log('');
  } catch (error) {
    console.error('❌ 纳斯达克搜索失败:', error.response?.data || error.message);
    console.log('');
  }
  
  // 测试4: 股票频道
  console.log('📡 测试4: 股票频道新闻');
  try {
    const response4 = await axios.get('https://api.jisuapi.com/news/get', {
      params: {
        appkey: apiKey,
        channel: '股票',
        num: 10
      },
      timeout: 10000
    });
    
    console.log('✅ 股票频道响应:');
    console.log('   状态码:', response4.data.status);
    console.log('   消息:', response4.data.msg);
    console.log('   数据:', response4.data.result ? `${response4.data.result.list?.length || 0}条新闻` : '无数据');
    console.log('');
  } catch (error) {
    console.error('❌ 股票频道失败:', error.response?.data || error.message);
    console.log('');
  }
  
  console.log('═'.repeat(60));
  console.log('测试完成');
}

testJisuApiKey().catch(console.error);
