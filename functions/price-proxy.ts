/**
 * Cloudflare Pages Function: Alpha Vantage API 代理
 */

interface Env {
  ALPHA_VANTAGE_API_KEY?: string;
  VITE_ALPHA_VANTAGE_API_KEY?: string;
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
    const apiKey = context.env.VITE_ALPHA_VANTAGE_API_KEY || context.env.ALPHA_VANTAGE_API_KEY;
    
    if (!apiKey) {
      return new Response(JSON.stringify({ 
        error: 'Alpha Vantage API key not configured'
      }), {
        status: 500,
        headers: corsHeaders
      });
    }

    const url = new URL(context.request.url);
    const func = url.searchParams.get('function');
    const symbol = url.searchParams.get('symbol');
    const outputsize = url.searchParams.get('outputsize');
    const interval = url.searchParams.get('interval');
    
    if (!func || !symbol) {
      return new Response(JSON.stringify({ 
        error: 'Parameters "function" and "symbol" are required' 
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // 构建 Alpha Vantage API URL
    const params = new URLSearchParams({
      function: func,
      symbol,
      apikey: apiKey
    });

    if (outputsize) params.append('outputsize', outputsize);
    if (interval) params.append('interval', interval);

    const apiUrl = `https://www.alphavantage.co/query?${params.toString()}`;
    
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Investment-News-Analyzer/1.0'
      }
    });

    const data = await response.json();
    
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: {
        ...corsHeaders,
        'Cache-Control': 'public, max-age=300'
      }
    });

  } catch (error: any) {
    console.error('Price proxy error:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}
