/**
 * Netlify函数 - 获取真实黄金历史价格数据
 * 从 Investing.com 获取准确的黄金现货价格数据
 */

const https = require('https');

// 从 Investing.com 获取黄金现货历史数据
async function fetchInvestingGoldData(range) {
  return new Promise((resolve, reject) => {
    // Investing.com 的黄金现货 (XAU/USD) 数据
    // 使用他们的图表数据 API
    const now = Math.floor(Date.now() / 1000);
    let from;
    
    switch(range) {
      case '1d':
        from = now - (24 * 60 * 60);
        break;
      case '5d':
        from = now - (7 * 24 * 60 * 60); // 7天确保有5个交易日
        break;
      default:
        from = now - (7 * 24 * 60 * 60);
    }
    
    // Investing.com 的 API 端点 (8830 是 XAU/USD 的 ID)
    const url = `https://api.investing.com/api/financialdata/historical/8830?start-date=${from}&end-date=${now}&time-frame=Daily&add-missing-rows=false`;
    
    console.log('📡 请求 Investing.com 黄金现货数据:', { 
      from: new Date(from * 1000).toISOString(), 
      to: new Date(now * 1000).toISOString() 
    });
    
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Referer': 'https://cn.investing.com/',
        'Origin': 'https://cn.investing.com'
      },
      timeout: 15000
    };
    
    https.get(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          
          if (!jsonData.data || !Array.isArray(jsonData.data)) {
            reject(new Error('Investing.com API 返回无效数据'));
            return;
          }
          
          console.log('📊 Investing.com 数据接收:', {
            dataPoints: jsonData.data.length
          });
          
          // 转换为标准格式
          const historicalData = jsonData.data.map(item => {
            const date = new Date(item.rowDate);
            return {
              date: date.toISOString().split('T')[0],
              open: parseFloat(item.last_open) || 0,
              high: parseFloat(item.last_max) || 0,
              low: parseFloat(item.last_min) || 0,
              close: parseFloat(item.last_close) || 0,
              volume: 0,
              change: parseFloat(item.change_precent) || 0,
              changePercent: parseFloat(item.change_precent) || 0
            };
          }).filter(item => item.close > 0);
          
          console.log('✅ 数据转换完成:', {
            validDataPoints: historicalData.length,
            latestDate: historicalData[historicalData.length - 1]?.date,
            latestPrice: historicalData[historicalData.length - 1]?.close,
            latestHigh: historicalData[historicalData.length - 1]?.high
          });
          
          resolve(historicalData);
        } catch (error) {
          reject(new Error(`Failed to parse Investing.com response: ${error.message}`));
        }
      });
    }).on('error', (error) => {
      reject(new Error(`Investing.com request failed: ${error.message}`));
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
    
    console.log('📥 获取 Investing.com 黄金历史价格数据:', { symbol, range });
    
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

    // 使用 Investing.com 获取黄金现货数据（最准确）
    const historicalData = await fetchInvestingGoldData(range);
    
    if (!historicalData || historicalData.length === 0) {
      console.error('❌ Investing.com 黄金现货数据不可用');
      return {
        statusCode: 503,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: 'Historical data temporarily unavailable',
          message: 'Investing.com gold spot data is currently unavailable. Please try again later.',
          timestamp: new Date().toISOString()
        })
      };
    }

    // 验证历史数据质量
    const validatedData = validateHistoricalData(historicalData);
    
    // 过滤周末数据
    const weekdayData = validatedData.filter(item => {
      const date = new Date(item.date);
      const dayOfWeek = date.getDay();
      return dayOfWeek !== 0 && dayOfWeek !== 6;
    });
    
    // 只返回最近的N个交易日
    const days = range === '1d' ? 1 : 5;
    const finalData = weekdayData.slice(-days);
    
    const responseData = {
      symbol: 'XAUUSD',
      originalSymbol: 'gold',
      meta: {
        currency: 'USD',
        exchangeName: 'SPOT',
        instrumentType: 'FOREX',
        timezone: 'UTC',
        source: 'Investing.com (XAU/USD)',
        lastUpdated: new Date().toISOString(),
        note: 'Accurate spot gold price from Investing.com',
        dataPoints: finalData.length,
        isRealData: true
      },
      priceData: finalData
    };

    console.log('✅ 返回黄金价格数据:', {
      symbol: 'XAUUSD',
      dataPoints: finalData.length,
      latestPrice: finalData[finalData.length - 1]?.close,
      latestHigh: finalData[finalData.length - 1]?.high,
      source: 'Investing.com',
      dateRange: {
        from: finalData[0]?.date,
        to: finalData[finalData.length - 1]?.date
      }
    });

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60' // 缓存1分钟
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
        details: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};

// 导出 handler
module.exports = { handler };
