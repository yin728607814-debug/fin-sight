/**
 * Finnhub 黄金价格代理
 * 获取实时黄金价格数据 (XAU/USD)
 */

const axios = require('axios');

exports.handler = async function(event, _context) {
  // 设置CORS头
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
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
    const { range = '5d' } = event.queryStringParameters || {};
    
    // 从环境变量获取 Finnhub API Key
    const apiKey = process.env.VITE_FINNHUB_API_KEY;
    
    if (!apiKey) {
      throw new Error('Finnhub API Key 未配置');
    }

    console.log('📡 Finnhub Gold Price Proxy - 获取黄金价格数据');

    // 计算时间范围
    const now = Math.floor(Date.now() / 1000);
    let from;
    
    switch(range) {
      case '1d':
        from = now - (24 * 60 * 60);
        break;
      case '5d':
        from = now - (7 * 24 * 60 * 60); // 7天确保有5个交易日
        break;
      case '1mo':
        from = now - (30 * 24 * 60 * 60);
        break;
      default:
        from = now - (7 * 24 * 60 * 60);
    }

    // 获取黄金价格历史数据 (使用外汇 candles API)
    // XAU/USD 是黄金对美元的外汇对
    const candlesUrl = `https://finnhub.io/api/v1/forex/candle`;
    
    console.log('🌐 请求 Finnhub Forex Candles API:', {
      symbol: 'OANDA:XAU_USD',
      from: new Date(from * 1000).toISOString(),
      to: new Date(now * 1000).toISOString()
    });

    const response = await axios.get(candlesUrl, {
      params: {
        symbol: 'OANDA:XAU_USD', // Oanda 的黄金外汇对
        resolution: 'D', // 日线数据
        from: from,
        to: now,
        token: apiKey
      },
      timeout: 15000
    });

    const data = response.data;

    if (data.s !== 'ok' || !data.c || data.c.length === 0) {
      console.error('❌ Finnhub 返回无效数据:', data);
      throw new Error('Finnhub API 返回无效数据');
    }

    // 转换为标准格式
    const priceData = [];
    for (let i = 0; i < data.t.length; i++) {
      const date = new Date(data.t[i] * 1000);
      const open = data.o[i];
      const high = data.h[i];
      const low = data.l[i];
      const close = data.c[i];
      const volume = data.v?.[i] || 0;

      priceData.push({
        date: date.toISOString().split('T')[0],
        open: Math.round(open * 100) / 100,
        high: Math.round(high * 100) / 100,
        low: Math.round(low * 100) / 100,
        close: Math.round(close * 100) / 100,
        volume: volume,
        change: Math.round((close - open) * 100) / 100,
        changePercent: Math.round(((close - open) / open) * 10000) / 100
      });
    }

    // 过滤掉周末数据
    const weekdayData = priceData.filter(item => {
      const date = new Date(item.date);
      const dayOfWeek = date.getDay();
      return dayOfWeek !== 0 && dayOfWeek !== 6;
    });

    // 只返回最近的N个交易日
    const days = range === '1d' ? 1 : 5;
    const finalData = weekdayData.slice(-days);

    console.log('✅ Finnhub 黄金价格数据获取成功:', {
      totalPoints: data.t.length,
      weekdayPoints: weekdayData.length,
      finalPoints: finalData.length,
      latestPrice: finalData[finalData.length - 1]?.close
    });

    const responseData = {
      symbol: 'XAUUSD',
      originalSymbol: 'gold',
      meta: {
        currency: 'USD',
        exchangeName: 'OANDA',
        instrumentType: 'FOREX',
        timezone: 'UTC',
        source: 'Finnhub Forex API (OANDA:XAU_USD)',
        lastUpdated: new Date().toISOString(),
        dataPoints: finalData.length,
        isRealData: true
      },
      priceData: finalData
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(responseData)
    };

  } catch (error) {
    console.error('❌ Finnhub Gold Price Proxy 失败:', error.message);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};
