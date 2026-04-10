/**
 * Cloudflare Pages Function: Alpha Vantage API 代理
 * 获取纳斯达克100 (QQQ ETF) 价格数据
 * 支持 yfinance 作为备用数据源
 */

interface Env {
  ALPHA_VANTAGE_API_KEY: string;
  YFINANCE_API_URL?: string; // yfinance API 端点（可选）
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
    const symbol = url.searchParams.get('symbol') || 'nasdaq';
    const days = parseInt(url.searchParams.get('days') || '5');
    const useYfinance = url.searchParams.get('source') === 'yfinance';

    console.log('📥 Alpha Vantage 请求:', { symbol, days, useYfinance });

    // 映射符号到对应格式
    const symbolMap: Record<string, string> = {
      'nasdaq': 'QQQ',  // Nasdaq 100 ETF
      'NDX': '^NDX',    // yfinance 使用 ^NDX
      'QQQ': 'QQQ'
    };

    const avSymbol = symbolMap[symbol] || symbol;
    const yfinanceSymbol = symbol === 'nasdaq' ? '^NDX' : avSymbol;

    // 优先尝试使用 Yahoo Finance API 动态获取数据
    if (useYfinance || !context.env.ALPHA_VANTAGE_API_KEY) {
      console.log('🐍 使用 Yahoo Finance API 动态获取数据');
      
      // 尝试调用 Yahoo Finance API 获取实时数据
      const yfinanceUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yfinanceSymbol)}?range=10d&interval=1d`;
      
      try {
        console.log('📡 请求 Yahoo Finance:', yfinanceUrl);
        
        const yfinanceResponse = await fetch(yfinanceUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json'
          }
        });

        if (yfinanceResponse.ok) {
          const yfinanceData = await yfinanceResponse.json();
          
          console.log('📊 Yahoo Finance 响应:', {
            hasChart: !!yfinanceData?.chart,
            hasResult: !!yfinanceData?.chart?.result?.[0]
          });
          
          if (yfinanceData?.chart?.result?.[0]) {
            const result = yfinanceData.chart.result[0];
            const timestamps = result.timestamp || [];
            const quotes = result.indicators?.quote?.[0] || {};
            
            console.log('📈 数据点数量:', timestamps.length);
            
            // 转换数据格式
            const priceData = timestamps
              .map((ts: number, index: number) => {
                const date = new Date(ts * 1000);
                const open = quotes.open?.[index];
                const high = quotes.high?.[index];
                const low = quotes.low?.[index];
                const close = quotes.close?.[index];
                const volume = quotes.volume?.[index];
                
                // 过滤掉 null 值
                if (!close || close === null) {
                  return null;
                }
                
                return {
                  date: date.toISOString().split('T')[0],
                  open: open || 0,
                  high: high || 0,
                  low: low || 0,
                  close: close,
                  volume: volume || 0,
                  timestamp: ts
                };
              })
              .filter((item: { date: string; open: number; high: number; low: number; close: number; volume: number; timestamp: number } | null): item is { date: string; open: number; high: number; low: number; close: number; volume: number; timestamp: number } => item !== null);

            // 计算涨跌幅
            const priceDataWithChange = priceData.map((item: { date: string; open: number; high: number; low: number; close: number; volume: number; timestamp: number }, index: number) => {
              let change = 0;
              let changePercent = 0;
              
              if (index > 0) {
                const previousClose = priceData[index - 1].close;
                change = item.close - previousClose;
                changePercent = (change / previousClose) * 100;
              }
              
              return { 
                date: item.date,
                open: item.open,
                high: item.high,
                low: item.low,
                close: item.close,
                volume: item.volume,
                change, 
                changePercent 
              };
            });

            // 只返回请求的天数
            const filteredData = priceDataWithChange.slice(-days);

            console.log('✅ Yahoo Finance API 成功:', {
              symbol: yfinanceSymbol,
              dataPoints: filteredData.length,
              latestDate: filteredData[filteredData.length - 1]?.date,
              latestClose: filteredData[filteredData.length - 1]?.close
            });

            return new Response(JSON.stringify({
              symbol: yfinanceSymbol,
              originalSymbol: symbol,
              source: 'yahoo-finance-api',
              meta: {
                currency: 'USD',
                exchangeName: 'NASDAQ',
                instrumentType: 'INDEX',
                note: 'Real-time data from Yahoo Finance API'
              },
              priceData: filteredData
            }), {
              status: 200,
              headers: {
                ...corsHeaders,
                'Cache-Control': 'public, max-age=300'
              }
            });
          }
        }
        
        console.warn('⚠️ Yahoo Finance API 响应异常:', yfinanceResponse.status);
      } catch (yfinanceError) {
        console.error('❌ Yahoo Finance API 失败:', yfinanceError);
      }
    }

    // 回退到 Alpha Vantage
    const apiKey = context.env.ALPHA_VANTAGE_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ 
        error: 'No data source available',
        details: 'Alpha Vantage API key not configured and yfinance failed'
      }), {
        status: 500,
        headers: corsHeaders
      });
    }

    const apiUrl = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${avSymbol}&apikey=${apiKey}&outputsize=compact`;

    console.log('🌐 Alpha Vantage URL:', apiUrl.replace(apiKey, '***'));

    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      }
    });

    const data = await response.json();

    console.log('📡 Alpha Vantage 响应:', {
      hasTimeSeries: !!data['Time Series (Daily)'],
      hasError: !!data['Error Message'],
      hasNote: !!data['Note']
    });

    // 检查 API 错误
    if (data['Error Message']) {
      return new Response(JSON.stringify({
        error: 'Alpha Vantage API error',
        details: data['Error Message']
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // 检查 API 限制
    if (data['Note']) {
      return new Response(JSON.stringify({
        error: 'API rate limit exceeded',
        details: data['Note'],
        note: 'Alpha Vantage free tier: 5 requests per minute, 500 per day'
      }), {
        status: 429,
        headers: corsHeaders
      });
    }

    const timeSeries = data['Time Series (Daily)'];
    if (!timeSeries) {
      return new Response(JSON.stringify({
        error: 'No data found',
        symbol: avSymbol
      }), {
        status: 404,
        headers: corsHeaders
      });
    }

    // 转换数据格式
    const dates = Object.keys(timeSeries).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    const recentDates = dates.slice(0, Math.max(days, 10)); // 至少获取10天数据

    const priceData = recentDates.map((dateStr, index) => {
      const dayData = timeSeries[dateStr];
      const open = parseFloat(dayData['1. open']);
      const high = parseFloat(dayData['2. high']);
      const low = parseFloat(dayData['3. low']);
      const close = parseFloat(dayData['4. close']);
      const volume = parseInt(dayData['5. volume']) || 0;

      // 计算日涨跌幅：相对于前一个交易日的收盘价
      let change = 0;
      let changePercent = 0;

      if (index < recentDates.length - 1) {
        const previousDateStr = recentDates[index + 1];
        const previousClose = parseFloat(timeSeries[previousDateStr]['4. close']);
        change = close - previousClose;
        changePercent = (change / previousClose) * 100;
      }

      return {
        date: dateStr,
        open,
        high,
        low,
        close,
        volume,
        change,
        changePercent
      };
    }).reverse(); // 按时间正序排列

    // 只返回请求的天数
    const filteredData = priceData.slice(-days);

    const responseData = {
      symbol: avSymbol,
      originalSymbol: symbol,
      source: 'alphavantage',
      meta: {
        currency: 'USD',
        exchangeName: 'NASDAQ',
        instrumentType: symbol === 'nasdaq' ? 'ETF' : 'STOCK',
        note: symbol === 'nasdaq' ? 'Using QQQ ETF as proxy for Nasdaq 100 Index' : undefined
      },
      priceData: filteredData
    };

    console.log('✅ Alpha Vantage 成功:', {
      symbol: avSymbol,
      dataPoints: filteredData.length,
      dateRange: filteredData.length > 0 ? {
        first: filteredData[0]?.date,
        last: filteredData[filteredData.length - 1]?.date
      } : null,
      sampleData: filteredData.slice(-2).map(item => ({
        date: item.date,
        close: item.close.toFixed(2),
        change: item.change?.toFixed(2),
        changePercent: item.changePercent?.toFixed(2) + '%'
      }))
    });

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Cache-Control': 'public, max-age=300' // 缓存5分钟
      }
    });

  } catch (error: unknown) {
    console.error('❌ Alpha Vantage 错误:', error);

    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}
