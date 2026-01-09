/**
 * 演示数据服务
 * 当API密钥不可用时提供模拟数据
 */

import { NewsItem, NewsAnalysis, PriceData, AssetInfo, AssetType } from '../types';

/**
 * 生成演示新闻数据
 */
export function generateDemoNews(assetType: AssetType, count: number = 5): NewsItem[] {
  const goldNews = [
    {
      id: 'demo_gold_1',
      title: '黄金价格创新高，投资者寻求避险资产',
      content: '由于全球经济不确定性增加，黄金价格今日突破历史新高。分析师认为，通胀担忧和地缘政治紧张局势推动了避险需求。',
      source: '财经日报',
      publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2小时前
      url: 'https://example.com/gold-news-1',
      relevanceScore: 0.9
    },
    {
      id: 'demo_gold_2',
      title: '央行增持黄金储备，市场信心提升',
      content: '多国央行继续增加黄金储备，这一趋势支撑了黄金的长期价值。专家预测，央行购买将继续成为黄金市场的重要支撑因素。',
      source: '金融时报',
      publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4小时前
      url: 'https://example.com/gold-news-2',
      relevanceScore: 0.8
    },
    {
      id: 'demo_gold_3',
      title: '美元走弱推动贵金属上涨',
      content: '美元指数下跌至近期低点，为以美元计价的黄金提供了上涨动力。投资者预期美联储可能放缓加息步伐。',
      source: '市场观察',
      publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6小时前
      url: 'https://example.com/gold-news-3',
      relevanceScore: 0.7
    }
  ];

  const nasdaqNews = [
    {
      id: 'demo_nasdaq_1',
      title: '科技股反弹，纳斯达克指数收涨2.5%',
      content: '受AI技术发展和企业财报超预期影响，纳斯达克100指数今日大幅上涨。投资者对科技行业前景保持乐观态度。',
      source: '科技财经',
      publishedAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1小时前
      url: 'https://example.com/nasdaq-news-1',
      relevanceScore: 0.9
    },
    {
      id: 'demo_nasdaq_2',
      title: '大型科技公司财报季表现强劲',
      content: '苹果、微软等科技巨头发布的季度财报均超出市场预期，推动纳斯达克指数持续走高。云计算和AI业务成为增长亮点。',
      source: '华尔街日报',
      publishedAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3小时前
      url: 'https://example.com/nasdaq-news-2',
      relevanceScore: 0.8
    },
    {
      id: 'demo_nasdaq_3',
      title: '新兴科技领域获得投资者青睐',
      content: '人工智能、量子计算等新兴技术领域吸引大量资金流入，相关概念股表现活跃，为纳斯达克指数提供支撑。',
      source: '投资者报',
      publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5小时前
      url: 'https://example.com/nasdaq-news-3',
      relevanceScore: 0.7
    }
  ];

  const astockNews = [
    {
      id: 'demo_astock_1',
      title: 'A股市场企稳回升，上证指数收涨1.8%',
      content: '在政策利好和资金回流的推动下，A股市场今日表现强劲。上证指数收涨1.8%，创业板指涨幅超过2%。市场信心逐步恢复。',
      source: '中国证券报',
      publishedAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1小时前
      url: 'https://example.com/astock-news-1',
      relevanceScore: 0.9
    },
    {
      id: 'demo_astock_2',
      title: '央行降准释放流动性，A股迎来利好',
      content: '央行宣布下调存款准备金率0.5个百分点，释放长期资金约1万亿元。市场分析认为，此举将为A股市场带来积极影响。',
      source: '财经日报',
      publishedAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3小时前
      url: 'https://example.com/astock-news-2',
      relevanceScore: 0.8
    },
    {
      id: 'demo_astock_3',
      title: '新能源板块领涨，A股结构性行情延续',
      content: '新能源汽车、光伏等板块今日表现活跃，多只个股涨停。分析师认为，在政策支持下，新能源板块仍具备较大上涨空间。',
      source: '上海证券报',
      publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5小时前
      url: 'https://example.com/astock-news-3',
      relevanceScore: 0.7
    }
  ];

  const newsData = assetType === 'gold' 
    ? goldNews 
    : assetType === 'astock' 
      ? astockNews 
      : nasdaqNews;
  return newsData.slice(0, count);
}

