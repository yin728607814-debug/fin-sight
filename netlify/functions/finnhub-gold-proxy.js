/**
 * Finnhub 黄金新闻代理
 * 专门获取黄金相关的外汇和通用新闻
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
    // 从环境变量获取 Finnhub API Key
    const apiKey = process.env.VITE_FINNHUB_API_KEY;
    
    if (!apiKey) {
      throw new Error('Finnhub API Key 未配置');
    }

    console.log('📡 Finnhub Gold Proxy 开始获取黄金新闻');

    // 获取外汇和通用新闻（包含黄金相关）
    const categories = ['forex', 'general'];
    const allNews = [];

    for (const category of categories) {
      try {
        const response = await axios.get('https://finnhub.io/api/v1/news', {
          params: {
            category,
            token: apiKey
          },
          timeout: 15000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });

        if (Array.isArray(response.data)) {
          allNews.push(...response.data);
          console.log(`✅ ${category} 新闻获取成功: ${response.data.length}条`);
        }

        // 避免速率限制
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (err) {
        console.warn(`⚠️ ${category} 新闻获取失败:`, err.message);
      }
    }

    console.log(`📊 总计获取: ${allNews.length}条新闻`);

    // 过滤黄金相关新闻
    const goldKeywords = ['gold', 'xauusd', 'precious metal', 'bullion', 'gold price', 'gold market'];
    const goldNews = allNews.filter(article => {
      const headline = (article.headline || '').toLowerCase();
      const summary = (article.summary || '').toLowerCase();
      return goldKeywords.some(kw => headline.includes(kw) || summary.includes(kw));
    });

    console.log(`✂️ 黄金相关新闻过滤: ${goldNews.length}条`);

    // 去重（按URL）
    const uniqueNews = Array.from(
      new Map(goldNews.map(item => [item.url, item])).values()
    );

    // 按时间排序
    const sortedNews = uniqueNews.sort((a, b) => b.datetime - a.datetime);

    console.log(`✅ 最终返回: ${sortedNews.length}条黄金新闻`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: 'ok',
        articles: sortedNews,
        total: sortedNews.length
      })
    };

  } catch (error) {
    console.error('❌ Finnhub Gold Proxy 失败:', error.message);
    
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
