/**
 * Netlify函数 - 获取真实黄金历史价格数据
 * 从多个数据源获取真实的历史黄金价格数据
 */

const https = require('https');

// 从 Yahoo Finance 获取黄金现货历史数据 (XAUUSD=X)
async function fetchYahooGoldSpot(range) {
  return new Promise((resolve, reject) => {
    // 使用黄金现货 (XAUUSD=X) - 更准确的现货价格
    const symbol = 'XAUUSD=X';
    
    // 为了确保有足够的交易日数据，请求更多天数
    // 5d 可能只有 3-4 个交易日（因为周末），所以请求 10d
    const actualRange = range === '5d' ? '10d' : range;
    const url = `https://query2.finance.yahoo.com/v8/finance/chart/${symbol}?range=${actualRange}&interval=1d&includePrePost=false`;
    
    console.log('📡 请求 Yahoo Finance 黄金现货:', { symbol, requestedRange: range, actualRange, url });
    
    https.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          
          if (jsonData.chart?.error) {
            reject(new Error(`Yahoo Finance API error: ${jsonData.chart.error.description}`));
            return;
          }
          
          const result = jsonData.chart?.result?.[0];
          if (!result) {
            reject(new Error('No chart data found'));
            return;
          }
          
          const timestamps = result.timestamp || [];
          const quotes = result.indicators?.quote?.[0] || {};
          const { open, high, low, close, volume } = quotes;
          
          if (timestamps.length === 0) {
            reject(new Error('No timestamp data'));
            return;
          }
          
          console.log('📊 Yahoo Finance 数据接收:', {
            dataPoints: timestamps.length,
            firstDate: new Date(timestamps[0] * 1000).toISOString().split('T')[0],
            lastDate: new Date(timestamps[timestamps.length - 1] * 1000).toISOString().split('T')[0]
          });
          
          // 转换为标准格式（现货价格，无需调整）
          const historicalData = timestamps.map((timestamp, index) => {
            const date = new Date(timestamp * 1000);
            const openPrice = open?.[index];
            const highPrice = high?.[index];
            const lowPrice = low?.[index];
            const closePrice = close?.[index];
            const vol = volume?.[index] || 0;
            
            return {
              date: date.toISOString().split('T')[0],
              open: Math.round(openPrice * 100) / 100,
              high: Math.round(highPrice * 100) / 100,
              low: Math.round(lowPrice * 100) / 100,
              close: Math.round(closePrice * 100) / 100,
              volume: vol,
              change: Math.round((closePrice - openPrice) * 100) / 100,
              changePercent: Math.round(((closePrice - openPrice) / openPrice) * 10000) / 100
            };
          }).filter(item => item.close !== null && item.close !== undefined && !isNaN(item.close));
          
          console.log('✅ 数据转换完成（现货价格）:', {
            validDataPoints: historicalData.length,
            latestDate: historicalData[historicalData.length - 1]?.date,
            latestPrice: historicalData[historicalData.length - 1]?.close
          });
          
          resolve(historicalData);
        } catch (error) {
          reject(new Error(`Failed to parse Yahoo Finance response: ${error.message}`));
        }
      });
    }).on('error', (error) => {
      reject(new Error(`Yahoo Finance request failed: ${error.message}`));
    });
  });
}