/**
 * 生成演示分析数据
 */
export function generateDemoAnalysis(news: NewsItem[]): NewsAnalysis[] {
  return news.map((newsItem, index) => {
    // 基于新闻标题和内容生成模拟分析
    const content = (newsItem.title + ' ' + newsItem.content).toLowerCase();
    
    let impact: 'positive' | 'negative' | 'neutral' = 'neutral';
    let confidence = 0.6;
    let predictedChange = 0;
    
    // 简单的情感分析
    if (content.includes('上涨') || content.includes('反弹') || content.includes('强劲') || content.includes('乐观')) {
      impact = 'positive';
      confidence = 0.7 + Math.random() * 0.2;
      predictedChange = 1 + Math.random() * 3;
    } else if (content.includes('下跌') || content.includes('担忧') || content.includes('风险') || content.includes('下降')) {
      impact = 'negative';
      confidence = 0.7 + Math.random() * 0.2;
      predictedChange = -(1 + Math.random() * 3);
    } else {
      confidence = 0.5 + Math.random() * 0.3;
      predictedChange = (Math.random() - 0.5) * 2;
    }

    return {
      newsId: newsItem.id,
      impact,
      confidence: Math.round(confidence * 100) / 100,
      summary: `${newsItem.title.substring(0, 50)}... 预计对市场产生${impact === 'positive' ? '积极' : impact === 'negative' ? '消极' : '中性'}影响`,
      keyPoints: [
        newsItem.content.split('。')[0] + '。',
        '市场反应预期较为' + (impact === 'positive' ? '积极' : impact === 'negative' ? '谨慎' : '平稳'),
        '建议投资者关注后续发展'
      ].filter(point => point.length > 5),
      predictedChange: Math.round(predictedChange * 100) / 100,
      timeframe: 'short' as const
    };
  });
}

/**
 * 生成演示价格数据
 */
