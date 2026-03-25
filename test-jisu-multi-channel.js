#!/usr/bin/env node

/**
 * 测试极速数据多频道组合策略
 */

import axios from 'axios';

async function fetchChannelNews(apiKey, channel, num = 30) {
  try {
    const response = await axios.get('https://api.jisuapi.com/news/get', {
      params: {
        appkey: apiKey,
        channel: channel,
        num: num
      },
      timeout: 10000
    });
    
    if (response.data.status === 0) {
      return response.data.result?.list || [];
    }
    return [];
  } catch (error) {
    console.error(`❌ ${channel}频道获取失败:`, error.message);
    return [];
  }
}

function filterNasdaqNews(articles) {
  return articles.filter(a => {
    const text = `${a.title} ${a.content}`.toLowerCase();
    return text.includes('美股') || text.includes('纳斯达克') || text.includes('纳指') ||
           text.includes('科技股') || text.includes('nasdaq') ||
           text.includes('苹果') || text.includes('微软') || text.includes('谷歌') ||
           text.includes('亚马逊') || text.includes('特斯拉') || text.includes('英伟达') ||
           text.includes('华尔街') || text.includes('道琼斯') || text.includes('标普');
  });
}

function filterGoldNews(articles) {
  return articles.filter(a => {
    const text = `${a.title} ${a.content}`.toLowerCase();
    return text.includes('黄金') || text.includes('金价') || 
           text.includes('贵金属') || text.includes('白银') ||
           text.includes('现货金') || text.includes('伦敦金');
  });
}

function filterAStockNews(articles) {
  return articles.filter(a => {
    const text = `${a.title} ${a.content}`.toLowerCase();
    return text.includes('a股') || text.includes('上证') || 
           text.includes('深证') || text.includes('创业板') || 
           text.includes('科创板') || text.includes('沪指') ||
           text.includes('深指') || text.includes('股市') ||
           text.includes('上证指数') || text.includes('深证成指');
  });
}

function deduplicateByUrl(articles) {
  const seen = new Set();
  return articles.filter(a => {
    const url = a.weburl || a.url || a.title;
    if (seen.has(url)) return false;
    seen.add(url);
    return true;
  });
}

async function testMultiChannelStrategy() {
  const apiKey = '5fb0e1d5106b8fc0';
  
  console.log('🔍 测试极速数据多频道组合策略\n');
  console.log('═'.repeat(80));
  
  // 测试纳斯达克多频道组合
  console.log('\n📊 纳斯达克新闻 - 多频道组合策略');
  console.log('─'.repeat(80));
  
  const nasdaqChannels = ['科技', '股票', '财经'];
  let allNasdaqNews = [];
  
  for (const channel of nasdaqChannels) {
    console.log(`\n📰 获取${channel}频道新闻...`);
    const articles = await fetchChannelNews(apiKey, channel, 50);
    const filtered = filterNasdaqNews(articles);
    console.log(`   总数: ${articles.length}条, 相关: ${filtered.length}条`);
    allNasdaqNews.push(...filtered);
  }
  
  const uniqueNasdaq = deduplicateByUrl(allNasdaqNews);
  console.log(`\n✅ 纳斯达克合并结果:`);
  console.log(`   合并前: ${allNasdaqNews.length}条`);
  console.log(`   去重后: ${uniqueNasdaq.length}条`);
  console.log(`   目标: 30条`);
  console.log(`   状态: ${uniqueNasdaq.length >= 30 ? '✅ 达标' : '⚠️ 不足'}`);
  
  // 测试黄金多频道组合
  console.log('\n\n📊 黄金新闻 - 多频道组合策略');
  console.log('─'.repeat(80));
  
  const goldChannels = ['股票', '新闻', '头条', '财经'];
  let allGoldNews = [];
  
  for (const channel of goldChannels) {
    console.log(`\n📰 获取${channel}频道新闻...`);
    const articles = await fetchChannelNews(apiKey, channel, 50);
    const filtered = filterGoldNews(articles);
    console.log(`   总数: ${articles.length}条, 相关: ${filtered.length}条`);
    allGoldNews.push(...filtered);
  }
  
  const uniqueGold = deduplicateByUrl(allGoldNews);
  console.log(`\n✅ 黄金合并结果:`);
  console.log(`   合并前: ${allGoldNews.length}条`);
  console.log(`   去重后: ${uniqueGold.length}条`);
  console.log(`   目标: 30条`);
  console.log(`   状态: ${uniqueGold.length >= 30 ? '✅ 达标' : '⚠️ 不足'}`);
  
  // 测试A股多频道组合
  console.log('\n\n📊 A股新闻 - 多频道组合策略');
  console.log('─'.repeat(80));
  
  const astockChannels = ['股票', '财经', '头条'];
  let allAStockNews = [];
  
  for (const channel of astockChannels) {
    console.log(`\n📰 获取${channel}频道新闻...`);
    const articles = await fetchChannelNews(apiKey, channel, 50);
    const filtered = filterAStockNews(articles);
    console.log(`   总数: ${articles.length}条, 相关: ${filtered.length}条`);
    allAStockNews.push(...filtered);
  }
  
  const uniqueAStock = deduplicateByUrl(allAStockNews);
  console.log(`\n✅ A股合并结果:`);
  console.log(`   合并前: ${allAStockNews.length}条`);
  console.log(`   去重后: ${uniqueAStock.length}条`);
  console.log(`   目标: 30条`);
  console.log(`   状态: ${uniqueAStock.length >= 30 ? '✅ 达标' : '⚠️ 不足'}`);
  
  // 总结
  console.log('\n\n' + '═'.repeat(80));
  console.log('📋 多频道组合策略总结:\n');
  console.log(`纳斯达克: ${uniqueNasdaq.length}条 ${uniqueNasdaq.length >= 30 ? '✅' : '⚠️'} (科技+股票+财经)`);
  console.log(`黄金: ${uniqueGold.length}条 ${uniqueGold.length >= 30 ? '✅' : '⚠️'} (股票+新闻+头条+财经)`);
  console.log(`A股: ${uniqueAStock.length}条 ${uniqueAStock.length >= 30 ? '✅' : '⚠️'} (股票+财经+头条)`);
  console.log('\n' + '═'.repeat(80));
  
  // 显示样本新闻标题
  console.log('\n📰 样本新闻标题:\n');
  
  console.log('纳斯达克 (前5条):');
  uniqueNasdaq.slice(0, 5).forEach((a, i) => {
    console.log(`  ${i + 1}. ${a.title}`);
  });
  
  console.log('\n黄金 (前5条):');
  uniqueGold.slice(0, 5).forEach((a, i) => {
    console.log(`  ${i + 1}. ${a.title}`);
  });
  
  console.log('\nA股 (前5条):');
  uniqueAStock.slice(0, 5).forEach((a, i) => {
    console.log(`  ${i + 1}. ${a.title}`);
  });
}

testMultiChannelStrategy().catch(console.error);
