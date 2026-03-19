/**
 * 测试 Finnhub 代理功能
 * 
 * 运行方式：
 * node scripts/test-finnhub-proxy.js
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:3000';

async function testFinnhubProxy() {
  console.log('🧪 开始测试 Finnhub 代理\n');

  try {
    // 测试1：获取 AAPL 新闻
    console.log('📡 测试1: 获取 AAPL 公司新闻');
    const toDate = new Date().toISOString().split('T')[0];
    const fromDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const response1 = await axios.get(`${BASE_URL}/finnhub-news-proxy`, {
      params: {
        symbol: 'AAPL',
        from: fromDate,
        to: toDate
      },
      timeout: 10000
    });

    console.log('✅ 响应状态:', response1.status);
    console.log('📊 响应数据:', {
      status: response1.data.status,
      total: response1.data.total,
      articlesCount: response1.data.articles?.length || 0
    });

    if (response1.data.articles && response1.data.articles.length > 0) {
      console.log('📰 第一条新闻示例:');
      const first = response1.data.articles[0];
      console.log({
        headline: first.headline,
        source: first.source,
        datetime: new Date(first.datetime * 1000).toISOString(),
        url: first.url
      });
    }

    console.log('\n---\n');

    // 测试2：获取黄金相关新闻
    console.log('📡 测试2: 获取 GLD (黄金ETF) 新闻');
    const response2 = await axios.get(`${BASE_URL}/finnhub-news-proxy`, {
      params: {
        symbol: 'GLD',
        from: fromDate,
        to: toDate
      },
      timeout: 10000
    });

    console.log('✅ 响应状态:', response2.status);
    console.log('📊 响应数据:', {
      status: response2.data.status,
      total: response2.data.total,
      articlesCount: response2.data.articles?.length || 0
    });

    console.log('\n---\n');

    // 测试3：获取通用财经新闻
    console.log('📡 测试3: 获取通用财经新闻');
    const response3 = await axios.get(`${BASE_URL}/finnhub-news-proxy`, {
      params: {
        category: 'general'
      },
      timeout: 10000
    });

    console.log('✅ 响应状态:', response3.status);
    console.log('📊 响应数据:', {
      status: response3.data.status,
      total: response3.data.total,
      articlesCount: response3.data.articles?.length || 0
    });

    console.log('\n✅ 所有测试完成！');

  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

testFinnhubProxy();