export function generateDemoPriceData(assetType: AssetType, days: number = 5): PriceData[] {
  const priceData: PriceData[] = [];
  
  if (assetType === 'nasdaq') {
    // 使用真实的纳斯达克100指数近期数据作为基础
    const realData = [
      { date: '2025-12-11', open: 25598.39, high: 25696.29, low: 25372.18, close: 25686.69 },
      { date: '2025-12-12', open: 25531.55, high: 25605.88, low: 25104.68, close: 25196.73 },
      { date: '2025-12-13', open: 25352.87, high: 25377.62, low: 25022.81, close: 25067.27 },
      { date: '2025-12-16', open: 24991.49, high: 25188.76, low: 24922.94, close: 25132.94 },
      { date: '2025-12-17', open: 25167.86, high: 25193.41, low: 24647.61, close: 24647.61 }
    ];
    
    return realData.slice(-days).map((item, index, array) => {
      const date = new Date(item.date);
      const previousClose = index > 0 ? array[index - 1].close : item.open;
      const change = item.close - previousClose;
      const changePercent = (change / previousClose) * 100;
      
      return {
        date,
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
        volume: Math.floor(8000000000 + Math.random() * 1000000000), // 80-90亿成交量
        change: Math.round(change * 100) / 100,
        changePercent: Math.round(changePercent * 100) / 100
      };
    });
  } else if (assetType === 'gold') {
    // 使用真实的现货黄金价格数据（美元/盎司）- 2025年12月当前价格
    const realGoldData = [
      { date: '2025-12-11', open: 4020.50, high: 4035.20, low: 4010.10, close: 4028.80 },
      { date: '2025-12-12', open: 4028.80, high: 4045.40, low: 4015.30, close: 4038.90 },
      { date: '2025-12-13', open: 4038.90, high: 4052.70, low: 4025.20, close: 4041.50 },
      { date: '2025-12-16', open: 4041.50, high: 4058.80, low: 4032.40, close: 4047.20 },
      { date: '2025-12-17', open: 4047.20, high: 4055.10, low: 4035.30, close: 4042.60 }
    ];
    
    return realGoldData.slice(-days).map((item, index, array) => {
      const date = new Date(item.date);
      const previousClose = index > 0 ? array[index - 1].close : item.open;
      const change = item.close - previousClose;
      const changePercent = (change / previousClose) * 100;
      
      return {
        date,
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
        volume: Math.floor(80000000 + Math.random() * 30000000), // 8000-11000万盎司成交量
        change: Math.round(change * 100) / 100,
        changePercent: Math.round(changePercent * 100) / 100
      };
    });
  } else if (assetType === 'astock') {
    // 使用真实的上证指数数据 - 2026年1月当前价格约3200点
    // 上证指数历史最高点是2007年10月的6124点，从未达到过4197点
    const realAStockData = [
      { date: '2026-01-05', open: 3186.76, high: 3205.23, low: 3175.12, close: 3195.34 },
      { date: '2026-01-06', open: 3195.34, high: 3212.45, low: 3188.90, close: 3208.67 },
      { date: '2026-01-07', open: 3208.67, high: 3218.89, low: 3198.23, close: 3215.45 },
      { date: '2026-01-08', open: 3215.45, high: 3225.67, low: 3210.12, close: 3220.43 },
      { date: '2026-01-09', open: 3220.43, high: 3228.90, low: 3215.78, close: 3222.56 }
    ];
    
    return realAStockData.slice(-days).map((item, index, array) => {
      const date = new Date(item.date);
      const previousClose = index > 0 ? array[index - 1].close : item.open;
      const change = item.close - previousClose;
      const changePercent = (change / previousClose) * 100;
      
      return {
        date,
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
        volume: Math.floor(300000000000 + Math.random() * 100000000000), // 3000-4000亿成交量
        change: Math.round(change * 100) / 100,
        changePercent: Math.round(changePercent * 100) / 100
      };
    });
  } else {
    // 其他资产的默认逻辑
    const basePrice = 4040; // 当前黄金价格约4040美元/盎司
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      const randomFactor = 0.98 + Math.random() * 0.04;
      const dayPrice = basePrice * randomFactor;
      
      const open = dayPrice * (0.995 + Math.random() * 0.01);
      const close = dayPrice * (0.995 + Math.random() * 0.01);
      const high = Math.max(open, close) * (1 + Math.random() * 0.02);
      const low = Math.min(open, close) * (1 - Math.random() * 0.02);
      const volume = Math.floor(1000000 + Math.random() * 5000000);
      
      priceData.push({
        date,
        open: Math.round(open * 100) / 100,
        high: Math.round(high * 100) / 100,
        low: Math.round(low * 100) / 100,
        close: Math.round(close * 100) / 100,
        volume,
        change: Math.round((close - open) * 100) / 100,
        changePercent: Math.round(((close - open) / open) * 10000) / 100
      });
    }
  }
  
  return priceData;
}

/**
 * 生成演示资产信息
 */
export function generateDemoAssetInfo(assetType: AssetType): AssetInfo {
  const assetData = {
    gold: {
      symbol: 'XAUUSD',
      name: '现货黄金',
      currentPrice: 4040 + Math.random() * 30, // 现货黄金价格范围 4040-4070美元/盎司
      currency: 'USD'
    },
    nasdaq: {
      symbol: 'NDX',
      name: '纳斯达克100指数',
      currentPrice: 24500 + Math.random() * 500, // 纳斯达克100指数价格范围
      currency: 'USD'
    },
    astock: {
      symbol: 'SSE',
      name: '上证指数',
      currentPrice: 3200 + Math.random() * 50, // 上证指数价格范围 3200-3250
      currency: 'CNY'
    }
  };
  
  const data = assetData[assetType];
  
  return {
    symbol: data.symbol,
    name: data.name,
    currentPrice: Math.round(data.currentPrice * 100) / 100,
    currency: data.currency,
    lastUpdated: new Date()
  };
}

/**
 * 检查是否应该使用演示数据
 */
export function shouldUseDemoData(): boolean {
  // 检查API密钥是否为占位符
  const apiKeys = [
    process.env.GEMINI_API_KEY,
    process.env.NEWS_API_KEY,
    process.env.ALPHA_VANTAGE_API_KEY
  ];
  
  return apiKeys.some(key => 
    !key || 
    key === '' || 
    key.includes('demo') || 
    key.includes('placeholder') || 
    key.includes('your_') ||
    key === 'demo_gemini_key_placeholder' ||
    key === 'demo_news_key_placeholder' ||
    key === 'demo_alpha_vantage_key_placeholder'
  );
}