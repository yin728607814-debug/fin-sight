/**
 * 测试新的API源（极速数据、探数API）
 * 
 * 运行方式：
 * node scripts/test-new-apis.js
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:3000';

async function testNewAPIs() {
  console.log('🧪 开始测试新的API源\n');

  try {
    // 测试1：极速数据 - 股票新闻
    console.log('📡 测试1: 极速数据 - 股票新闻');
    try {
      const response1 = await axios.get(`${BASE_URL}/jisu-news-proxy`, {
        params: {
          category: '股票',
          num: 10
        },
        timeout: 15000
      });

      console.log('✅ 极速数据响应状态:', response1.status);
      console.log('📊 极速数据响应数据:', {
        status: response1.data.status,
        totalResults: response1.data.totalResults,
        articlesCount: response1.data.articles?.length || 0
      });

      if (response1.data.articles && response1.data.articles.length > 0) {
        console.log('📰 第一条新闻示例:');
        const first = response1.data.articles[0];
        console.log({
          title: first.title?.substring(0, 50) + '...',
          source: first.source?.name,
          publishedAt: first.publishedAt,
          url: first.url
        });
      }
    } catch (error) {
      console.error('❌ 极速数据测试失败:', error.message);
      if (error.response) {
        console.error('响应状态:', error.response.status);
        console.error('响应数据:', error.response.data);
      }
    }

    console.log('\n---\n');

    // 测试2：极速数据 - 财经新闻
    console.log('📡 测试2: 极速数据 - 财经新闻');
    try {
      const response2 = await axios.get(`${BASE_URL}/jisu-news-proxy`, {
        params: {
          category: '财经',
          num: 10
        },
        timeout: 15000
      });

      console.log('✅ 极速数据响应状态:', response2.status);
      console.log('📊 极速数据响应数据:', {
        status: response2.data.status,
        totalResults: response2.data.totalResults,
        articlesCount: response2.data.articles?.length || 0
      });
    } catch (error) {
      console.error('❌ 极速数据财经测试失败:', error.message);
    }

    console.log('\n---\n');

    // 测试3：探数API - 股票新闻
    console.log('📡 测试3: 探数API - 股票新闻');
    try {
      const response3 = await axios.get(`${BASE_URL}/tanshu-news-proxy`, {
        params: {
          category: '股票',
          num: 10,
          start: 0
        },
        timeout: 15000
      });

      console.log('✅ 探数API响应状态:', response3.status);
      console.log('📊 探数API响应数据:', {
        status: response3.data.status,
        totalResults: response3.data.totalResults,
        articlesCount: response3.data.articles?.length || 0
      });

      if (response3.data.articles && response3.data.articles.length > 0) {
        console.log('📰 第一条新闻示例:');
        const first = response3.data.articles[0];
        console.log({
          title: first.title?.substring(0, 50) + '...',
          source: first.source?.name,
          publishedAt: first.publishedAt,
          url: first.url
        });
      }
    } catch (error) {
      console.error('❌ 探数API测试失败:', error.message);
      if (error.response) {
        console.error('响应状态:', error.response.status);
        console.error('响应数据:', error.response.data);
      }
    }

    console.log('\n---\n');

    // 测试4：探数API - 财经新闻
    console.log('📡 测试4: 探数API - 财经新闻');
    try {
      const response4 = await axios.get(`${BASE_URL}/tanshu-news-proxy`, {
        params: {
          category: '财经',
          num: 10,
          start: 0
        },
        timeout: 15000
      });

      console.log('✅ 探数API响应状态:', response4.status);
      console.log('📊 探数API响应数据:', {
        status: response4.data.status,
        totalResults: response4.data.totalResults,
        articlesCount: response4.data.articles?.length || 0
      });
    } catch (error) {
      console.error('❌ 探数API财经测试失败:', error.message);
    }

    console.log('\n✅ 所有测试完成！');
    console.log('\n💡 使用说明:');
    console.log('1. 极速数据需要在 .env 中配置 VITE_JISU_API_KEY');
    console.log('2. 探数API需要在 .env 中配置 VITE_TANSHU_API_KEY');
    console.log('3. 如果API密钥未配置，代理会返回错误，但不会影响整体应用');
    console.log('4. 这些API是付费服务，但通常提供免费试用额度');

  } catch (error) {
    console.error('\n❌ 测试过程中发生错误:', error.message);
  }
}

testNewAPIs();