/**
 * Netlify函数 - Yahoo Finance API代理
 * 获取真实的纳斯达克100指数数据
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
    const { symbol, range = '5d', interval = '1d' } = event.queryStringParameters || {};
    
    console.log('📥 收到Yahoo Finance请求参数:', { symbol, range, interval });
    
    if (!symbol) {
      console.error('❌ 缺少必需参数 symbol');
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: 'Parameter "symbol" is required' 
        })
      };
    }

    // 映射符号到Yahoo Finance格式
    const symbolMap = {
      'nasdaq': '^NDX',  // 纳斯达克100指数
      'NDX': '^NDX',
      'gold': 'GC=F',    // 黄金期货 (Gold Continuous Contract)
      'GOLD': 'GC=F',
      'XAUUSD': 'GC=F'   // 现货黄金也使用黄金期货数据
    };

    const yahooSymbol = symbolMap[symbol] || symbol;
    
    // 构建Yahoo Finance API URL - 使用更稳定的端点
    const url = `https://query2.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?range=${range}&interval=${interval}&includePrePost=false&events=div%2Csplit`;
    console.log('🌐 Yahoo Finance请求URL:', url);

    // 发起请求到Yahoo Finance API
    const response = await new Promise((resolve, reject) => {
      const options = {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        timeout: 10000
      };

      https.get(url, options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const jsonData = JSON.parse(data);
            console.log('📡 Yahoo Finance API响应状态:', {
              hasResult: !!jsonData.chart?.result,
              resultLength: jsonData.chart?.result?.length || 0,
              hasError: !!jsonData.chart?.error,
              symbol: yahooSymbol
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

    // 检查API错误
    if (response.data.chart?.error) {
      console.error('❌ Yahoo Finance API错误:', response.data.chart.error);
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: 'Yahoo Finance API error',
          details: response.data.chart.error
        })
      };
    }

    // 转换数据格式为我们的标准格式
    const result = response.data.chart?.result?.[0];
    if (!result) {
      return {
        statusCode: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: 'No data found for symbol',
          symbol: yahooSymbol
        })
      };
    }

    const timestamps = result.timestamp || [];
    const quotes = result.indicators?.quote?.[0] || {};
    const { open, high, low, close, volume } = quotes;

    // 转换为我们的数据格式
    const priceData = timestamps.map((timestamp, index) => {
      const date = new Date(timestamp * 1000);
      const openPrice = open?.[index];
      const highPrice = high?.[index];
      const lowPrice = low?.[index];
      const closePrice = close?.[index];
      const vol = volume?.[index] || 0;

      // 计算相对于前一交易日的变化
      let change = 0;
      let changePercent = 0;
      
      if (index > 0 && close?.[index - 1] && closePrice) {
        const previousClose = close[index - 1];
        change = closePrice - previousClose;
        changePercent = (change / previousClose) * 100;
      } else if (openPrice && closePrice) {
        // 如果没有前一日数据，使用当日开盘价
        change = closePrice - openPrice;
        changePercent = (change / openPrice) * 100;
      }

      return {
        date: date.toISOString().split('T')[0], // YYYY-MM-DD格式
        open: openPrice,
        high: highPrice,
        low: lowPrice,
        close: closePrice,
        volume: vol,
        change: change,
        changePercent: changePercent
      };
    }).filter(item => item.close !== null && item.close !== undefined);

    const responseData = {
      symbol: yahooSymbol,
      originalSymbol: symbol,
      meta: {
        currency: result.meta?.currency || 'USD',
        exchangeName: result.meta?.exchangeName || 'NASDAQ',
        instrumentType: result.meta?.instrumentType || 'INDEX',
        firstTradeDate: result.meta?.firstTradeDate,
        regularMarketTime: result.meta?.regularMarketTime,
        gmtoffset: result.meta?.gmtoffset,
        timezone: result.meta?.timezone || 'EST',
        exchangeTimezoneName: result.meta?.exchangeTimezoneName || 'America/New_York'
      },
      priceData: priceData
    };

    console.log('✅ 成功处理Yahoo Finance数据:', {
      symbol: yahooSymbol,
      dataPoints: priceData.length,
      latestPrice: priceData[priceData.length - 1]?.close
    });

    // 返回结果
    return {
      statusCode: response.statusCode,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300' // 缓存5分钟
      },
      body: JSON.stringify(responseData)
    };

  } catch (error) {
    console.error('Yahoo Finance proxy error:', error);
    
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