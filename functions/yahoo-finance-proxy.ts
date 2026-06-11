/**
 * Cloudflare Pages Function: Yahoo Finance API 代理
 * 获取纳斯达克和黄金价格数据
 */

interface Env {
  // 环境变量接口（虽然这个 function 不需要，但保持一致性）
}

export async function onRequest(context: { request: Request; env: Env }) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  // 处理 OPTIONS 预检请求
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // 只允许 GET 请求
  if (context.request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: corsHeaders
    });
  }

  try {
    const url = new URL(context.request.url);
    const symbol = url.searchParams.get('symbol');
    const range = url.searchParams.get('range') || '5d';
    const interval = url.searchParams.get('interval') || '1d';

    console.log('📥 Yahoo Finance 请求:', { symbol, range, interval });

    if (!symbol) {
      return new Response(JSON.stringify({ error: 'Parameter "symbol" is required' }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // 映射符号到 Yahoo Finance 格式
    const symbolMap: Record<string, string> = {
      'nasdaq': '^NDX',
      'NDX': '^NDX',
      'gold': 'GC=F',
      'GOLD': 'GC=F',
      'XAUUSD': 'XAUUSD=X',
      'XAUCNY': 'XAUCNY=X'
    };

    const yahooSymbol = symbolMap[symbol] || symbol;
    const apiUrl = `https://query2.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?range=${range}&interval=${interval}&includePrePost=false&events=div%2Csplit`;

    console.log('🌐 Yahoo Finance URL:', apiUrl);

    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });

    const data = await response.json();

    console.log('📡 Yahoo Finance 响应:', {
      hasResult: !!data.chart?.result,
      hasError: !!data.chart?.error
    });

    if (data.chart?.error) {
      return new Response(JSON.stringify({
        error: 'Yahoo Finance API error',
        details: data.chart.error
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    const result = data.chart?.result?.[0];
    if (!result) {
      return new Response(JSON.stringify({
        error: 'No data found',
        symbol: yahooSymbol
      }), {
        status: 404,
        headers: corsHeaders
      });
    }

    const timestamps = result.timestamp || [];
    const quotes = result.indicators?.quote?.[0] || {};
    const { open, high, low, close, volume } = quotes;

    const priceData = timestamps.map((timestamp: number, index: number) => {
      const date = new Date(timestamp * 1000);
      const openPrice = open?.[index];
      const closePrice = close?.[index];
      const highPrice = high?.[index];
      const lowPrice = low?.[index];
      const volumeData = volume?.[index] || 0;

      let change = 0;
      let changePercent = 0;

      // 计算日涨跌幅：相对于前一个交易日的收盘价
      if (index > 0 && close?.[index - 1] && closePrice) {
        const previousClose = close[index - 1];
        change = closePrice - previousClose;
        changePercent = (change / previousClose) * 100;
      }

      return {
        date: date.toISOString().split('T')[0],
        open: openPrice,
        high: highPrice,
        low: lowPrice,
        close: closePrice,
        volume: volumeData,
        change,
        changePercent
      };
    }).filter((item: any) => {
      // 过滤掉无效数据：null、undefined、NaN 或 0
      // 注意：0 也被视为无效，因为股票/指数价格不可能为 0
      return item.close !== null && 
             item.close !== undefined && 
             !isNaN(item.close) && 
             item.close > 0;
    });

    const responseData = {
      symbol: yahooSymbol,
      originalSymbol: symbol,
      meta: {
        currency: result.meta?.currency || 'USD',
        exchangeName: result.meta?.exchangeName || 'NASDAQ',
        instrumentType: result.meta?.instrumentType || 'INDEX',
        timezone: result.meta?.timezone || 'EST'
      },
      priceData
    };

    console.log('✅ Yahoo Finance 成功:', {
      symbol: yahooSymbol,
      dataPoints: priceData.length,
      dateRange: priceData.length > 0 ? {
        first: priceData[0]?.date,
        last: priceData[priceData.length - 1]?.date
      } : null,
      sampleData: priceData.slice(-2).map((item: any) => ({
        date: item.date,
        close: item.close,
        change: item.change?.toFixed(2),
        changePercent: item.changePercent?.toFixed(2) + '%'
      }))
    });

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Cache-Control': 'public, max-age=300'
      }
    });

  } catch (error) {
    console.error('❌ Yahoo Finance 错误:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';

    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: message
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}
