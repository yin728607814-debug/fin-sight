/**
 * Finnhub 新闻代理
 * 解决浏览器端 CORS 问题
 */

const axios = require('axios');

exports.handler = async function(event, _context) {
  // 设置CORS头
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // 处理OPTIONS预检请求
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    const { symbol, category, from, to } = event.queryStringParameters || {};
    
    // 从环境变量获取 Finnhub API Key
    const apiKey = process.env.VITE_FINNHUB_API_KEY;
    
    if (!apiKey) {
      throw new Error('Finnhub API Key 未配置');
    }

    console.log('📡 Finnhub News Proxy 请求:', { symbol, category, from, to });

    let url = 'https://finnhub.io/api/v1/';
    let params = { token: apiKey };

    // 根据参数决定调用哪个端点
    if (symbol) {
      // 公司新闻
      url += 'company-news';
      params = { ...params, symbol, from, to };
    } else if (category) {
      // 分类新闻
      url += 'news';
      params = { ...params, category };
    } else {
      // 通用市场新闻
      url += 'news';
      params = { ...params, category: 'general' };
    }

    const response = await axios.get(url, {
      params,
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    console.log('✅ Finnhub 响应:', {
      status: response.status,
      dataLength: Array.isArray(response.data) ? response.data.length : 0
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: 'ok',
        articles: response.data || [],
        total: Array.isArray(response.data) ? response.data.length : 0
      })
    };

  } catch (error) {
    console.error('❌ Finnhub News Proxy 失败:', error.message);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        status: 'error',
        message: error.message,
        articles: [],
        total: 0
      })
    };
  }
};