// 验证历史数据质量
function validateHistoricalData(data) {
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('Invalid historical data: empty or not an array');
  }
  
  return data.filter(item => {
    // 基本数据完整性检查
    return (
      item.date &&
      typeof item.open === 'number' && item.open > 0 &&
      typeof item.high === 'number' && item.high > 0 &&
      typeof item.low === 'number' && item.low > 0 &&
      typeof item.close === 'number' && item.close > 0 &&
      item.high >= Math.max(item.open, item.close) &&
      item.low <= Math.min(item.open, item.close) &&
      item.close >= 2000 && item.close <= 8000 // 合理的黄金价格范围
    );
  }).sort((a, b) => new Date(a.date) - new Date(b.date)); // 按日期排序
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
    
    console.log('📥 获取真实黄金历史价格数据:', { symbol, range });
    
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

    // 优先使用 Finnhub 获取黄金价格（更准确）
    console.log('🌐 优先使用 Finnhub API 获取黄金价格');
    
    try {
      // 尝试从 Finnhub 获取数据
      const finnhubResponse = await new Promise((resolve, reject) => {
        const https = require('https');
        const apiKey = process.env.VITE_FINNHUB_API_KEY;
        
        if (!apiKey) {
          reject(new Error('Finnhub API Key not configured'));
          return;
        }
        
        const now = Math.floor(Date.now() / 1000);
        const from = now - (7 * 24 * 60 * 60); // 7天
        
        const url = `https://finnhub.io/api/v1/forex/candle?symbol=OANDA:XAU_USD&resolution=D&from=${from}&to=${now}&token=${apiKey}`;
        
        https.get(url, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              const json = JSON.parse(data);
              if (json.s === 'ok' && json.c && json.c.length > 0) {
                // 转换为标准格式
                const priceData = [];
                for (let i = 0; i < json.t.length; i++) {
                  const date = new Date(json.t[i] * 1000);
                  priceData.push({
                    date: date.toISOString().split('T')[0],
                    open: Math.round(json.o[i] * 100) / 100,
                    high: Math.round(json.h[i] * 100) / 100,
                    low: Math.round(json.l[i] * 100) / 100,
                    close: Math.round(json.c[i] * 100) / 100,
                    volume: json.v?.[i] || 0,
                    change: Math.round((json.c[i] - json.o[i]) * 100) / 100,
                    changePercent: Math.round(((json.c[i] - json.o[i]) / json.o[i]) * 10000) / 100
                  });
                }
                resolve(priceData);
              } else {
                reject(new Error('Finnhub returned invalid data'));
              }
            } catch (error) {
              reject(error);
            }
          });
        }).on('error', reject);
      });
      
      // 过滤周末数据
      const weekdayData = finnhubResponse.filter(item => {
        const date = new Date(item.date);
        const dayOfWeek = date.getDay();
        return dayOfWeek !== 0 && dayOfWeek !== 6;
      });
      
      historicalData = weekdayData.slice(-5); // 最近5个交易日
      console.log('✅ Finnhub 数据获取成功:', historicalData.length, '个交易日');
      
    } catch (finnhubError) {
      console.warn('⚠️ Finnhub 获取失败，回退到 Yahoo Finance:', finnhubError.message);
      
      // 回退到 Yahoo Finance
      historicalData = await fetchYahooGoldSpot(range);
    }
    
    if (!historicalData || historicalData.length === 0) {
      console.error('❌ Yahoo Finance 黄金现货数据不可用');
      return {
        statusCode: 503,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: 'Historical data temporarily unavailable',
          message: 'Gold spot data is currently unavailable. Please try again later.',
          timestamp: new Date().toISOString()
        })
      };
    }

    // 验证历史数据质量
    const validatedData = validateHistoricalData(historicalData);
    
    const responseData = {
      symbol: 'XAUUSD',
      originalSymbol: 'gold',
      meta: {
        currency: 'USD',
        exchangeName: 'OANDA/FOREX',
        instrumentType: 'SPOT',
        timezone: 'UTC',
        source: 'Finnhub Forex API (primary) / Yahoo Finance (fallback)',
        lastUpdated: new Date().toISOString(),
        note: 'Real-time spot gold price from Finnhub',
        dataPoints: validatedData.length,
        isRealData: true
      },
      priceData: validatedData
    };

    console.log('✅ 返回黄金价格数据:', {
      symbol: 'XAUUSD',
      dataPoints: validatedData.length,
      latestPrice: validatedData[validatedData.length - 1]?.close,
      source: 'Finnhub (primary) / Yahoo Finance (fallback)',
      dateRange: {
        from: validatedData[0]?.date,
        to: validatedData[validatedData.length - 1]?.date
      }
    });

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60' // 缓存1分钟（更频繁更新）
      },
      body: JSON.stringify(responseData)
    };

  } catch (error) {
    console.error('❌ 黄金历史价格代理错误:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'Internal server error',
        message: 'Failed to fetch historical gold price data',
        timestamp: new Date().toISOString()
      })
    };
  }
};

// 导出 handler
module.exports = { handler };

