/**
 * Cloudflare Pages Function: 极速数据新闻代理 (修复版)
 * 移除所有假新闻，只返回真实数据或空数组
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

  // 在函数开始就解析URL参数，确保在catch块中也能访问
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

  // 构建请求URL（在try块外定义，确保catch块能访问）
  let requestUrl = '';
  if (searchKeyword) {
    requestUrl = `https://api.jisuapi.com/news/search?appkey=${apiKey || 'NO_KEY'}&keyword=${encodeURIComponent(searchKeyword)}&num=${num}`;
  } else {
    requestUrl = `https://api.jisuapi.com/news/get?appkey=${apiKey || 'NO_KEY'}&channel=${encodeURIComponent(category)}&num=${num}`;
  }

  try {
    // 检查API密钥是否为占位符或未配置
    const isValidApiKey = apiKey && 
                         apiKey !== 'your_jisu_api_key_here' && 
                         apiKey !== 'placeholder' && 
                         apiKey.length > 10;

    if (!isValidApiKey) {
      console.log('⚠️ 极速数据API密钥未配置，返回空数组');
      
      return new Response(JSON.stringify({ 
        status: 'ok',
        totalResults: 0,
        articles: [], // 返回空数组，不返回假新闻
        debug: {
          message: '极速数据 API Key 未配置，无法获取新闻',
          apiKeyStatus: apiKey ? '占位符' : '未配置',
          isTestData: false
        }
      }), {
        status: 200,
        headers: corsHeaders
      });
    }

    console.log('📡 极速数据请求:', { category, type, searchKeyword, num });
    console.log('🔗 请求URL:', requestUrl.replace(apiKey, 'API_KEY_HIDDEN'));

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

    console.log('✅ 极速数据完整响应:', {
      status: response.status,
      responseData: data,
      dataKeys: Object.keys(data || {}),
      articlesCount: data.result?.list?.length || 0
    });

    // 检查API响应状态
    if (data.status !== 0 && data.status !== '0') {
      console.error('❌ 极速数据API返回错误:', data);
      
      // 如果是接口停用或其他API错误，返回空数组
      const isApiDisabled = data.msg && (data.msg.includes('停用') || data.msg.includes('disabled'));
      const isApiError = data.status === '108' || data.status === 108;
      
      if (isApiDisabled || isApiError) {
        console.log('🔧 极速数据API不可用，返回空数组');
        
        return new Response(JSON.stringify({
          status: 'ok',
          totalResults: 0,
          articles: [], // 返回空数组，不返回假新闻
          debug: {
            error: `极速数据API错误: ${data.msg || data.message || '未知错误'}`,
            isTestData: false,
            reason: 'API接口不可用',
            requestUrl: requestUrl.replace(apiKey || '', 'API_KEY_HIDDEN')
          }
        }), {
          status: 200,
          headers: corsHeaders
        });
      }
      
      return new Response(JSON.stringify({
        error: `极速数据API错误: ${data.msg || data.message || '未知错误'}`,
        articles: [],
        totalResults: 0,
        debug: {
          apiResponse: data,
          requestUrl: requestUrl.replace(apiKey || '', 'API_KEY_HIDDEN')
        }
      }), {
        status: 200, // 返回200但包含错误信息
        headers: corsHeaders
      });
    }

    // 转换为统一格式 - 支持多种可能的响应格式
    let articlesList = [];
    
    // 尝试不同的数据路径
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

    console.log('📊 找到的文章列表:', { 
      articlesCount: articlesList.length,
      sampleArticle: articlesList[0] || null 
    });

    const articles = articlesList.map((item: unknown) => {
      const article = item as Record<string, unknown>;
      return {
        title: article.title || article.headline || '',
        description: article.content || article.summary || article.description || '',
        content: article.content || article.summary || article.description || '',
        url: article.weburl || article.url || article.link || '#',
        urlToImage: article.pic || article.image || article.thumbnail || '',
        publishedAt: article.time || article.publishedAt || article.date || new Date().toISOString(),
        source: { name: article.src || article.source || '极速数据' },
        author: article.src || article.source || article.author || '极速数据'
      };
    });

    return new Response(JSON.stringify({
      status: 'ok',
      totalResults: articles.length,
      articles: articles,
      debug: {
        originalResponse: data,
        requestUrl: requestUrl.replace(apiKey || '', 'API_KEY_HIDDEN'),
        foundArticles: articles.length
      }
    }), {
      status: 200,
      headers: corsHeaders
    });

  } catch (error: unknown) {
    console.error('❌ 极速数据错误:', error);

    const errorMessage = error instanceof Error ? error.message : '未知错误';

    // 如果是API密钥问题或网络问题，返回空数组
    const isApiKeyIssue = errorMessage.includes('401') || errorMessage.includes('403') || errorMessage.includes('Unauthorized');
    const isNetworkIssue = errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('timeout');

    if (isApiKeyIssue || isNetworkIssue) {
      console.log('🔧 极速数据API不可用，返回空数组');
      
      return new Response(JSON.stringify({
        status: 'ok',
        totalResults: 0,
        articles: [], // 返回空数组，不返回假新闻
        debug: {
          error: errorMessage,
          isTestData: false,
          reason: isApiKeyIssue ? 'API密钥问题' : '网络问题',
          requestUrl: requestUrl.replace(apiKey || '', 'API_KEY_HIDDEN')
        }
      }), {
        status: 200,
        headers: corsHeaders
      });
    }

    // 对于其他错误，也返回空数组而不是假新闻
    console.log('🔧 极速数据出现其他错误，返回空数组');
    
    return new Response(JSON.stringify({
      status: 'ok',
      totalResults: 0,
      articles: [], // 返回空数组，不返回假新闻
      debug: {
        error: errorMessage,
        isTestData: false,
        reason: '服务器错误',
        requestUrl: requestUrl.replace(apiKey || '', 'API_KEY_HIDDEN')
      }
    }), {
      status: 200,
      headers: corsHeaders
    });
  }
}