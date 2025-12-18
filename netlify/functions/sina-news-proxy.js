/**
 * Netlify函数 - 新浪财经新闻API代理
 * 获取中文财经新闻
 */

const https = require('https');

exports.handler = async (event, _context) => {
  // 处理CORS预检请求
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      },
      body: ''
    };
  }

  try {
    // 获取查询参数
    const { category = 'finance', num = '50' } = event.queryStringParameters || {};
    
    // 新浪财经分类配置
    // 所有类型都使用财经要闻(lid=2509)，这是最可靠且内容最相关的分类
    // 包含股票、美股、黄金等各类财经新闻
    const categoryConfig = {
      'finance': { pageid: '153', lid: '2509', name: '财经要闻' },
      'stock': { pageid: '153', lid: '2509', name: '财经要闻' },
      'usstock': { pageid: '153', lid: '2509', name: '财经要闻' },
      'nasdaq': { pageid: '153', lid: '2509', name: '财经要闻' },
      'gold': { pageid: '153', lid: '2509', name: '财经要闻' }
    };
    
    const config = categoryConfig[category] || categoryConfig['finance'];
    
    console.log('📰 获取新浪财经新闻:', { 
      category, 
      pageid: config.pageid,
      lid: config.lid, 
      name: config.name,
      num 
    });
    
    // 构建新浪财经API URL
    const url = `https://feed.mix.sina.com.cn/api/roll/get?pageid=${config.pageid}&lid=${config.lid}&k=&num=${num}&page=1`;
    
    const response = await new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const options = {
        hostname: urlObj.hostname,
        path: urlObj.pathname + urlObj.search,
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Referer': 'https://finance.sina.com.cn/'
        },
        timeout: 10000
      };

      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const jsonData = JSON.parse(data);
            resolve({
              statusCode: res.statusCode,
              data: jsonData
            });
          } catch (error) {
            console.error('❌ JSON解析失败:', error.message);
            reject(new Error(`Failed to parse JSON: ${error.message}`));
          }
        });
      });

      req.on('error', (error) => {
        console.error('❌ 请求失败:', error);
        reject(error);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.end();
    });

    console.log('📡 新浪财经API响应:', {
      statusCode: response.statusCode,
      hasData: !!response.data.result?.data,
      dataCount: response.data.result?.data?.length || 0
    });

    // 检查响应状态
    if (response.data.result?.status?.code !== 0) {
      throw new Error(response.data.result?.status?.msg || 'API请求失败');
    }

    // 转换为统一格式
    const articles = (response.data.result?.data || []).map(item => ({
      title: item.title,
      description: item.intro || item.summary || item.title,
      content: item.intro || item.summary || item.title,
      url: item.url,
      source: {
        id: 'sina-finance',
        name: item.media_name || item.source || '新浪财经'
      },
      author: item.author || null,
      publishedAt: new Date(parseInt(item.ctime || item.intime) * 1000).toISOString(),
      urlToImage: item.img || item.thumb || null
    }));

    console.log('✅ 成功获取新浪财经新闻:', articles.length);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300' // 缓存5分钟
      },
      body: JSON.stringify({
        status: 'ok',
        totalResults: articles.length,
        articles: articles
      })
    };

  } catch (error) {
    console.error('❌ 新浪财经API错误:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: 'error',
        message: error.message || 'Internal server error'
      })
    };
  }
};
