/**
 * Cloudflare Pages Function: 极速数据新闻代理
 * 稳定的中文新闻API服务
 */

interface Env {
  VITE_JISU_API_KEY?: string;
  JISU_API_KEY?: string;
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
    const category = url.searchParams.get('category') || '财经'; // 默认财经频道
    const type = url.searchParams.get('type') || ''; // 分析类型：gold, nasdaq等
    const num = url.searchParams.get('num') || '50'; // 默认50条
    
    // 根据分析类型调整搜索关键词
    let searchKeyword = '';
    if (type === 'gold') {
      searchKeyword = '黄金';
    } else if (type === 'nasdaq') {
      searchKeyword = '纳斯达克';
    }

    const apiKey = context.env.VITE_JISU_API_KEY || context.env.JISU_API_KEY;

    if (!apiKey) {
      return new Response(JSON.stringify({ 
        error: '极速数据 API Key 未配置',
        articles: [],
        total: 0 
      }), {
        status: 500,
        headers: corsHeaders
      });
    }

    console.log('📡 极速数据请求:', { category, type, searchKeyword, num });

    // 极速数据新闻API - 如果有特定关键词，使用搜索接口
    let requestUrl;
    if (searchKeyword) {
      requestUrl = `https://api.jisuapi.com/news/search?appkey=${apiKey}&keyword=${encodeURIComponent(searchKeyword)}&num=${num}`;
    } else {
      requestUrl = `https://api.jisuapi.com/news/get?appkey=${apiKey}&channel=${encodeURIComponent(category)}&num=${num}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(requestUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Referer': 'https://www.jisuapi.com/'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const data = await response.json();

    console.log('✅ 极速数据响应:', {
      status: response.status,
      dataStatus: data.status,
      articlesCount: data.result?.list?.length || 0
    });

    // 转换为统一格式
    const articles = (data.result?.list || []).map((item: unknown) => {
      const article = item as Record<string, unknown>;
      return {
        title: article.title || '',
        description: article.content || '',
        content: article.content || '',
        url: article.weburl || article.url || '#',
        urlToImage: article.pic || '',
        publishedAt: article.time || new Date().toISOString(),
        source: { name: article.src || '极速数据' },
        author: article.src || '极速数据'
      };
    });

    return new Response(JSON.stringify({
      status: 'ok',
      totalResults: articles.length,
      articles: articles
    }), {
      status: 200,
      headers: corsHeaders
    });

  } catch (error: unknown) {
    console.error('❌ 极速数据错误:', error);

    const errorMessage = error instanceof Error ? error.message : '未知错误';

    return new Response(JSON.stringify({
      status: 'error',
      message: errorMessage,
      articles: [],
      totalResults: 0
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}