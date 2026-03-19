#!/usr/bin/env node

/**
 * 开发环境极速数据API模拟服务器
 */

import express from 'express';
import cors from 'cors';

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// 生成测试新闻数据
function generateTestNews(type, category) {
  const testNews = {
    gold: [
      {
        title: '国际黄金价格今日上涨1.2%，避险需求推动金价走高',
        description: '受地缘政治紧张局势影响，投资者避险情绪升温，国际黄金价格今日上涨1.2%，突破重要阻力位。',
        content: '受地缘政治紧张局势影响，投资者避险情绪升温，国际黄金价格今日上涨1.2%，突破重要阻力位。分析师认为，在全球经济不确定性增加的背景下，黄金作为避险资产的吸引力进一步增强。',
        url: '#',
        urlToImage: '',
        publishedAt: new Date().toISOString(),
        source: { name: '极速数据(开发测试)' },
        author: '极速数据'
      },
      {
        title: '央行黄金储备连续增持，专家看好后市表现',
        description: '多国央行持续增持黄金储备，显示出对黄金长期价值的认可，专家普遍看好黄金后市表现。',
        content: '多国央行持续增持黄金储备，显示出对黄金长期价值的认可。数据显示，今年以来全球央行黄金购买量创历史新高，专家普遍看好黄金后市表现。',
        url: '#',
        urlToImage: '',
        publishedAt: new Date(Date.now() - 3600000).toISOString(),
        source: { name: '极速数据(开发测试)' },
        author: '极速数据'
      },
      {
        title: '黄金ETF资金流入创新高，机构看好贵金属投资',
        description: '黄金ETF连续多日资金净流入，机构投资者加大贵金属配置，看好长期投资价值。',
        content: '黄金ETF连续多日资金净流入，机构投资者加大贵金属配置。分析师指出，在通胀预期和货币政策不确定性背景下，黄金的配置价值凸显。',
        url: '#',
        urlToImage: '',
        publishedAt: new Date(Date.now() - 10800000).toISOString(),
        source: { name: '极速数据(开发测试)' },
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
        source: { name: '极速数据(开发测试)' },
        author: '极速数据'
      },
      {
        title: '美股科技股财报季表现亮眼，纳指有望继续上涨',
        description: '科技股财报季表现超预期，多家公司业绩创新高，分析师上调纳斯达克指数目标价。',
        content: '科技股财报季表现超预期，多家公司业绩创新高。分析师认为，在AI技术推动下，科技股仍有上涨空间，纳斯达克指数有望继续创新高。',
        url: '#',
        urlToImage: '',
        publishedAt: new Date(Date.now() - 7200000).toISOString(),
        source: { name: '极速数据(开发测试)' },
        author: '极速数据'
      },
      {
        title: '纳斯达克100指数调整成分股，AI公司权重提升',
        description: '纳斯达克100指数宣布调整成分股，多家AI相关公司权重提升，反映科技行业发展趋势。',
        content: '纳斯达克100指数宣布调整成分股，多家AI相关公司权重提升。这一调整反映了人工智能技术在科技行业中的重要地位，预计将吸引更多资金流入。',
        url: '#',
        urlToImage: '',
        publishedAt: new Date(Date.now() - 14400000).toISOString(),
        source: { name: '极速数据(开发测试)' },
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
        source: { name: '极速数据(开发测试)' },
        author: '极速数据'
      },
      {
        title: '全球股市震荡，投资者寻求避险资产',
        description: '全球股市出现震荡，投资者开始寻求避险资产，债券和黄金受到关注。',
        content: '全球股市出现震荡，投资者开始寻求避险资产。债券和黄金等传统避险资产重新受到关注，资金流向发生变化。',
        url: '#',
        urlToImage: '',
        publishedAt: new Date(Date.now() - 3600000).toISOString(),
        source: { name: '极速数据(开发测试)' },
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

// 极速数据API模拟端点
app.get('/jisu-news-proxy', (req, res) => {
  const { category = '财经', type = '', num = '10' } = req.query;
  
  console.log('🔧 模拟极速数据API请求:', { category, type, num });
  
  const articles = generateTestNews(type, category);
  const limitedArticles = articles.slice(0, parseInt(num));
  
  const response = {
    status: 'ok',
    totalResults: limitedArticles.length,
    articles: limitedArticles,
    debug: {
      message: '开发环境测试数据 - 极速数据API模拟',
      isTestData: true,
      type: type,
      category: category,
      requestedNum: num
    }
  };
  
  console.log('✅ 返回测试数据:', {
    articlesCount: limitedArticles.length,
    type: type
  });
  
  res.json(response);
});

app.listen(port, () => {
  console.log(`🚀 极速数据API模拟服务器运行在 http://localhost:${port}`);
  console.log('📡 端点: /jisu-news-proxy');
  console.log('💡 支持参数: category, type, num');
});