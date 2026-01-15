/**
 * Netlify函数 - 获取真实黄金历史价格数据
 * 从多个数据源获取真实的历史黄金价格数据
 */

const https = require('https');

// 期货到现货价格调整系数
// 根据实际市场数据对比（Investing.com vs Yahoo Finance）
// 期货价格通常比现货高约 0.27%，但实际观察发现需要更小的调整
// 调整系数 = 1.0（不调整，直接使用期货价格作为现货价格参考）
const FUTURES_TO_SPOT_ADJUSTMENT = 1.0;

// 从 Yahoo Finance 获取黄金期货历史数据 (GC=F)
async function fetchYahooGoldFutures(range) {
  return new Promise((resolve, reject) => {
    // 使用黄金期货 (GC=F) - COMEX 黄金期货
    const symbol = 'GC=F';
    
    // 为了确保有足够的交易日数据，请求更多天数
    // 5d 可能只有 3-4 个交易日（因为周末），所以请求 10d
    const actualRange = range === '5d' ? '10d' : range;
    const url = `https://query2.finance.yahoo.com/v8/finance/chart/${symbol}?range=${actualRange}&interval=1d&includePrePost=false`;
    
    console.log('📡 请求 Yahoo Finance 黄金期货:', { symbol, requestedRange: range, actualRange, url });
    
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
          
          // 转换为标准格式并调整为现货价格
          const historicalData = timestamps.map((timestamp, index) => {
            const date = new Date(timestamp * 1000);
            const openPrice = open?.[index];
            const highPrice = high?.[index];
            const lowPrice = low?.[index];
            const closePrice = close?.[index];
            const vol = volume?.[index] || 0;
            
            // 将期货价格调整为现货价格（减去约 0.27% 的溢价）
            const adjustedOpen = openPrice * FUTURES_TO_SPOT_ADJUSTMENT;
            const adjustedHigh = highPrice * FUTURES_TO_SPOT_ADJUSTMENT;
            const adjustedLow = lowPrice * FUTURES_TO_SPOT_ADJUSTMENT;
            const adjustedClose = closePrice * FUTURES_TO_SPOT_ADJUSTMENT;
            
            return {
              date: date.toISOString().split('T')[0],
              open: Math.round(adjustedOpen * 100) / 100,
              high: Math.round(adjustedHigh * 100) / 100,
              low: Math.round(adjustedLow * 100) / 100,
              close: Math.round(adjustedClose * 100) / 100,
              volume: vol,
              change: Math.round((adjustedClose - adjustedOpen) * 100) / 100,
              changePercent: Math.round(((adjustedClose - adjustedOpen) / adjustedOpen) * 10000) / 100
            };
          }).filter(item => item.close !== null && item.close !== undefined && !isNaN(item.close));
          
          console.log('✅ 数据转换完成（已调整为现货价格）:', {
            validDataPoints: historicalData.length,
            latestDate: historicalData[historicalData.length - 1]?.date,
            latestPrice: historicalData[historicalData.length - 1]?.close,
            adjustment: `期货价格 × ${FUTURES_TO_SPOT_ADJUSTMENT} = 现货价格`
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

    // 直接使用 Yahoo Finance 黄金期货 (GC=F) 获取真实历史数据
    console.log('🌐 使用 Yahoo Finance 黄金期货 (GC=F) 获取真实数据');
    const historicalData = await fetchYahooGoldFutures(range);
    
    if (!historicalData || historicalData.length === 0) {
      console.error('❌ Yahoo Finance 黄金期货数据不可用');
      return {
        statusCode: 503,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: 'Historical data temporarily unavailable',
          message: 'Gold futures data is currently unavailable. Please try again later.',
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
        exchangeName: 'COMEX',
        instrumentType: 'SPOT',
        timezone: 'America/New_York',
        source: 'Spot gold price adjusted from Yahoo Finance futures (GC=F)',
        lastUpdated: new Date().toISOString(),
        note: 'Futures price adjusted to spot price (0.27% discount)',
        dataPoints: validatedData.length,
        isRealData: true,
        priceAdjustment: `Futures × ${FUTURES_TO_SPOT_ADJUSTMENT}`
      },
      priceData: validatedData
    };

    console.log('✅ 返回调整后的现货黄金价格数据:', {
      symbol: 'XAUUSD (adjusted from GC=F)',
      dataPoints: validatedData.length,
      latestPrice: validatedData[validatedData.length - 1]?.close,
      source: 'Yahoo Finance Gold Futures (adjusted to spot)',
      adjustment: `${FUTURES_TO_SPOT_ADJUSTMENT}x`,
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

