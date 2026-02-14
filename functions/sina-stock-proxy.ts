/**
 * Cloudflare Pages Function: 新浪股票代理
 * 获取A股指数历史价格数据
 */

interface Env {
  // 环境变量
}

export async function onRequest(context: { request: Request; env: Env }) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (context.request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const url = new URL(context.request.url);
    const symbol = url.searchParams.get('symbol') || 'sh000001';
    
    console.log('📊 获取新浪财经股票历史数据:', symbol);
    
    // 新浪财经历史数据API
    const historyUrl = `https://money.finance.sina.com.cn/quotes_service/api/json_v2.php/CN_MarketData.getKLineData?symbol=${symbol}&scale=240&ma=no&datalen=15`;
    
    const response = await fetch(historyUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://finance.sina.com.cn/'
      }
    });

    const data = await response.json();
    
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('历史数据格式错误或为空');
    }
    
    // 转换为标准格式
    const priceData = data
      .filter((item: any) => item && item.day)
      .map((item: any) => {
        const open = parseFloat(item.open);
        const close = parseFloat(item.close);
        return {
          date: item.day,
          open: open.toFixed(2),
          high: parseFloat(item.high).toFixed(2),
          low: parseFloat(item.low).toFixed(2),
          close: close.toFixed(2),
          volume: item.volume || '0',
          change: (close - open).toFixed(2),
          changePercent: ((close - open) / open * 100).toFixed(2)
        };
      });
    
    // 过滤周末，只保留工作日
    const weekdayData = priceData.filter((item: any) => {
      const date = new Date(item.date);
      const dayOfWeek = date.getDay();
      return dayOfWeek !== 0 && dayOfWeek !== 6;
    });
    
    const recentData = weekdayData.slice(-5);
    const latestData = recentData[recentData.length - 1];
    
    return new Response(JSON.stringify({
      symbol,
      name: '上证指数',
      current: latestData.close,
      open: latestData.open,
      high: latestData.high,
      low: latestData.low,
      prevClose: recentData.length > 1 ? recentData[recentData.length - 2].close : latestData.open,
      change: latestData.change,
      changePercent: latestData.changePercent,
      date: latestData.date,
      time: '15:00:00',
      priceData: recentData
    }), {
      status: 200,
      headers: corsHeaders
    });

  } catch (error: any) {
    console.error('❌ 新浪股票代理失败:', error);
    
    return new Response(JSON.stringify({
      error: '获取股票数据失败',
      message: error.message
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}
