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
    const { category = 'finance', num = '500' } = event.queryStringParameters || {};
    
    // 新浪财经分类配置
    // 经过测试，财经要闻(lid=2509)是最可靠的分类
    // 获取大量新闻（500条），前端通过URL过滤+关键词过滤实现精准分类
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
    
    // 获取多页数据（500条 = 10页 × 50条）
    const allArticles = [];
    const requestedNum = parseInt(num);
    const perPage = 50;
    const pages = Math.ceil(requestedNum / perPage);
    
    for (let page = 1; page <= pages; page++) {
      const url = `https://feed.mix.sina.com.cn/api/roll/get?pageid=${config.pageid}&lid=${config.lid}&k=&num=${perPage}&page=${page}`;
      
      const response = await new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const options = {
        hostname: urlObj.hostname,
        path: urlObj.pathname + urlObj.search,
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Referer': 'https://finance.sina.com.cn/',
          'Accept': 'application/json'
          // 不要Accept-Encoding，避免gzip压缩问题
        },
        timeout: 25000  // 增加到25秒
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

      console.log(`📡 第${page}页响应:`, {
        statusCode: response.statusCode,
        hasData: !!response.data.result?.data,
        dataCount: response.data.result?.data?.length || 0
      });

      // 检查响应状态
      if (response.data.result?.status?.code !== 0) {
        console.error(`❌ 第${page}页失败:`, response.data.result?.status?.msg);
        break;
      }

      const pageArticles = response.data.result?.data || [];
      if (pageArticles.length === 0) {
        console.log(`⚠️  第${page}页无数据，停止获取`);
        break;
      }

      allArticles.push(...pageArticles);
      
      // 如果已经获取足够的数据，停止
      if (allArticles.length >= requestedNum) {
        break;
      }
      
      // 避免请求过快，延迟200ms
      if (page < pages) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    console.log(`✅ 总计获取 ${allArticles.length} 条新闻`);

    // 转换为统一格式
    const articles = allArticles.map(item => ({
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
