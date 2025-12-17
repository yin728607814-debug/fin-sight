#!/usr/bin/env node

/**
 * 调试新闻数据格式
 */

require('dotenv').config();
const https = require('https');

const API_KEY = process.env.NEWS_API_KEY || process.env.VITE_NEWS_API_KEY;
const query = 'NASDAQ OR "NASDAQ 100" OR "tech stocks" OR "US stocks" OR NDX OR "technology index"';
const fromDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&sortBy=publishedAt&pageSize=3&from=${fromDate}&apiKey=${API_KEY}`;

const options = {
  headers: {
    'User-Agent': 'Investment-News-Analyzer/1.0'
  }
};

console.log('🔍 检查新闻数据格式...');

const request = https.get(url, options, (response) => {
  let data = '';
  
  response.on('data', (chunk) => {
    data += chunk;
  });
  
  response.on('end', () => {
    try {
      const result = JSON.parse(data);
      
      if (result.articles && result.articles.length > 0) {
        console.log('📰 第一条新闻的完整数据结构:');
        console.log(JSON.stringify(result.articles[0], null, 2));
        
        console.log('\n🔍 数据字段检查:');
        const article = result.articles[0];
        console.log('title:', typeof article.title, article.title ? article.title.length : 'null');
        console.log('description:', typeof article.description, article.description ? article.description.length : 'null');
        console.log('content:', typeof article.content, article.content ? article.content.length : 'null');
        console.log('url:', typeof article.url, article.url ? 'valid' : 'null');
        console.log('publishedAt:', typeof article.publishedAt, article.publishedAt);
        console.log('source:', typeof article.source, article.source);
      }
      
    } catch (error) {
      console.error('❌ 解析响应失败:', error);
    }
  });
});

request.on('error', (error) => {
  console.error('❌ 请求失败:', error);
});

request.setTimeout(10000, () => {
  console.error('❌ 请求超时');
  request.destroy();
});