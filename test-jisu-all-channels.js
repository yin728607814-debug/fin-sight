#!/usr/bin/env node

/**
 * 测试极速数据所有频道，找出最适合的频道
 */

import axios from 'axios';

async function testAllChannels() {
  const apiKey = '5fb0e1d5106b8fc0';
  
  console.log('🔍 测试极速数据所有频道\n');
  console.log('═'.repeat(80));
  
  // 极速数据支持的频道列表
  const channels = [
    '头条', '新闻', '国内', '国际', '政治', '财经', '体育', 
    '娱乐', '军事', '教育', '科技', 'NBA', '股票', '星座', 
    '女性', '健康', '育儿'
  ];
  
  const results = [];
  
  for (const channel of channels) {
    try {
      const response = await axios.get('https://api.jisuapi.com/news/get', {
        params: {
          appkey: apiKey,
          channel: channel,
          num: 30
        },
        timeout: 10000
      });
      
      if (response.data.status === 0) {
        const articles = response.data.result?.list || [];
        
        // 分析新闻相关性
        const nasdaqRelated = articles.filter(a => {
          const text = `${a.title} ${a.content}`.toLowerCase();
          return text.includes('美股') || text.includes('纳斯达克') || 
                 text.includes('科技股') || text.includes('苹果') || 
                 text.includes('微软') || text.includes('特斯拉');
        });
        
        const goldRelated = articles.filter(a => {
          const text = `${a.title} ${a.content}`.toLowerCase();
          return text.includes('黄金') || text.includes('金价') || 
                 text.includes('贵金属') || text.includes('白银');
        });
        
        const astockRelated = articles.filter(a => {
          const text = `${a.title} ${a.content}`.toLowerCase();
          return text.includes('a股') || text.includes('上证') || 
                 text.includes('深证') || text.includes('创业板') || 
                 text.includes('科创板') || text.includes('沪指');
        });
        
        results.push({
          channel,
          total: articles.length,
          nasdaq: nasdaqRelated.length,
          gold: goldRelated.length,
          astock: astockRelated.length,
          samples: articles.slice(0, 3).map(a => a.title)
        });
        
        console.log(`✅ ${channel}频道: ${articles.length}条`);
        console.log(`   纳斯达克相关: ${nasdaqRelated.length}条`);
        console.log(`   黄金相关: ${goldRelated.length}条`);
        console.log(`   A股相关: ${astockRelated.length}条`);
        
      } else {
        console.log(`❌ ${channel}频道: ${response.data.msg}`);
      }
      
    } catch (error) {
      console.log(`❌ ${channel}频道: ${error.message}`);
    }
    
    console.log('');
  }
  
  // 汇总最佳频道
  console.log('═'.repeat(80));
  console.log('\n📊 最佳频道推荐:\n');
  
  // 纳斯达克
  const bestNasdaq = results.sort((a, b) => b.nasdaq - a.nasdaq).slice(0, 3);
  console.log('纳斯达克新闻最多的频道:');
  bestNasdaq.forEach((r, i) => {
    console.log(`  ${i + 1}. ${r.channel}: ${r.nasdaq}条相关 (总${r.total}条)`);
  });
  
  // 黄金
  const bestGold = results.sort((a, b) => b.gold - a.gold).slice(0, 3);
  console.log('\n黄金新闻最多的频道:');
  bestGold.forEach((r, i) => {
    console.log(`  ${i + 1}. ${r.channel}: ${r.gold}条相关 (总${r.total}条)`);
  });
  
  // A股
  const bestAstock = results.sort((a, b) => b.astock - a.astock).slice(0, 3);
  console.log('\nA股新闻最多的频道:');
  bestAstock.forEach((r, i) => {
    console.log(`  ${i + 1}. ${r.channel}: ${r.astock}条相关 (总${r.total}条)`);
  });
  
  console.log('\n' + '═'.repeat(80));
}

testAllChannels().catch(console.error);
