/**
 * Netlify函数 - 从Yahoo Finance获取黄金价格数据
 * 使用 GC=F (Gold Futures) 获取真实历史数据
 */

const https = require('https');

/**
 * 从Yahoo Finance获取黄金价格数据
 * @param {string} symbol - 股票代码 (GC=F for gold futures)
 * @param {string} range - 时间范围 (5d, 1mo, etc.)
 * @param {string} interval - 数据间隔 (1d for daily)
 */
async function fetchYahooFinance(symbol, range = '5d', interval = '1d') {
  return new Promise((resolve, reject) => {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=${range}&interval=${interval}`;
    
    console.log('📡 请求 Yahoo Finance 黄金价格数据');
    console.log('URL:', url);
    
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          
          if (!jsonData.chart || !jsonData.chart.result || jsonData.chart.result.length === 0) {
            reject(new Error('Yahoo Finance API 返回无效数据'));
            return;
          }
          
          const result = jsonData.chart.result[0];
          const timestamps = result.timestamp;
          const quotes = result.indicators.quote[0];
          
          if (!timestamps || !quotes) {
            reject(new Error('Yahoo Finance 数据格式错误'));
            return;
          }
          
          console.log('✅ Yahoo Finance 数据接收:', {
            symbol: result.meta.symbol,
            dataPoints: timestamps.length,
            currency: result.meta.currency,
            regularMarketPrice: result.meta.regularMarketPrice
          });
          
          resolve({
            meta: result.meta,
            timestamps: timestamps,
            quotes: quotes
          });
        } catch (error) {
          reject(new Error(`Failed to parse Yahoo Finance response: ${error.message}`));
        }
      });
    }).on('error', (error) => {
      reject(new Error(`Yahoo Finance request failed: ${error.message}`));
    });
  });
}

/**
 * 转换Yahoo Finance数据为标准格式
 */
function transformYahooData(yahooData) {
  const { timestamps, quotes } = yahooData;
  const priceData = [];
  
  for (let i = 0; i < timestamps.length; i++) {
    const date = new Date(timestamps[i] * 1000);
    const open = quotes.open[i];
    const high = quotes.high[i];
    const low = quotes.low[i];
    const close = quotes.close[i];
    const volume = quotes.volume[i] || 0;
    
    // 跳过无效数据
    if (!open || !high || !low || !close) {
      continue;
    }
    
    // 跳过周末
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      continue;
    }
    
    priceData.push({
      date: date.toISOString().split('T')[0],
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume: parseInt(volume),
      change: parseFloat((close - open).toFixed(2)),
      changePercent: parseFloat(((close - open) / open * 100).toFixed(2))
    });
  }
  
  return priceData;
}

// Netlify 函数 handler
const handler = async (event, _context) => {
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
    const { symbol, range = '5d' } = event.queryStringParameters || {};
    
    console.log('📥 获取黄金价格数据:', { symbol, range });
    
    if (!symbol || symbol !== 'gold') {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: 'Only "gold" symbol is supported' 
        })
      };
    }

    // 使用 GC=F (Gold Futures) 获取黄金价格
    const yahooSymbol = 'GC=F';
    const yahooData = await fetchYahooFinance(yahooSymbol, range, '1d');
    
    if (!yahooData || !yahooData.timestamps) {
      console.error('❌ Yahoo Finance 黄金价格数据不可用');
      return {
        statusCode: 503,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: 'Gold price data temporarily unavailable',
          message: 'Yahoo Finance data is currently unavailable. Please try again later.',
          timestamp: new Date().toISOString()
        })
      };
    }

    // 转换数据格式
    const priceData = transformYahooData(yahooData);
    
    if (priceData.length === 0) {
      console.error('❌ 没有有效的价格数据');
      return {
        statusCode: 503,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: 'No valid price data',
          message: 'No valid price data available for the requested range.',
          timestamp: new Date().toISOString()
        })
      };
    }
    
    // 获取最新价格和前一天价格
    const latestPrice = priceData[priceData.length - 1].close;
    const previousPrice = priceData.length > 1 ? priceData[priceData.length - 2].close : latestPrice;
    const change = latestPrice - previousPrice;
    const changePercent = (change / previousPrice) * 100;
    
    const responseData = {
      symbol: 'XAUUSD',
      originalSymbol: 'gold',
      meta: {
        currency: yahooData.meta.currency || 'USD',
        exchangeName: yahooData.meta.exchangeName || 'COMEX',
        instrumentType: 'FUTURES',
        timezone: yahooData.meta.timezone || 'America/New_York',
        source: 'Yahoo Finance',
        lastUpdated: new Date().toISOString(),
        note: 'Real gold futures price data from Yahoo Finance (GC=F)',
        dataPoints: priceData.length,
        isRealData: true,
        currentPrice: latestPrice,
        previousClose: previousPrice,
        change: parseFloat(change.toFixed(2)),
        changePercent: parseFloat(changePercent.toFixed(2)),
        yahooSymbol: yahooSymbol,
        regularMarketPrice: yahooData.meta.regularMarketPrice
      },
      priceData: priceData
    };

    console.log('✅ 返回黄金价格数据:', {
      symbol: 'XAUUSD',
      dataPoints: priceData.length,
      currentPrice: latestPrice,
      previousClose: previousPrice,
      source: 'Yahoo Finance',
      dateRange: {
        from: priceData[0]?.date,
        to: priceData[priceData.length - 1]?.date
      }
    });

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300' // 缓存5分钟
      },
      body: JSON.stringify(responseData)
    };

  } catch (error) {
    console.error('❌ 黄金价格代理错误:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'Internal server error',
        message: 'Failed to fetch gold price data',
        details: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};

// 导出 handler
module.exports = { handler };
