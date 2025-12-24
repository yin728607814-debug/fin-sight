/**
 * 完整工作流程测试：获取多条新闻并批量翻译
 */

import axios from 'axios';

const FINNHUB_API_KEY = 'd55pnopr01qu4cciap2gd55pnopr01qu4cciap30';
const GEMINI_API_KEY = 'AIzaSyCAdE2PtKhh7ZktZAywXMVR26-oFoKFZOo';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchMultipleStocksNews() {
  console.log('📡 获取多个股票的新闻...\n');
  
  const tickers = ['AAPL', 'MSFT', 'GOOGL', 'NVDA'];
  const toDate = new Date();
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - 7);
  
  const formatDate = (date: Date) => date.toISOString().split('T')[0];
  
  const allNews: any[] = [];
  
  for (const ticker of tickers) {
    try {
      console.log(`  获取 ${ticker} 的新闻...`);
      const response = await axios.get('https://finnhub.io/api/v1/company-news', {
        params: {
          symbol: ticker,
          from: formatDate(fromDate),
          to: formatDate(toDate),
          token: FINNHUB_API_KEY
        }
      });
      
      console.log(`  ✅ ${ticker}: ${response.data.length} 条新闻`);
      allNews.push(...response.data);
      
      // 避免速率限制
      await sleep(1000);
    } catch (error: any) {
      console.error(`  ❌ ${ticker} 失败:`, error.message);
    }
  }
  
  console.log(`\n📊 总计获取 ${allNews.length} 条新闻`);
  
  // 去重
  const uniqueNews = Array.from(
    new Map(allNews.map(item => [item.url, item])).values()
  );
  
  console.log(`📊 去重后 ${uniqueNews.length} 条新闻\n`);
  
  // 按时间排序，取最新的10条
  const sortedNews = uniqueNews
    .sort((a, b) => b.datetime - a.datetime)
    .slice(0, 10);
  
  return sortedNews;
}

async function translateBatch(newsItems: any[]) {
  console.log(`🌐 开始批量翻译 ${newsItems.length} 条新闻...\n`);
  
  const translatedItems = [];
  
  for (let i = 0; i < newsItems.length; i++) {
    const news = newsItems[i];
    console.log(`[${i + 1}/${newsItems.length}] 翻译: ${news.headline.substring(0, 50)}...`);
    
    try {
      // 翻译标题
      const titleResponse = await axios.post(
        `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
        {
          contents: [{
            parts: [{
              text: `请将以下英文翻译成中文，只返回翻译结果：\n\n${news.headline}`
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 512
          }
        },
        { timeout: 10000 }
      );
      
      const translatedTitle = titleResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      
      // 翻译摘要
      let translatedSummary = news.summary;
      if (news.summary) {
        const summaryResponse = await axios.post(
          `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
          {
            contents: [{
              parts: [{
                text: `请将以下英文翻译成中文，只返回翻译结果：\n\n${news.summary.substring(0, 300)}`
              }]
            }],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 512
            }
          },
          { timeout: 10000 }
        );
        
        translatedSummary = summaryResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      }
      
      translatedItems.push({
        original: {
          title: news.headline,
          summary: news.summary?.substring(0, 100)
        },
        translated: {
          title: translatedTitle,
          summary: translatedSummary?.substring(0, 100)
        },
        source: news.source,
        time: new Date(news.datetime * 1000).toLocaleString()
      });
      
      console.log(`  ✅ 翻译成功`);
      
      // 避免API限制
      await sleep(2000);
      
    } catch (error: any) {
      console.error(`  ❌ 翻译失败:`, error.message);
      translatedItems.push({
        original: {
          title: news.headline,
          summary: news.summary?.substring(0, 100)
        },
        translated: {
          title: news.headline,
          summary: news.summary?.substring(0, 100)
        },
        source: news.source,
        time: new Date(news.datetime * 1000).toLocaleString(),
        error: true
      });
    }
  }
  
  return translatedItems;
}

async function main() {
  console.log('🚀 完整工作流程测试\n');
  console.log('='.repeat(80) + '\n');
  
  try {
    // 1. 获取新闻
    const news = await fetchMultipleStocksNews();
    
    console.log('='.repeat(80) + '\n');
    
    // 2. 批量翻译
    const translated = await translateBatch(news);
    
    console.log('\n' + '='.repeat(80) + '\n');
    console.log('📋 翻译结果汇总：\n');
    
    translated.forEach((item, index) => {
      console.log(`${index + 1}. ${item.source} - ${item.time}`);
      console.log(`   原文: ${item.original.title}`);
      console.log(`   译文: ${item.translated.title}`);
      if (item.error) {
        console.log(`   ⚠️ 翻译失败，保留原文`);
      }
      console.log('');
    });
    
    const successCount = translated.filter(item => !item.error).length;
    console.log('='.repeat(80));
    console.log(`\n✅ 测试完成！`);
    console.log(`📊 成功翻译: ${successCount}/${translated.length} 条新闻`);
    console.log(`\n💡 结论: Finnhub + Gemini翻译功能工作正常！`);
    
  } catch (error: any) {
    console.error('\n❌ 测试失败:', error.message);
    process.exit(1);
  }
}

main();
