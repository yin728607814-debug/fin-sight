/**
 * Netlify函数 - Alpha Vantage API代理
 * 获取真实的股票和商品价格数据
 */

const https = require('https');

exports.handler = async (event, _context) => {
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
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY || process.env.VITE_ALPHA_VANTAGE_API_KEY;
    
    console.log('🔑 检查Alpha Vantage API密钥:', {
      hasAlphaVantageApiKey: !!process.env.ALPHA_VANTAGE_API_KEY,
      hasViteAlphaVantageApiKey: !!process.env.VITE_ALPHA_VANTAGE_API_KEY,
      finalApiKey: apiKey ? apiKey.substring(0, 8) + '...' : 'none'
    });
    
    if (!apiKey) {
      console.error('❌ Alpha Vantage API密钥未配置');
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: 'Alpha Vantage API key not configured',
          debug: {
            hasAlphaVantageApiKey: !!process.env.ALPHA_VANTAGE_API_KEY,
            hasViteAlphaVantageApiKey: !!process.env.VITE_ALPHA_VANTAGE_API_KEY,
            allEnvKeys: Object.keys(process.env).filter(key => key.includes('ALPHA') || key.includes('VANTAGE'))
          }
        })
      };
    }

    // 从查询参数构建Alpha Vantage API请求
    const { function: func, symbol, outputsize, interval } = event.queryStringParameters || {};
    
    console.log('📥 收到价格请求参数:', { function: func, symbol, outputsize, interval });
    
    if (!func || !symbol) {
      console.error('❌ 缺少必需参数 function 或 symbol');
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: 'Parameters "function" and "symbol" are required' 
        })
      };
    }

    // 构建Alpha Vantage API URL
    const params = new URLSearchParams({
      function: func,
      symbol,
      apikey: apiKey
    });

    if (outputsize) {
      params.append('outputsize', outputsize);
    }
    
    if (interval) {
      params.append('interval', interval);
    }

    const url = `https://www.alphavantage.co/query?${params.toString()}`;
    console.log('🌐 Alpha Vantage请求URL:', url.replace(apiKey, 'API_KEY_HIDDEN'));

    // 发起请求到Alpha Vantage API
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
            console.log('📡 Alpha Vantage API响应:', {
              hasMetaData: !!jsonData['Meta Data'],
              hasTimeSeries: !!jsonData['Time Series (Daily)'],
              hasGlobalQuote: !!jsonData['Global Quote'],
              hasError: !!jsonData['Error Message'],
              hasNote: !!jsonData['Note']
            });
            
            resolve({
              statusCode: res.statusCode,
              data: jsonData
            });
          } catch (error) {
            console.error('❌ JSON解析失败:', error.message);
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
    console.error('Price proxy error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message
      })
    };
  }
};