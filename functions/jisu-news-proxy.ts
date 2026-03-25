/**
 * Cloudflare Pages Function: 极速数据新闻代理
 * 只返回真实API数据，不使用假新闻fallback
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

  const url = new URL(context.request.url);
  const category = url.searchParams.get('category') || '财经';
  const num = url.searchParams.get('num') || '50';
  
  const apiKey = context.env.VITE_JISU_API_KEY || context.env.JISU_API_KEY;

  // 只使用频道接口（搜索接口已停用）
  const requestUrl = `https://api.jisuapi.com/news/get?appkey=${apiKey || 'NO_KEY'}&channel=${encodeURIComponent(category)}&num=${num}`;

  try {
    const isValidApiKey = apiKey && 
                         apiKey !== 'your_jisu_api_key_here' && 
                         apiKey !== 'placeholder' && 
                         apiKey.length > 10;

    if (!isValidApiKey) {
      console.log('⚠️ 极速数据API密钥未配置');
      
      return new Response(JSON.stringify({ 
        status: 'error',
        totalResults: 0,
        articles: [],
        debug: {
          message: '极速数据 API Key 未配置',
          apiKeyStatus: apiKey ? '占位符' : '未配置'
        }
      }), {
        status: 200,
        headers: corsHeaders
      });
    }

    console.log('📡 极速数据请求:', { category, num });
    console.log('🔗 请求URL:', requestUrl.replace(apiKey, 'API_KEY_HIDDEN'));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(requestUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Referer': 'https://www.jisuapi.com/'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const data = await response.json();

    console.log('✅ 极速数据响应:', {
      status: response.status,
      apiStatus: data.status,
      articlesCount: data.result?.list?.length || 0
    });

    if (data.status !== 0 && data.status !== '0') {
      console.error('❌ 极速数据API返回错误:', data);
      
      return new Response(JSON.stringify({
        status: 'error',
        totalResults: 0,
        articles: [],
        debug: {
          error: `极速数据API错误: ${data.msg || data.message || '未知错误'}`,
          requestUrl: requestUrl.replace(apiKey || '', 'API_KEY_HIDDEN'),
          originalApiStatus: data.status,
          originalApiMessage: data.msg || data.message
        }
      }), {
        status: 200,
        headers: corsHeaders
      });
    }

    // 转换为统一格式
    let articlesList = [];
    
    if (data.result && data.result.list) {
      articlesList = data.result.list;
    } else if (data.result && Array.isArray(data.result)) {
      articlesList = data.result;
    } else if (data.data && data.data.list) {
      articlesList = data.data.list;
    } else if (data.data && Array.isArray(data.data)) {
      articlesList = data.data;
    } else if (Array.isArray(data)) {
      articlesList = data;
    }

    const articles = articlesList.map((item: any) => ({
      title: item.title || item.headline || '',
      description: item.content || item.summary || item.description || '',
      content: item.content || item.summary || item.description || '',
      url: item.weburl || item.url || item.link || '#',
      urlToImage: item.pic || item.image || item.thumbnail || '',
      publishedAt: item.time || item.publishedAt || item.date || new Date().toISOString(),
      source: { name: item.src || item.source || '极速数据' },
      author: item.src || item.source || item.author || '极速数据'
    }));

    return new Response(JSON.stringify({
      status: 'ok',
      totalResults: articles.length,
      articles: articles,
      debug: {
        requestUrl: requestUrl.replace(apiKey || '', 'API_KEY_HIDDEN'),
        foundArticles: articles.length
      }
    }), {
      status: 200,
      headers: corsHeaders
    });

  } catch (error: any) {
    console.error('❌ 极速数据错误:', error);

    const errorMessage = error instanceof Error ? error.message : '未知错误';

    return new Response(JSON.stringify({
      status: 'error',
      totalResults: 0,
      articles: [],
      debug: {
        error: errorMessage,
        requestUrl: requestUrl.replace(apiKey || '', 'API_KEY_HIDDEN')
      }
    }), {
      status: 200,
      headers: corsHeaders
    });
  }
}
