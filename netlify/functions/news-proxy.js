/**
 * Netlify函数 - News API代理
 * 解决浏览器CORS限制问题
 */

const https = require('https');

exports.handler = async (event, context) => {
  // 只允许GET请求
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // 处理预检请求
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
    // 从环境变量获取API密钥
    const apiKey = process.env.NEWS_API_KEY || process.env.VITE_NEWS_API_KEY;
    
    if (!apiKey) {
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          status: 'error',
          message: 'News API key not configured' 
        })
      };
    }

    // 从查询参数构建News API请求
    const { q, language = 'en', sortBy = 'publishedAt', pageSize = 20, from } = event.queryStringParameters || {};
    
    if (!q) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          status: 'error',
          message: 'Query parameter "q" is required' 
        })
      };
    }

    // 构建News API URL
    const params = new URLSearchParams({
      q,
      language,
      sortBy,
      pageSize: Math.min(parseInt(pageSize) || 20, 100).toString(),
      apiKey
    });

    if (from) {
      params.append('from', from);
    }

    const url = `https://newsapi.org/v2/everything?${params.toString()}`;

    // 发起请求到News API
    const response = await new Promise((resolve, reject) => {
      const options = {
        headers: {
          'User-Agent': 'Investment-News-Analyzer/1.0 (Netlify Function)'
        }
      };

      https.get(url, options, (res) => {
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
            reject(new Error(`Failed to parse JSON: ${error.message}`));
          }
        });
      }).on('error', (error) => {
        reject(error);
      });
    });

    // 返回结果
    return {
      statusCode: response.statusCode,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300' // 缓存5分钟
      },
      body: JSON.stringify(response.data)
    };

  } catch (error) {
    console.error('News proxy error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        status: 'error',
        message: 'Internal server error',
        details: error.message
      })
    };
  }
};