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
      
      // 如果是接口停用或其他API错误，返回测试数据
      const isApiDisabled = data.msg && (data.msg.includes('停用') || data.msg.includes('disabled'));
      const isApiError = data.status === '108' || data.status === 108;
      
      if (isApiDisabled || isApiError) {
        console.log('🔧 极速数据API不可用，返回测试数据');
        const testArticles = generateTestNews(type, category);
        
        return new Response(JSON.stringify({
          status: 'ok',
          totalResults: testArticles.length,
          articles: testArticles,
          debug: {
            error: `极速数据API错误: ${data.msg || data.message || '未知错误'}`,
            isTestData: true,
            reason: 'API接口不可用，使用测试数据',
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
      },
      {
        title: '美联储政策预期推动黄金ETF资金流入创新高',
        description: '市场对美联储货币政策转向的预期升温，黄金ETF连续三周录得资金净流入，创下年内新高。',
        content: '市场对美联储货币政策转向的预期升温，黄金ETF连续三周录得资金净流入，创下年内新高。投资者认为，在通胀压力和经济不确定性双重影响下，黄金的配置价值凸显。',
        url: '#',
        urlToImage: '',
        publishedAt: new Date(Date.now() - 7200000).toISOString(),
        source: { name: '极速数据(测试)' },
        author: '极速数据'
      },
      {
        title: '中国黄金消费需求回暖，金饰销售同比增长15%',
        description: '随着经济复苏和消费信心恢复，中国黄金消费需求显著回暖，金饰销售同比增长15%。',
        content: '随着经济复苏和消费信心恢复，中国黄金消费需求显著回暖。数据显示，第一季度金饰销售同比增长15%，投资金条销售也保持稳定增长。',
        url: '#',
        urlToImage: '',
        publishedAt: new Date(Date.now() - 10800000).toISOString(),
        source: { name: '极速数据(测试)' },
        author: '极速数据'
      },
      {
        title: '黄金期货持仓量创历史新高，机构看多情绪浓厚',
        description: '黄金期货市场持仓量创历史新高，机构投资者看多情绪浓厚，预计金价将继续上涨。',
        content: '黄金期货市场持仓量创历史新高，机构投资者看多情绪浓厚。分析师指出，在全球经济不确定性和通胀预期推动下，黄金的避险属性和保值功能将继续受到青睐。',
        url: '#',
        urlToImage: '',
        publishedAt: new Date(Date.now() - 14400000).toISOString(),
        source: { name: '极速数据(测试)' },
        author: '极速数据'
      },
      {
        title: '印度黄金进口量大幅增加，推动全球金价上涨',
        description: '印度作为全球第二大黄金消费国，进口量大幅增加，为全球金价提供了强劲支撑。',
        content: '印度作为全球第二大黄金消费国，近期进口量大幅增加，为全球金价提供了强劲支撑。业内人士认为，随着印度经济复苏和节庆季节临近，黄金需求将持续增长。',
        url: '#',
        urlToImage: '',
        publishedAt: new Date(Date.now() - 18000000).toISOString(),
        source: { name: '极速数据(测试)' },
        author: '极速数据'
      },
      {
        title: '黄金矿业公司股价集体上涨，受益于金价走强',
        description: '受国际金价走强影响，主要黄金矿业公司股价集体上涨，投资者对黄金板块信心增强。',
        content: '受国际金价走强影响，主要黄金矿业公司股价集体上涨。巴里克黄金、纽蒙特等龙头企业涨幅超过5%，投资者对黄金板块的信心显著增强。',
        url: '#',
        urlToImage: '',
        publishedAt: new Date(Date.now() - 21600000).toISOString(),
        source: { name: '极速数据(测试)' },
        author: '极速数据'
      },
      {
        title: '技术分析：黄金突破关键阻力位，目标价看向2100美元',
        description: '技术分析显示，黄金价格成功突破关键阻力位，分析师将目标价上调至2100美元。',
        content: '技术分析显示，黄金价格成功突破关键阻力位，成交量放大确认突破有效。多位分析师将目标价上调至2100美元，认为黄金正进入新一轮上涨周期。',
        url: '#',
        urlToImage: '',
        publishedAt: new Date(Date.now() - 25200000).toISOString(),
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
      },
      {
        title: 'NVIDIA财报超预期，AI芯片需求持续强劲',
        description: 'NVIDIA发布超预期财报，AI芯片需求持续强劲，股价盘后大涨8%，带动纳斯达克期货走高。',
        content: 'NVIDIA发布超预期财报，数据中心业务收入同比增长200%，AI芯片需求持续强劲。公司上调全年业绩指引，股价盘后大涨8%，带动纳斯达克期货走高。',
        url: '#',
        urlToImage: '',
        publishedAt: new Date(Date.now() - 10800000).toISOString(),
        source: { name: '极速数据(测试)' },
        author: '极速数据'
      },
      {
        title: '微软云业务增长强劲，Azure收入同比增长30%',
        description: '微软公布最新财报，云业务Azure收入同比增长30%，超出市场预期，推动股价上涨。',
        content: '微软公布最新财报，云业务Azure收入同比增长30%，超出市场预期。公司在AI和云计算领域的投资正在获得回报，推动股价在盘后交易中上涨5%。',
        url: '#',
        urlToImage: '',
        publishedAt: new Date(Date.now() - 14400000).toISOString(),
        source: { name: '极速数据(测试)' },
        author: '极速数据'
      },
      {
        title: '苹果发布新款MacBook Pro，搭载M4芯片性能提升40%',
        description: '苹果发布新款MacBook Pro，搭载自研M4芯片，性能较上代提升40%，预计将推动销量增长。',
        content: '苹果发布新款MacBook Pro，搭载自研M4芯片，CPU和GPU性能较上代分别提升40%和50%。分析师预计新产品将推动Mac业务销量增长，苹果股价应声上涨3%。',
        url: '#',
        urlToImage: '',
        publishedAt: new Date(Date.now() - 18000000).toISOString(),
        source: { name: '极速数据(测试)' },
        author: '极速数据'
      },
      {
        title: '谷歌AI搜索功能全面升级，广告收入有望大幅增长',
        description: '谷歌宣布AI搜索功能全面升级，集成更多智能化服务，分析师预计将推动广告收入大幅增长。',
        content: '谷歌宣布AI搜索功能全面升级，集成更多智能化服务和个性化推荐。分析师预计新功能将提升用户粘性和广告点击率，推动广告收入大幅增长。',
        url: '#',
        urlToImage: '',
        publishedAt: new Date(Date.now() - 21600000).toISOString(),
        source: { name: '极速数据(测试)' },
        author: '极速数据'
      },
      {
        title: '特斯拉自动驾驶技术获重大突破，股价大涨12%',
        description: '特斯拉宣布自动驾驶技术获得重大突破，FSD功能显著改进，股价应声大涨12%。',
        content: '特斯拉宣布自动驾驶技术获得重大突破，最新版本FSD功能在安全性和准确性方面显著改进。市场对特斯拉在自动驾驶领域的领先地位更加看好，股价应声大涨12%。',
        url: '#',
        urlToImage: '',
        publishedAt: new Date(Date.now() - 25200000).toISOString(),
        source: { name: '极速数据(测试)' },
        author: '极速数据'
      },
      {
        title: 'Meta元宇宙业务扭亏为盈，VR设备销量创新高',
        description: 'Meta公布财报显示元宇宙业务首次扭亏为盈，VR设备销量创历史新高，投资者信心大增。',
        content: 'Meta公布财报显示，Reality Labs部门首次实现盈利，VR设备销量创历史新高。公司在元宇宙领域的长期投资开始获得回报，投资者信心大增，股价上涨7%。',
        url: '#',
        urlToImage: '',
        publishedAt: new Date(Date.now() - 28800000).toISOString(),
        source: { name: '极速数据(测试)' },
        author: '极速数据'
      },
      {
        title: 'AMD推出新一代AI芯片，挑战NVIDIA市场地位',
        description: 'AMD推出新一代AI芯片MI300X，性能大幅提升，有望挑战NVIDIA在AI芯片市场的主导地位。',
        content: 'AMD推出新一代AI芯片MI300X，在机器学习训练和推理性能方面大幅提升。分析师认为，AMD有望在AI芯片市场获得更多份额，挑战NVIDIA的主导地位。',
        url: '#',
        urlToImage: '',
        publishedAt: new Date(Date.now() - 32400000).toISOString(),
        source: { name: '极速数据(测试)' },
        author: '极速数据'
      },
      {
        title: '纳斯达克100指数权重调整，AI概念股占比进一步提升',
        description: '纳斯达克100指数进行年度权重调整，AI相关概念股占比进一步提升，反映科技行业发展趋势。',
        content: '纳斯达克100指数进行年度权重调整，NVIDIA、微软、谷歌等AI相关概念股权重进一步提升。这一调整反映了人工智能在科技行业中的重要地位和发展趋势。',
        url: '#',
        urlToImage: '',
        publishedAt: new Date(Date.now() - 36000000).toISOString(),
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
      },
      {
        title: '全球股市普遍上涨，投资者风险偏好回升',
        description: '全球主要股指普遍上涨，投资者风险偏好回升，资金流入股票市场。',
        content: '全球主要股指普遍上涨，美股、欧股、亚太股市均录得涨幅。投资者风险偏好回升，资金从债券市场流入股票市场，推动股指走高。',
        url: '#',
        urlToImage: '',
        publishedAt: new Date(Date.now() - 7200000).toISOString(),
        source: { name: '极速数据(测试)' },
        author: '极速数据'
      },
      {
        title: '美联储官员发表鸽派言论，市场预期降息概率上升',
        description: '美联储官员发表鸽派言论，暗示可能放缓加息步伐，市场预期降息概率上升。',
        content: '美联储官员在最新讲话中发表鸽派言论，暗示可能放缓加息步伐。市场预期年内降息概率上升至70%，推动股市和债市同时上涨。',
        url: '#',
        urlToImage: '',
        publishedAt: new Date(Date.now() - 14400000).toISOString(),
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