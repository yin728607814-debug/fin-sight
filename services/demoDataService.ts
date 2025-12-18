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

  const newsData = assetType === 'gold' ? goldNews : nasdaqNews;
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
  const basePrice = assetType === 'gold' ? 2000 : 24500; // 纳斯达克100指数基础价格
  const priceData: PriceData[] = [];
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    // 生成随机但合理的价格数据
    const randomFactor = 0.98 + Math.random() * 0.04; // ±2%的随机波动
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
      currentPrice: 2000 + Math.random() * 100,
      currency: 'USD'
    },
    nasdaq: {
      symbol: 'NDX',
      name: '纳斯达克100指数',
      currentPrice: 24500 + Math.random() * 500, // 纳斯达克100指数价格范围
      currency: 'USD'
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