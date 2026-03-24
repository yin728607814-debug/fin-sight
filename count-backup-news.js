#!/usr/bin/env node

/**
 * 统计备用新闻数量
 */

import fs from 'fs';

function countNewsInFile() {
  const content = fs.readFileSync('functions/jisu-news-proxy.ts', 'utf8');
  
  // 统计纳斯达克新闻
  const nasdaqStart = content.indexOf('if (type === \'nasdaq\') {');
  const nasdaqEnd = content.indexOf('return nasdaqNews.slice', nasdaqStart);
  const nasdaqSection = content.substring(nasdaqStart, nasdaqEnd);
  const nasdaqCount = (nasdaqSection.match(/title:/g) || []).length;
  
  // 统计黄金新闻
  const goldStart = content.indexOf('if (type === \'gold\') {');
  const goldEnd = content.indexOf('return goldNews.slice', goldStart);
  const goldSection = content.substring(goldStart, goldEnd);
  const goldCount = (goldSection.match(/title:/g) || []).length;
  
  // 统计A股新闻
  const astockStart = content.indexOf('// A股相关新闻');
  const astockEnd = content.indexOf('return astockNews.slice', astockStart);
  const astockSection = content.substring(astockStart, astockEnd);
  const astockCount = (astockSection.match(/title:/g) || []).length;
  
  console.log('📊 备用新闻数量统计:');
  console.log(`📰 纳斯达克新闻: ${nasdaqCount}条`);
  console.log(`📰 黄金新闻: ${goldCount}条`);
  console.log(`📰 A股新闻: ${astockCount}条`);
  console.log(`📰 总计: ${nasdaqCount + goldCount + astockCount}条`);
  
  console.log('\n🎯 目标达成情况:');
  console.log(`纳斯达克: ${nasdaqCount >= 30 ? '✅' : '❌'} (目标30+条)`);
  console.log(`黄金: ${goldCount >= 20 ? '✅' : '❌'} (目标20+条)`);
  console.log(`A股: ${astockCount >= 15 ? '✅' : '❌'} (目标15+条)`);
  
  if (nasdaqCount >= 30 && goldCount >= 20 && astockCount >= 15) {
    console.log('\n🎉 所有目标已达成！');
  } else {
    console.log('\n⚠️ 还需要继续添加新闻');
  }
}

countNewsInFile();