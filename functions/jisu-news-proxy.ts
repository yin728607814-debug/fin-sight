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
      console.log('⚠️ 极速数据API密钥未配置或为占位符，返回测试数据');
      
      const testArticles = generateTestNews(type, category);
      
      return new Response(JSON.stringify({ 
        status: 'ok',
        totalResults: testArticles.length,
        articles: testArticles,
        debug: {
          message: '极速数据 API Key 未配置，使用测试数据',
          apiKeyStatus: apiKey ? '占位符' : '未配置',
          isTestData: true
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

    // 如果是API密钥问题或网络问题，返回一些测试数据
    const isApiKeyIssue = errorMessage.includes('401') || errorMessage.includes('403') || errorMessage.includes('Unauthorized');
    const isNetworkIssue = errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('timeout');

    if (isApiKeyIssue || isNetworkIssue) {
      console.log('🔧 极速数据API不可用，返回测试数据');
      
      // 根据类型返回相关的测试新闻
      const testArticles = generateTestNews(type, category);
      
      return new Response(JSON.stringify({
        status: 'ok',
        totalResults: testArticles.length,
        articles: testArticles,
        debug: {
          error: errorMessage,
          isTestData: true,
          reason: isApiKeyIssue ? 'API密钥问题' : '网络问题',
          requestUrl: requestUrl.replace(apiKey || '', 'API_KEY_HIDDEN')
        }
      }), {
        status: 200,
        headers: corsHeaders
      });
    }

    // 对于其他错误，也返回测试数据而不是500错误
    console.log('🔧 极速数据出现其他错误，返回测试数据');
    const testArticles = generateTestNews(type, category);
    
    return new Response(JSON.stringify({
      status: 'ok',
      totalResults: testArticles.length,
      articles: testArticles,
      debug: {
        error: errorMessage,
        isTestData: true,
        reason: '服务器错误，使用测试数据',
        requestUrl: requestUrl.replace(apiKey || '', 'API_KEY_HIDDEN')
      }
    }), {
      status: 200,
      headers: corsHeaders
    });
  }
}

// 生成测试新闻数据
function generateTestNews(type: string, _category: string) {
  const testNews = {
    gold: [
      {
        title: '国际黄金价格今日上涨1.2%，避险需求推动金价走高',
        description: '受地缘政治紧张局势影响，投资者避险情绪升温，国际黄金价格今日上涨1.2%，突破重要阻力位。',
        content: '受地缘政治紧张局势影响，投资者避险情绪升温，国际黄金价格今日上涨1.2%，突破重要阻力位。分析师认为，在全球经济不确定性增加的背景下，黄金作为避险资产的吸引力进一步增强。',
        url: '#',
        urlToImage: '',
        publishedAt: new Date().toISOString(),
        source: { name: '极速数据(测试)' },
        author: '极速数据'
      },
      {
        title: '央行黄金储备连续增持，专家看好后市表现',
        description: '多国央行持续增持黄金储备，显示出对黄金长期价值的认可，专家普遍看好黄金后市表现。',
        content: '多国央行持续增持黄金储备，显示出对黄金长期价值的认可。数据显示，今年以来全球央行黄金购买量创历史新高，专家普遍看好黄金后市表现。',
        url: '#',
        urlToImage: '',
        publishedAt: new Date(Date.now() - 3600000).toISOString(),
        source: { name: '极速数据(测试)' },
        author: '极速数据'
      }
    ],
    nasdaq: [
      {
        title: '纳斯达克指数创历史新高，科技股强势领涨',
        description: '在人工智能概念股的带动下，纳斯达克指数今日创下历史新高，科技股表现强势。',
        content: '在人工智能概念股的带动下，纳斯达克指数今日创下历史新高。苹果、微软、谷歌等科技巨头股价均创新高，投资者对科技行业前景保持乐观。',
        url: '#',
        urlToImage: '',
        publishedAt: new Date().toISOString(),
        source: { name: '极速数据(测试)' },
        author: '极速数据'
      },
      {
        title: '美股科技股财报季表现亮眼，纳指有望继续上涨',
        description: '科技股财报季表现超预期，多家公司业绩创新高，分析师上调纳斯达克指数目标价。',
        content: '科技股财报季表现超预期，多家公司业绩创新高。分析师认为，在AI技术推动下，科技股仍有上涨空间，纳斯达克指数有望继续创新高。',
        url: '#',
        urlToImage: '',
        publishedAt: new Date(Date.now() - 7200000).toISOString(),
        source: { name: '极速数据(测试)' },
        author: '极速数据'
      }
    ],
    default: [
      {
        title: '市场分析：投资者关注经济数据发布',
        description: '本周将发布重要经济数据，投资者密切关注，市场波动性可能加大。',
        content: '本周将发布重要经济数据，包括通胀数据和就业报告。投资者密切关注这些数据对货币政策的影响，市场波动性可能加大。',
        url: '#',
        urlToImage: '',
        publishedAt: new Date().toISOString(),
        source: { name: '极速数据(测试)' },
        author: '极速数据'
      }
    ]
  };

  if (type === 'gold') {
    return testNews.gold;
  } else if (type === 'nasdaq') {
    return testNews.nasdaq;
  } else {
    return testNews.default;
  }
}