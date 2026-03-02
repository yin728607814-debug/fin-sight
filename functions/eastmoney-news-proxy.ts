/**
 * Cloudflare Pages Function: 东方财富新闻代理（支持美股和A股）
 */

interface Env {
  // 可以在这里定义环境变量
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
    // 从URL参数获取类别
    const url = new URL(context.request.url);
    const category = url.searchParams.get('category') || 'usstock';
    
    console.log(`📡 开始获取东方财富${category === 'astock' ? 'A股' : '美股'}新闻`);

    // 根据类别选择不同的URL
    const targetUrl = category === 'astock' 
      ? 'https://finance.eastmoney.com/a/cagub.html'  // A股新闻
      : 'https://finance.eastmoney.com/a/cgjjj.html'; // 美股新闻
    
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9',
        'Referer': 'https://finance.eastmoney.com/'
      }
    });

    const html = await response.text();
    
    // 简单的HTML解析
    const articles: any[] = [];
    const linkRegex = /<a[^>]*href=["']([^"']*finance\.eastmoney\.com\/a\/[^"']*)["'][^>]*(?:title=["']([^"']*)["'])?[^>]*>([^<]*)<\/a>/gi;
    
    let match;
    while ((match = linkRegex.exec(html)) !== null && articles.length < 50) {
      let href = match[1];
      const titleAttr = match[2];
      const linkText = match[3]?.trim();
      const title = titleAttr || linkText || '';
      
      if (href.startsWith('//')) {
        href = 'https:' + href;
      } else if (href.startsWith('/')) {
        href = 'https://finance.eastmoney.com' + href;
      }
      
      if (title.length > 10 && href) {
        let publishedAt = new Date().toISOString();
        const urlDateMatch = href.match(/\/a\/(\d{8})\d+\.html/);
        if (urlDateMatch) {
          const dateStr = urlDateMatch[1];
          const year = dateStr.substring(0, 4);
          const month = dateStr.substring(4, 6);
          const day = dateStr.substring(6, 8);
          publishedAt = `${year}-${month}-${day}T00:00:00.000Z`;
        }
        
        articles.push({
          title,
          description: title,
          url: href,
          publishedAt,
          source: '东方财富',
          image: ''
        });
      }
    }
    
    const uniqueArticles = Array.from(
      new Map(articles.map(item => [item.url, item])).values()
    );

    console.log(`📰 解析后的${category === 'astock' ? 'A股' : '美股'}新闻数量:`, uniqueArticles.length);

    return new Response(JSON.stringify({
      status: 'ok',
      totalResults: uniqueArticles.length,
      articles: uniqueArticles.slice(0, 50)
    }), {
      status: 200,
      headers: corsHeaders
    });

  } catch (error: any) {
    console.error('❌ 东方财富新闻获取失败:', error.message);
    
    return new Response(JSON.stringify({
      status: 'error',
      message: error.message,
      articles: []
    }), {
      status: 200,
      headers: corsHeaders
    });
  }
}
