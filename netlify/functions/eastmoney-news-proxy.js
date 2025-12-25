/**
 * 东方财富美股新闻代理
 * 爬取东方财富网的美股新闻
 */

const axios = require('axios');

exports.handler = async function(event, context) {
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
    console.log('📡 开始获取东方财富美股新闻');

    // 东方财富美股新闻API
    // 这是他们的移动端API，返回JSON格式
    const url = 'https://np-listapi.eastmoney.com/comm/wap/getListInfo';
    
    const response = await axios.get(url, {
      params: {
        cb: 'callback',
        pageSize: 50,
        pageIndex: 1,
        type: 8193, // 美股新闻类型
        client: 'wap',
        _: Date.now()
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
        'Referer': 'https://wap.eastmoney.com/'
      },
      timeout: 10000
    });

    let data = response.data;
    
    // 移除JSONP回调包装
    if (typeof data === 'string') {
      data = data.replace(/^callback\(/, '').replace(/\)$/, '');
      data = JSON.parse(data);
    }

    console.log('✅ 东方财富API响应:', {
      status: response.status,
      hasData: !!data,
      dataKeys: data ? Object.keys(data) : []
    });

    // 转换为统一格式
    const articles = [];
    
    if (data && data.data && Array.isArray(data.data)) {
      data.data.forEach(item => {
        articles.push({
          title: item.title || '',
          description: item.digest || item.content || '',
          url: item.url || item.showurl || '',
          publishedAt: item.showtime || new Date().toISOString(),
          source: '东方财富',
          image: item.image || item.thumbnail || ''
        });
      });
    }

    console.log('📰 转换后的新闻数量:', articles.length);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: 'ok',
        totalResults: articles.length,
        articles: articles
      })
    };

  } catch (error) {
    console.error('❌ 东方财富新闻获取失败:', error.message);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        status: 'error',
        message: error.message,
        articles: []
      })
    };
  }
};
