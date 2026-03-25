#!/usr/bin/env node

/**
 * 测试完整的新闻获取流程
 * 模拟生产环境的新闻获取策略
 */

import axios from 'axios';

// 模拟东方财富API
async function fetchEastMoneyNews(limit) {
  console.log(`📰 [东方财富] 请求 ${limit} 条美股新闻...`);
  // 模拟返回20条新闻
  return Array.from({ length: 20 }, (_, i) => ({
    id: `eastmoney_${i}`,
    title: `东方财富美股新闻 ${i + 1}`,
    url: `https://eastmoney.com/news/${i}`,
    source: '东方财富'
  }));
}

// 模拟新浪财经API
async function fetchSinaUSStockNews(limit) {
  console.log(`📰 [新浪财经] 请求 ${limit} 条美股新闻...`);
  // 模拟返回15条新闻
  return Array.from({ length: 15 }, (_, i) => ({
    id: `sina_${i}`,
    title: `新浪财经美股新闻 ${i + 1}`,
    url: `https://sina.com/news/${i}`,
    source: '新浪财经'
  }));
}

// 极速数据多频道获取
async function fetchJisuMultiChannel(channels, numPerChannel, type) {
  console.log(`📰 [极速数据] 多频道策略: ${channels.join(' + ')}`);
  
  const allNews = [];
  
  for (const channel of channels) {
    try {
      const response = await axios.get('https://api.jisuapi.com/news/get', {
        params: {
          appkey: '5fb0e1d5106b8fc0',
          channel: channel,
          num: numPerChannel
        },
        timeout: 10000
      });
      
      if (response.data.status === 0) {
        const articles = response.data.result?.list || [];
        
        // 根据类型过滤
        const filtered = articles.filter(a => {
          const text = `${a.title} ${a.content}`.toLowerCase();
          
          if (type === 'nasdaq') {
            return text.includes('美股') || text.includes('纳斯达克') || text.includes('纳指') ||
                   text.includes('科技股') || text.includes('nasdaq') ||
                   text.includes('苹果') || text.includes('微软') || text.includes('谷歌') ||
                   text.includes('亚马逊') || text.includes('特斯拉') || text.includes('英伟达');
          } else if (type === 'gold') {
            return text.includes('黄金') || text.includes('金价') || 
                   text.includes('贵金属') || text.includes('白银');
          } else if (type === 'astock') {
            return text.includes('a股') || text.includes('上证') || 
                   text.includes('深证') || text.includes('创业板') || 
                   text.includes('科创板') || text.includes('沪指');
          }
          
          return false;
        });
        
        console.log(`   ${channel}频道: ${articles.length}条 → 过滤后 ${filtered.length}条`);
        
        allNews.push(...filtered.map(a => ({
          id: `jisu_${channel}_${a.title}`,
          title: a.title,
          url: a.weburl || '#',
          source: '极速数据'
        })));
      }
    } catch (error) {
      console.error(`   ${channel}频道失败:`, error.message);
    }
  }
  
  // 去重
  const seen = new Set();
  const unique = allNews.filter(a => {
    if (seen.has(a.url)) return false;
    seen.add(a.url);
    return true;
  });
  
  console.log(`   合并去重: ${allNews.length} → ${unique.length}条`);
  
  return unique;
}

// 去重函数
function deduplicateNews(newsItems) {
  const seen = new Map();
  newsItems.forEach(item => {
    const key = item.url || item.title;
    if (!seen.has(key)) {
      seen.set(key, item);
    }
  });
  return Array.from(seen.values());
}

