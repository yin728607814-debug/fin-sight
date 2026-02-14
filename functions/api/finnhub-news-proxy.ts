/**
 * Cloudflare Pages Function: Finnhub 新闻代理
 */

interface Env {
  VITE_FINNHUB_API_KEY?: string;
  FINNHUB_API_KEY?: string;
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
    const symbol = url.searchParams.get('symbol');
    const category = url.searchParams.get('category');
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');

    const apiKey = context.env.VITE_FINNHUB_API_KEY || context.env.FINNHUB_API_KEY;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Finnhub API Key 未配置' }), {
        status: 500,
        headers: corsHeaders
      });
    }

    console.log('📡 Finnhub 请求:', { symbol, category, from, to });

    let apiUrl = 'https://finnhub.io/api/v1/';
    const params = new URLSearchParams({ token: apiKey });

    if (symbol) {
      apiUrl += 'company-news';
      params.append('symbol', symbol);
      if (from) params.append('from', from);
      if (to) params.append('to', to);
    } else if (category) {
      apiUrl += 'news';
      params.append('category', category);
    } else {
      apiUrl += 'news';
      params.append('category', 'general');
    }

    const response = await fetch(`${apiUrl}?${params.toString()}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const data = await response.json();

    console.log('✅ Finnhub 响应:', {
      status: response.status,
      dataLength: Array.isArray(data) ? data.length : 0
    });

    return new Response(JSON.stringify({
      status: 'ok',
      articles: data || [],
      total: Array.isArray(data) ? data.length : 0
    }), {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    console.error('❌ Finnhub 错误:', error);

    return new Response(JSON.stringify({
      status: 'error',
      message: error.message,
      articles: [],
      total: 0
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}
