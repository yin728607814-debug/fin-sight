#!/usr/bin/env node

/**
 * 详细测试东方财富和新浪财经的新闻获取情况
 */

import axios from 'axios';

// 测试东方财富黄金新闻
async function testEastmoneyGold() {
  console.log('\n🔍 测试东方财富黄金频道');
  console.log('═'.repeat(80));
  
  try {
    const response = await axios.get('http://localhost:8788/eastmoney-gold-proxy', {
      timeout: 30000
    });
    
    const articles = response.data.articles || [];
    console.log(`✅ 获取到 ${articles.length} 条新闻`);
    
    // 显示前5条标题
    console.log('\n前5条新闻标题:');
    articles.slice(0, 5).forEach((a, i) => {
      console.log(`${i + 1}. ${a.title}`);
    });
    
    // 分析黄金相关性
    const goldRelated = articles.filter(a => {
      const text = `${a.title} ${a.description || ''}`.toLowerCase();
      return text.includes('黄金') || text.includes('金价') || 
             text.includes('贵金属') || text.includes('白银');
    });
    
    console.log(`\n黄金相关新闻: ${goldRelated.length}条`);
    
    return articles;
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    return [];
  }
}

// 测试新浪财经黄金新闻
async function testSinaGold() {
  console.log('\n🔍 测试新浪财经黄金新闻');
  console.log('═'.repeat(80));
  
  try {
    // 测试不同的请求数量
    for (const num of [100, 300, 500]) {
      console.log(`\n📰 请求 ${num} 条新闻...`);
      
      const response = await axios.get('https://feed.mix.sina.com.cn/api/roll/get', {
        params: {
          pageid: '153',
          lid: '2509',  // 财经要闻
          num: num,
          versionNumber: '1.2.8',
          page: 1,
          encode: 'utf-8'
        },
        timeout: 30000
      });
      
      const articles = response.data.result?.data || [];
      console.log(`   获取到 ${articles.length} 条原始新闻`);
      
      // 过滤黄金相关
      const goldNews = articles.filter(article => {
        const title = article.title || '';
        const content = (article.intro || '').toLowerCase();
        
        const keywords = ['黄金', '金价', '贵金属', '白银', '现货金', 'XAUUSD', 
                         '伦敦金', '美元金', '金市', '黄金市场', '金银',
                         '避险', '通胀', '美联储', '央行', '黄金储备'];
        
        return keywords.some(kw => 
          title.includes(kw) || content.includes(kw.toLowerCase())
        );
      });
      
      console.log(`   黄金相关: ${goldNews.length}条`);
      
      if (num === 500) {
        console.log('\n前5条黄金新闻标题:');
        goldNews.slice(0, 5).forEach((a, i) => {
          console.log(`${i + 1}. ${a.title}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

// 测试东方财富美股新闻
async function testEastmoneyUS() {
  console.log('\n🔍 测试东方财富美股新闻');
  console.log('═'.repeat(80));
  
  try {
    const response = await axios.get('http://localhost:8788/eastmoney-news-proxy', {
      timeout: 30000
    });
    
    const articles = response.data.articles || [];
    console.log(`✅ 获取到 ${articles.length} 条新闻`);
    
    // 显示前5条标题
    console.log('\n前5条新闻标题:');
    articles.slice(0, 5).forEach((a, i) => {
      console.log(`${i + 1}. ${a.title}`);
    });
    
    // 分析美股相关性
    const usRelated = articles.filter(a => {
      const text = `${a.title} ${a.description || ''}`.toLowerCase();
      return text.includes('美股') || text.includes('纳斯达克') || 
             text.includes('科技股') || text.includes('nasdaq');
    });
    
    console.log(`\n美股相关新闻: ${usRelated.length}条`);
    
    return articles;
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    return [];
  }
}

// 测试新浪财经美股新闻
async function testSinaUS() {
  console.log('\n🔍 测试新浪财经美股新闻');
  console.log('═'.repeat(80));
  
  try {
    // 测试不同的请求数量
    for (const num of [100, 300, 500]) {
      console.log(`\n📰 请求 ${num} 条新闻...`);
      
      const response = await axios.get('https://feed.mix.sina.com.cn/api/roll/get', {
        params: {
          pageid: '153',
          lid: '2509',
          num: num,
          versionNumber: '1.2.8',
          page: 1,
          encode: 'utf-8'
        },
        timeout: 30000
      });
      
      const articles = response.data.result?.data || [];
      console.log(`   获取到 ${articles.length} 条原始新闻`);
      
      // 过滤美股相关
      const usNews = articles.filter(article => {
        const url = article.url || '';
        const title = article.title || '';
        const content = (article.intro || '').toLowerCase();
        
        // URL过滤
        const hasUSStockURL = url.includes('/stock/usstock/') || 
                             url.includes('/stock/us/') ||
                             url.includes('/usstock/');
        
        if (hasUSStockURL) return true;
        
        // 关键词过滤
        const keywords = ['美股', '纳斯达克', '纳指', '科技股', 'NASDAQ', 
                         '苹果', '微软', '谷歌', '亚马逊', '特斯拉', '英伟达',
                         'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA',
                         '华尔街', '道琼斯', '标普'];
        
        return keywords.some(kw => 
          title.includes(kw) || content.includes(kw.toLowerCase())
        );
      });
      
      console.log(`   美股相关: ${usNews.length}条`);
      
      if (num === 500) {
        console.log('\n前5条美股新闻标题:');
        usNews.slice(0, 5).forEach((a, i) => {
          console.log(`${i + 1}. ${a.title}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

// 运行所有测试
async function runTests() {
  console.log('🚀 开始详细测试新闻源\n');
  
  await testEastmoneyGold();
  await testSinaGold();
  
  await testEastmoneyUS();
  await testSinaUS();
  
  console.log('\n' + '═'.repeat(80));
  console.log('✅ 所有测试完成');
}

runTests().catch(console.error);