// 测试纳斯达克新闻获取
async function testNasdaqNews() {
  console.log('\n🔍 测试纳斯达克新闻获取流程');
  console.log('═'.repeat(80));
  
  const limit = 50;
  const allNews = [];
  
  // 1. 东方财富
  try {
    const eastmoneyNews = await fetchEastMoneyNews(limit * 2);
    console.log(`✅ 东方财富: ${eastmoneyNews.length}条`);
    allNews.push(...eastmoneyNews);
  } catch (error) {
    console.error(`❌ 东方财富失败:`, error.message);
  }
  
  // 2. 新浪财经
  if (allNews.length < limit) {
    console.log(`📊 东方财富不足（${allNews.length}/${limit}），尝试新浪财经`);
    try {
      const sinaNews = await fetchSinaUSStockNews(300);
      console.log(`✅ 新浪财经: ${sinaNews.length}条`);
      allNews.push(...sinaNews);
    } catch (error) {
      console.error(`❌ 新浪财经失败:`, error.message);
    }
  }
  
  // 去重
  const uniqueNews = deduplicateNews(allNews);
  console.log(`🔄 去重后: ${uniqueNews.length}条`);
  
  // 3. 极速数据补充
  if (uniqueNews.length < limit) {
    console.log(`📊 前两个源不足（${uniqueNews.length}/${limit}），尝试极速数据`);
    try {
      const jisuNews = await fetchJisuMultiChannel(['科技', '股票', '财经'], 50, 'nasdaq');
      console.log(`✅ 极速数据: ${jisuNews.length}条`);
      
      const combined = [...uniqueNews, ...jisuNews];
      const deduped = deduplicateNews(combined);
      console.log(`🔄 合并后去重: ${deduped.length}条`);
      
      const finalNews = deduped.slice(0, limit);
      console.log(`\n🎯 最终结果: ${finalNews.length}条 ${finalNews.length >= limit ? '✅ 达标' : '⚠️ 不足'}`);
      console.log(`📊 来源分布:`);
      console.log(`   东方财富: ${finalNews.filter(n => n.source === '东方财富').length}条`);
      console.log(`   新浪财经: ${finalNews.filter(n => n.source === '新浪财经').length}条`);
      console.log(`   极速数据: ${finalNews.filter(n => n.source === '极速数据').length}条`);
      
      return finalNews;
    } catch (error) {
      console.error(`❌ 极速数据失败:`, error.message);
    }
  }
  
  const finalNews = uniqueNews.slice(0, limit);
  console.log(`\n🎯 最终结果: ${finalNews.length}条 ${finalNews.length >= limit ? '✅ 达标' : '⚠️ 不足'}`);
  console.log(`📊 来源分布:`);
  console.log(`   东方财富: ${finalNews.filter(n => n.source === '东方财富').length}条`);
  console.log(`   新浪财经: ${finalNews.filter(n => n.source === '新浪财经').length}条`);
  
  return finalNews;
}

// 测试黄金新闻获取
async function testGoldNews() {
  console.log('\n🔍 测试黄金新闻获取流程');
  console.log('═'.repeat(80));
  
  const limit = 50;
  const allNews = [];
  
  // 1. 东方财富黄金频道（模拟）
  console.log(`📰 [东方财富黄金] 请求新闻...`);
  const eastmoneyGoldNews = Array.from({ length: 25 }, (_, i) => ({
    id: `eastmoney_gold_${i}`,
    title: `东方财富黄金新闻 ${i + 1}`,
    url: `https://gold.eastmoney.com/news/${i}`,
    source: '东方财富'
  }));
  console.log(`✅ 东方财富黄金: ${eastmoneyGoldNews.length}条`);
  allNews.push(...eastmoneyGoldNews);
  
  // 2. 新浪财经黄金（模拟）
  if (allNews.length < limit) {
    console.log(`📊 东方财富不足（${allNews.length}/${limit}），尝试新浪财经`);
    const sinaGoldNews = Array.from({ length: 10 }, (_, i) => ({
      id: `sina_gold_${i}`,
      title: `新浪财经黄金新闻 ${i + 1}`,
      url: `https://sina.com/gold/${i}`,
      source: '新浪财经'
    }));
    console.log(`✅ 新浪财经黄金: ${sinaGoldNews.length}条`);
    allNews.push(...sinaGoldNews);
  }
  
  // 去重
  const uniqueNews = deduplicateNews(allNews);
  console.log(`🔄 去重后: ${uniqueNews.length}条`);
  
  // 3. 极速数据补充
  if (uniqueNews.length < limit) {
    console.log(`📊 前两个源不足（${uniqueNews.length}/${limit}），尝试极速数据`);
    try {
      const jisuNews = await fetchJisuMultiChannel(['股票', '新闻', '头条', '财经'], 50, 'gold');
      console.log(`✅ 极速数据: ${jisuNews.length}条`);
      
      const combined = [...uniqueNews, ...jisuNews];
      const deduped = deduplicateNews(combined);
      console.log(`🔄 合并后去重: ${deduped.length}条`);
      
      const finalNews = deduped.slice(0, limit);
      console.log(`\n🎯 最终结果: ${finalNews.length}条 ${finalNews.length >= limit ? '✅ 达标' : '⚠️ 不足'}`);
      console.log(`📊 来源分布:`);
      console.log(`   东方财富: ${finalNews.filter(n => n.source === '东方财富').length}条`);
      console.log(`   新浪财经: ${finalNews.filter(n => n.source === '新浪财经').length}条`);
      console.log(`   极速数据: ${finalNews.filter(n => n.source === '极速数据').length}条`);
      
      return finalNews;
    } catch (error) {
      console.error(`❌ 极速数据失败:`, error.message);
    }
  }
  
  const finalNews = uniqueNews.slice(0, limit);
  console.log(`\n🎯 最终结果: ${finalNews.length}条 ${finalNews.length >= limit ? '✅ 达标' : '⚠️ 不足'}`);
  
  return finalNews;
}

