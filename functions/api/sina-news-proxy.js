/**
 * Cloudflare Pages Function: 新浪财经新闻代理
 * 获取中文财经新闻
 */

export async function onRequest(context) {
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
    const pages = Math.ceil(num / perPage);

    for (let page = 1; page <= pages; page++) {
      const apiUrl = `https://feed.mix.sina.com.cn/api/roll/get?pageid=${config.pageid}&lid=${config.lid}&k=&num=${perPage}&page=${page}`;

      try {
        const response = await fetch(apiUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Referer': 'https://finance.sina.com.cn/',
            'Accept': 'application/json'
          }
        });

        const data = await response.json();

        console.log(`📡 第${page}页:`, {
          status: response.status,
          hasData: !!data.result?.data,
          count: data.result?.data?.length || 0
        });

        if (data.result?.status?.code !== 0) {
          console.error(`❌ 第${page}页失败:`, data.result?.status?.msg);
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
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      } catch (error) {
        console.error(`❌ 第${page}页错误:`, error.message);
        break;
      }
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
      urlToImage: item.img || item.thumb || null
    }));

    return new Response(JSON.stringify({
      status: 'ok',
      totalResults: articles.length,
      articles
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Cache-Control': 'public, max-age=300'
      }
    });

  } catch (error) {
    console.error('❌ 新浪财经错误:', error);

    return new Response(JSON.stringify({
      status: 'error',
      message: error.message
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}
