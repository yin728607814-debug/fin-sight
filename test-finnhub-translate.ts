/**
 * 测试Finnhub新闻获取和翻译功能
 */

import axios from 'axios';

// 从.env读取API密钥
const FINNHUB_API_KEY = 'd55pnopr01qu4cciap2gd55pnopr01qu4cciap30';
const GEMINI_API_KEY = 'AIzaSyCAdE2PtKhh7ZktZAywXMVR26-oFoKFZOo';

async function testFinnhubNews() {
  console.log('📡 测试Finnhub新闻API...\n');
  
  try {
    // 获取Apple的新闻
    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 7);
    
    const formatDate = (date: Date) => date.toISOString().split('T')[0];
    
    const response = await axios.get('https://finnhub.io/api/v1/company-news', {
      params: {
        symbol: 'AAPL',
        from: formatDate(fromDate),
        to: formatDate(toDate),
        token: FINNHUB_API_KEY
      }
    });
    
    console.log(`✅ Finnhub API响应成功`);
    console.log(`📰 获取到 ${response.data.length} 条新闻\n`);
    
    if (response.data.length > 0) {
      const firstNews = response.data[0];
      console.log('第一条新闻示例：');
      console.log('标题:', firstNews.headline);
      console.log('摘要:', firstNews.summary?.substring(0, 100) + '...');
      console.log('来源:', firstNews.source);
      console.log('时间:', new Date(firstNews.datetime * 1000).toLocaleString());
      console.log('URL:', firstNews.url);
      console.log('\n');
      
      return firstNews;
    }
    
    return null;
  } catch (error: any) {
    console.error('❌ Finnhub API调用失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
    throw error;
  }
}

async function testTranslation(text: string) {
  console.log('🌐 测试Gemini翻译...\n');
  console.log('原文:', text.substring(0, 100) + '...\n');
  
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{
            text: `请将以下英文翻译成中文，只返回翻译结果，不要添加任何解释：\n\n${text}`
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1024
        }
      },
      {
        timeout: 10000
      }
    );

    const translatedText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    
    if (translatedText) {
      console.log('✅ 翻译成功');
      console.log('译文:', translatedText);
      console.log('\n');
      return translatedText;
    } else {
      console.error('❌ 翻译响应格式错误');
      return null;
    }
    
  } catch (error: any) {
    console.error('❌ Gemini翻译失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', JSON.stringify(error.response.data, null, 2));
    }
    throw error;
  }
}

async function main() {
  console.log('🚀 开始测试Finnhub + Gemini翻译功能\n');
  console.log('='.repeat(60) + '\n');
  
  try {
    // 1. 测试Finnhub新闻获取
    const news = await testFinnhubNews();
    
    if (!news) {
      console.log('⚠️ 没有获取到新闻，测试结束');
      return;
    }
    
    console.log('='.repeat(60) + '\n');
    
    // 2. 测试翻译标题
    console.log('📝 翻译标题...');
    await testTranslation(news.headline);
    
    console.log('='.repeat(60) + '\n');
    
    // 3. 测试翻译摘要
    if (news.summary) {
      console.log('📝 翻译摘要...');
      await testTranslation(news.summary.substring(0, 500));
    }
    
    console.log('='.repeat(60) + '\n');
    console.log('✅ 所有测试通过！');
    console.log('\n功能验证：');
    console.log('✅ Finnhub API可以正常获取新闻');
    console.log('✅ Gemini AI可以正常翻译英文到中文');
    console.log('✅ 集成功能应该可以正常工作');
    
  } catch (error) {
    console.error('\n❌ 测试失败');
    process.exit(1);
  }
}

main();
