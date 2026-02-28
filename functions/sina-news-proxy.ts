/**
 * Cloudflare Pages Function: 新浪财经新闻代理
 * 获取中文财经新闻
 */

interface Env {
  // 环境变量接口
}

// 重试函数
async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) {
        return response;
      }
      lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
      lastError = error as Error;
      console.warn(`⚠️ 重试 ${i + 1}/${maxRetries}:`, error.message);
    }
    
    // 等待后重试（指数退避）
    if (i < maxRetries - 1) {
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
  
  throw lastError || new Error('请求失败');
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
    const category = url.searchParams.get('category') || 'finance';
    const num = parseInt(url.searchParams.get('num') || '50');

    const categoryConfig = {
      'finance': { pageid: '153', lid: '2509', name: '财经要闻' },
      'stock': { pageid: '153', lid: '2509', name: '财经要闻' },
      'usstock': { pageid: '153', lid: '2509', name: '财经要闻' },
      'nasdaq': { pageid: '153', lid: '2509', name: '财经要闻' },
      'gold': { pageid: '153', lid: '2509', name: '财经要闻' }
    };

    const config = categoryConfig[category] || categoryConfig['finance'];

    console.log('📰 新浪财经新闻:', { category, num, config: config.name });

    const allArticles = [];
    const perPage = 50;
    const pages = Math.min(Math.ceil(num / perPage), 3); // 最多3页，避免请求过多

    for (let page = 1; page <= pages; page++) {
      const apiUrl = `https://feed.mix.sina.com.cn/api/roll/get?pageid=${config.pageid}&lid=${config.lid}&k=&num=${perPage}&page=${page}`;

      try {
        const response = await fetchWithRetry(apiUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Referer': 'https://finance.sina.com.cn/',
            'Accept': 'application/json'
          }
        }, 2); // 最多重试2次

        const data = await response.json();

        console.log(`📡 第${page}页:`, {
          status: response.status,
          hasData: !!data.result?.data,
          count: data.result?.data?.length || 0
        });

        if (data.result?.status?.code !== 0) {
          console.error(`❌ 第${page}页失败:`, data.result?.status?.msg);
          // 如果第一页就失败，抛出错误；否则继续
          if (page === 1 && allArticles.length === 0) {
            throw new Error(data.result?.status?.msg || '新浪API返回错误');
          }
          break;
        }

        const pageArticles = data.result?.data || [];
        if (pageArticles.length === 0) {
          console.log(`⚠️ 第${page}页无数据`);
          break;
        }

        allArticles.push(...pageArticles);

        if (allArticles.length >= num) break;

        // 延迟避免请求过快
        if (page < pages) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      } catch (error) {
        console.error(`❌ 第${page}页错误:`, error.message);
        // 如果第一页就失败且没有数据，抛出错误
        if (page === 1 && allArticles.length === 0) {
          throw error;
        }
        break;
      }
    }

    if (allArticles.length === 0) {
      throw new Error('未获取到任何新闻数据');
    }

    console.log(`✅ 总计获取 ${allArticles.length} 条新闻`);

    const articles = allArticles.map(item => ({
      title: item.title,
      description: item.intro || item.summary || item.title,
      content: item.intro || item.summary || item.title,
      url: item.url,
      source: {
        id: 'sina-finance',
        name: item.media_name || item.source || '新浪财经'
      },
      author: item.author || null,
      publishedAt: new Date(parseInt(item.ctime || item.intime) * 1000).toISOString(),
      urlToImage: item.img || item.thumb || null,
      image: item.img || item.thumb || null
    }));

    return new Response(JSON.stringify({
      status: 'ok',
      totalResults: articles.length,
      articles
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Cache-Control': 'public, max-age=180' // 缓存3分钟
      }
    });

  } catch (error) {
    console.error('❌ 新浪财经错误:', error);

    return new Response(JSON.stringify({
      status: 'error',
      message: error.message || '获取新闻失败',
      articles: [] // 返回空数组而不是完全失败
    }), {
      status: 200, // 返回200但标记为error，让前端可以继续使用其他数据源
      headers: corsHeaders
    });
  }
}
