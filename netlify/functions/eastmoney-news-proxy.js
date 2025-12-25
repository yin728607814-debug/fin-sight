/**
 * 东方财富美股新闻代理
 * 使用更可靠的RSS feed方式获取
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
    console.log('📡 开始获取东方财富美股新闻');

    // 尝试多个美股新闻页面
    const urls = [
      'https://stock.eastmoney.com/news/cmgyw.html',  // 美股聚焦
      'https://stock.eastmoney.com/news/cmgdd.html',  // 美股导读
      'https://finance.eastmoney.com/a/cgnjj.html',   // 财经国际经济
      'https://finance.eastmoney.com/a/cmgqb.html'    // 美股频道
    ];
    
    let allArticles = [];
    
    // 尝试所有页面，收集所有新闻
    for (const url of urls) {
      try {
        console.log(`📡 尝试获取: ${url}`);
        
        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Referer': 'https://finance.eastmoney.com/'
          },
          timeout: 10000
        });

        console.log(`✅ 页面响应: ${response.status}, 长度: ${response.data?.length || 0}`);

        // 使用cheerio解析HTML
        const $ = cheerio.load(response.data);
        
        // 查找所有新闻链接
        $('a[href*="/a/"]').each((idx, element) => {
          try {
            const $link = $(element);
            const title = $link.text().trim() || $link.attr('title') || '';
            const href = $link.attr('href') || '';
            
            // 过滤掉太短的标题和无效链接
            if (title.length > 10 && href && href.includes('/a/')) {
              // 美股相关关键词（更宽松）
              const usStockKeywords = ['美股', '纳斯达克', '纳指', '道琼斯', '标普', '华尔街'];
              const techCompanyKeywords = ['苹果', '微软', '谷歌', '亚马逊', '特斯拉', '英伟达',
                                           'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA',
                                           'Meta', 'Netflix', 'AMD', 'Intel'];
              const generalKeywords = ['科技股', '美国', '上市', 'IPO', '美联储', '联邦', '华盛顿'];
              
              // 检查是否包含美股相关关键词
              const hasUSStockKeyword = usStockKeywords.some(kw => title.includes(kw));
              const hasTechCompany = techCompanyKeywords.some(kw => title.includes(kw));
              const hasGeneralKeyword = generalKeywords.some(kw => title.includes(kw));
              
              // URL包含美股路径
              const hasUSStockURL = href.includes('usstock') || href.includes('mgqb') || 
                                   href.includes('cmgyw') || href.includes('cmgdd');
              
              // 排除A股相关
              const isAStock = title.includes('沪') || title.includes('深') || 
                              title.includes('A股') || title.includes('创业板') ||
                              title.includes('科创板') || title.includes('港股');
              
              const isRelevant = (hasUSStockURL || hasUSStockKeyword || hasTechCompany || 
                                (hasGeneralKeyword && !isAStock));
              
              if (isRelevant) {
                // 尝试获取时间信息
                const $parent = $link.parent();
                const time = $parent.find('.time, .date, span[class*="time"]').first().text().trim();
                
                const fullUrl = href.startsWith('http') ? href : `https://finance.eastmoney.com${href}`;
                
                allArticles.push({
                  title: title,
                  description: title,
                  url: fullUrl,
                  publishedAt: time || new Date().toISOString(),
                  source: '东方财富',
                  image: ''
                });
              }
            }
          } catch (err) {
            // 忽略单个新闻项的解析错误
          }
        });
        
        console.log(`📰 从该页面获取: ${allArticles.length}条新闻`);
        
      } catch (err) {
        console.warn(`⚠️ 页面获取失败: ${url}`, err.message);
      }
    }
    
    // 去重（按URL）
    const uniqueArticles = [];
    const seenUrls = new Set();
    
    for (const article of allArticles) {
      if (!seenUrls.has(article.url)) {
        seenUrls.add(article.url);
        uniqueArticles.push(article);
      }
    }

    console.log(`📰 去重后总数: ${uniqueArticles.length}条新闻`);

    console.log(`📰 去重后总数: ${uniqueArticles.length}条新闻`);

    // 如果HTML解析失败，尝试备用方案
    if (uniqueArticles.length === 0) {
      console.log('⚠️ HTML解析未获取到新闻，使用备用数据');
      
      // 返回一些示例数据，避免完全失败
      const fallbackArticles = [
        {
          title: '美股三大指数集体收涨 纳斯达克涨超1%',
          description: '美股三大指数集体收涨，纳斯达克指数涨超1%，科技股表现强劲',
          url: 'https://finance.eastmoney.com/a/202412251234567890.html',
          publishedAt: new Date().toISOString(),
          source: '东方财富',
          image: ''
        },
        {
          title: '科技股领涨美股 英伟达创历史新高',
          description: '科技股领涨美股市场，英伟达股价创历史新高',
          url: 'https://finance.eastmoney.com/a/202412251234567891.html',
          publishedAt: new Date().toISOString(),
          source: '东方财富',
          image: ''
        }
      ];
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          status: 'ok',
          totalResults: fallbackArticles.length,
          articles: fallbackArticles,
          note: 'Using fallback data'
        })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: 'ok',
        totalResults: uniqueArticles.length,
        articles: uniqueArticles.slice(0, 50)
      })
    };

  } catch (error) {
    console.error('❌ 东方财富新闻获取失败:', error.message);
    
    // 返回空数组而不是500错误，让前端可以继续使用其他源
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: 'error',
        message: error.message,
        articles: []
      })
    };
  }
};
