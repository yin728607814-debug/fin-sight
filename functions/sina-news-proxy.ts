/**
 * Cloudflare Pages Function: 新浪财经新闻代理（深度伪装版）
 * 添加完整浏览器指纹，骗过WAF防火墙
 */

interface Env {
  // 环境变量接口
}

// 带超时控制的fetch函数 - 代理层最多等8秒
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number = 8000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Sina Timeout');
    }
    throw error;
  }
}

// 简化的重试函数 - 只重试一次，减少等待时间
async function fetchWithRetry(url: string, options: RequestInit): Promise<Response> {
  try {
    const response = await fetchWithTimeout(url, options, 8000);
    if (response.ok) {
      return response;
    }
    // 第一次失败，等待500ms后重试一次
    await new Promise(resolve => setTimeout(resolve, 500));
    return await fetchWithTimeout(url, options, 8000);
  } catch (error) {
    // 网络错误，等待500ms后重试一次
    await new Promise(resolve => setTimeout(resolve, 500));
    return await fetchWithTimeout(url, options, 8000);
  }
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

    const categoryConfig: Record<string, { pageid: string; lid: string; name: string }> = {
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
    const pages = Math.ceil(num / perPage);

    // 🔥 核心防屏蔽：完整的浏览器指纹伪装
    const browserHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/json,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Referer': 'https://finance.sina.com.cn/',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Sec-Ch-Ua': '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Windows"',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'same-origin',
      'Upgrade-Insecure-Requests': '1'
    };

    // 并行请求前3页，后续页面串行请求
    const firstBatchPages = Math.min(pages, 3);
    const firstBatchPromises: Promise<{ page: number; data?: any; error?: Error }>[] = [];

    for (let page = 1; page <= firstBatchPages; page++) {
      const apiUrl = `https://feed.mix.sina.com.cn/api/roll/get?pageid=${config.pageid}&lid=${config.lid}&k=&num=${perPage}&page=${page}`;
      
      firstBatchPromises.push(
        fetchWithRetry(apiUrl, { headers: browserHeaders })
        .then(response => response.json())
        .then(data => ({ page, data }))
        .catch(error => ({ page, error: error instanceof Error ? error : new Error(String(error)) }))
      );
    }

    // 等待第一批请求完成
    const firstBatchResults = await Promise.all(firstBatchPromises);
    
    for (const result of firstBatchResults.sort((a, b) => a.page - b.page)) {
      if ('error' in result && result.error) {
        console.error(`❌ 第${result.page}页错误:`, result.error.message);
        continue;
      }

      const data = result.data;
      if (data.result?.status?.code !== 0) {
        console.error(`❌ 第${result.page}页失败:`, data.result?.status?.msg);
        continue;
      }

      const pageArticles = data.result?.data || [];
      if (pageArticles.length > 0) {
        allArticles.push(...pageArticles);
      }
    }

    // 如果还需要更多页面，串行请求
    if (pages > firstBatchPages && allArticles.length < num) {
      for (let page = firstBatchPages + 1; page <= pages; page++) {
        const apiUrl = `https://feed.mix.sina.com.cn/api/roll/get?pageid=${config.pageid}&lid=${config.lid}&k=&num=${perPage}&page=${page}`;

        try {
          const response = await fetchWithRetry(apiUrl, { headers: browserHeaders });
          const data = await response.json();

          if (data.result?.status?.code !== 0) {
            console.error(`❌ 第${page}页失败:`, data.result?.status?.msg);
            break;
          }

          const pageArticles = data.result?.data || [];
          if (pageArticles.length === 0) {
            break;
          }

          allArticles.push(...pageArticles);

          if (allArticles.length >= num) break;

          // 减少延迟到100ms
          if (page < pages) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        } catch (error: any) {
          console.error(`❌ 第${page}页错误:`, error.message);
          break;
        }
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
        'Cache-Control': 'public, max-age=180'
      }
    });

  } catch (error: any) {
    console.error('❌ 新浪财经错误:', error);

    return new Response(JSON.stringify({
      status: 'error',
      message: error.message || '获取新闻失败',
      articles: []
    }), {
      status: 504, // Gateway Timeout
      headers: corsHeaders
    });
  }
}
