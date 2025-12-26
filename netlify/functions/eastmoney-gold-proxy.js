/**
 * 东方财富黄金新闻代理
 * 获取黄金市场相关的中文新闻
 */

const axios = require('axios');
const cheerio = require('cheerio');

exports.handler = async function(event, context) {
  // 设置CORS头
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // 处理OPTIONS预检请求
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    console.log('📡 开始获取东方财富黄金新闻');

    // 使用东方财富黄金频道
    const url = 'https://gold.eastmoney.com/';
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Referer': 'https://gold.eastmoney.com/'
      },
      timeout: 15000
    });

    console.log('✅ 东方财富黄金频道响应:', {
      status: response.status,
      contentLength: response.data?.length || 0
    });

    // 使用cheerio解析HTML
    const $ = cheerio.load(response.data);
    const articles = [];
    
    // 查找所有新闻链接（黄金频道的新闻链接格式）
    $('a[href*="gold.eastmoney.com/a/"], a[href*="finance.eastmoney.com/a/"]').each((_idx, element) => {
      try {
        const $link = $(element);
        const linkText = $link.text().trim();
        const titleAttr = $link.attr('title');
        // 优先使用title属性（完整标题），如果没有则使用链接文本
        const title = titleAttr || linkText || '';
        const href = $link.attr('href') || '';
        
        // 调试：打印前3条的详细信息
        if (articles.length < 3) {
          console.log(`\n[调试] 黄金新闻 ${articles.length + 1}:`);
          console.log(`  链接文本: "${linkText}"`);
          console.log(`  title属性: "${titleAttr || '无'}"`);
          console.log(`  最终标题: "${title}"`);
          console.log(`  URL: ${href}`);
        }
        
        // 过滤掉太短的标题和非黄金相关的新闻
        if (title.length > 10 && href) {
          // 黄金相关关键词过滤
          const goldKeywords = ['黄金', '金价', '贵金属', '白银', '现货金', 'XAUUSD', '伦敦金', '美元金'];
          const isGoldRelated = goldKeywords.some(kw => title.includes(kw));
          
          if (isGoldRelated) {
            try {
              // 尝试从URL中提取日期（格式：/a/202512033600991432.html）
              let publishedAt = new Date().toISOString();
              const urlDateMatch = href.match(/\/a\/(\d{8})\d+\.html/);
              if (urlDateMatch) {
                const dateStr = urlDateMatch[1]; // 例如：20251203
                const year = dateStr.substring(0, 4);
                const month = dateStr.substring(4, 6);
                const day = dateStr.substring(6, 8);
                
                // 验证日期是否有效
                const dateObj = new Date(`${year}-${month}-${day}`);
                if (!isNaN(dateObj.getTime())) {
                  publishedAt = dateObj.toISOString();
                  
                  if (articles.length < 3) {
                    console.log(`  提取日期: ${year}-${month}-${day}`);
                  }
                } else {
                  console.warn(`  日期无效: ${year}-${month}-${day}`);
                }
              } else {
                // 尝试获取页面上的时间信息
                const $parent = $link.parent();
                const time = $parent.find('.time, .date, span[class*="time"]').first().text().trim();
                if (time) {
                  publishedAt = time;
                }
              }
              
              articles.push({
                title: title,
                description: title,
                url: href,
                publishedAt: publishedAt,
                source: '东方财富',
                image: ''
              });
            } catch (dateError) {
              // 日期处理出错，使用默认值
              console.warn(`  日期处理出错:`, dateError.message);
              articles.push({
                title: title,
                description: title,
                url: href,
                publishedAt: new Date().toISOString(),
                source: '东方财富',
                image: ''
              });
            }
          }
        }
      } catch (err) {
        // 忽略单个新闻项的解析错误
      }
    });
    
    // 去重（按URL）
    const uniqueArticles = [];
    const seenUrls = new Set();
    
    for (const article of articles) {
      if (!seenUrls.has(article.url)) {
        seenUrls.add(article.url);
        uniqueArticles.push(article);
      }
    }

    console.log(`✅ 东方财富黄金新闻解析完成: ${uniqueArticles.length}条（去重后）`);
    
    // 如果东方财富黄金频道新闻不足，尝试从财经频道获取黄金相关新闻
    if (uniqueArticles.length < 20) {
      console.log('📊 黄金频道新闻不足，从财经频道补充...');
      
      try {
        const financeUrl = 'https://finance.eastmoney.com/';
        const financeResponse = await axios.get(financeUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
          },
          timeout: 15000
        });
        
        const $finance = cheerio.load(financeResponse.data);
        
        $finance('a[href*="finance.eastmoney.com/a/"]').each((_idx, element) => {
          try {
            const $link = $finance(element);
            const linkText = $link.text().trim();
            const titleAttr = $link.attr('title');
            const title = titleAttr || linkText || '';
            const href = $link.attr('href') || '';
            
            // 黄金相关关键词过滤
            const goldKeywords = ['黄金', '金价', '贵金属', '白银', '现货金', 'XAUUSD', '伦敦金', '美元金'];
            const isGoldRelated = goldKeywords.some(kw => title.includes(kw));
            
            if (title.length > 10 && href && isGoldRelated && !seenUrls.has(href)) {
              seenUrls.add(href);
              
              try {
                // 尝试从URL中提取日期
                let publishedAt = new Date().toISOString();
                const urlDateMatch = href.match(/\/a\/(\d{8})\d+\.html/);
                if (urlDateMatch) {
                  const dateStr = urlDateMatch[1];
                  const year = dateStr.substring(0, 4);
                  const month = dateStr.substring(4, 6);
                  const day = dateStr.substring(6, 8);
                  
                  // 验证日期是否有效
                  const dateObj = new Date(`${year}-${month}-${day}`);
                  if (!isNaN(dateObj.getTime())) {
                    publishedAt = dateObj.toISOString();
                  }
                }
                
                uniqueArticles.push({
                  title: title,
                  description: title,
                  url: href,
                  publishedAt: publishedAt,
                  source: '东方财富',
                  image: ''
                });
              } catch (err) {
                // 日期处理出错，使用默认值
                uniqueArticles.push({
                  title: title,
                  description: title,
                  url: href,
                  publishedAt: new Date().toISOString(),
                  source: '东方财富',
                  image: ''
                });
              }
            }
          } catch (err) {
            // 忽略错误
          }
        });
        
        console.log(`✅ 财经频道补充完成，总计: ${uniqueArticles.length}条`);
      } catch (err) {
        console.warn('⚠️ 财经频道补充失败:', err.message);
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        articles: uniqueArticles,
        total: uniqueArticles.length,
        source: '东方财富黄金频道'
      })
    };

  } catch (error) {
    console.error('❌ 东方财富黄金新闻获取失败:', error.message);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: '获取黄金新闻失败',
        message: error.message,
        articles: [],
        total: 0
      })
    };
  }
};