// 测试A股新闻获取
async function testAStockNews() {
  console.log('\n🔍 测试A股新闻获取流程');
  console.log('═'.repeat(80));
  
  const limit = 50;
  const allNews = [];
  
  // 1. 东方财富A股（模拟）
  console.log(`📰 [东方财富A股] 请求新闻...`);
  const eastmoneyAStockNews = Array.from({ length: 30 }, (_, i) => ({
    id: `eastmoney_astock_${i}`,
    title: `东方财富A股新闻 ${i + 1}`,
    url: `https://eastmoney.com/astock/${i}`,
    source: '东方财富'
  }));
  console.log(`✅ 东方财富A股: ${eastmoneyAStockNews.length}条`);
  allNews.push(...eastmoneyAStockNews);
  
  // 2. 新浪财经A股（模拟）
  if (allNews.length < limit) {
    console.log(`📊 东方财富不足（${allNews.length}/${limit}），尝试新浪财经`);
    const sinaAStockNews = Array.from({ length: 12 }, (_, i) => ({
      id: `sina_astock_${i}`,
      title: `新浪财经A股新闻 ${i + 1}`,
      url: `https://sina.com/astock/${i}`,
      source: '新浪财经'
    }));
    console.log(`✅ 新浪财经A股: ${sinaAStockNews.length}条`);
    allNews.push(...sinaAStockNews);
  }
  
  // 去重
  const uniqueNews = deduplicateNews(allNews);
  console.log(`🔄 去重后: ${uniqueNews.length}条`);
  
  // 3. 极速数据补充
  if (uniqueNews.length < limit) {
    console.log(`📊 前两个源不足（${uniqueNews.length}/${limit}），尝试极速数据`);
    try {
      const jisuNews = await fetchJisuMultiChannel(['股票', '财经', '头条'], 50, 'astock');
      console.log(`✅ 极速数据: ${jisuNews.length}条`);
      
      const combined = [...uniqueNews, ...jisuNews];
      const deduped = deduplicateNews(combined);
      console.log(`🔄 合并后去重: ${deduped.length}条`);
      
      const finalNews = deduped.slice(0, limit);
      console.log(`\n🎯 最终结果: ${finalNews.length}条 ${finalNews.length >= limit ? '✅ 达标' : '⚠️ 不足'}`);
      console.log(`📊 来源分布:`);
      console.log(`   东方财富: ${finalNews.filter(n => n.source === '东方财富').length}条`);
      console.log(`   新浪财经: ${finalNews.filter(n => n.source === '新浪财经').length}条`);
      console.log(`   极速数据: ${finalNews.filter(n => n.source === '极速数据').length}条`);
      
      return finalNews;
    } catch (error) {
      console.error(`❌ 极速数据失败:`, error.message);
    }
  }
  
  const finalNews = uniqueNews.slice(0, limit);
  console.log(`\n🎯 最终结果: ${finalNews.length}条 ${finalNews.length >= limit ? '✅ 达标' : '⚠️ 不足'}`);
  
  return finalNews;
}

// 运行所有测试
async function runAllTests() {
  console.log('🚀 开始测试完整新闻获取流程\n');
  
  await testNasdaqNews();
  await testGoldNews();
  await testAStockNews();
  
  console.log('\n' + '═'.repeat(80));
  console.log('✅ 所有测试完成');
}

runAllTests().catch(console.error);
