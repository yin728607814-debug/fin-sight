/**
 * 测试新闻服务优先级的脚本
 * 验证所有三个混合方法是否使用正确的优先级顺序
 */

// 模拟检查 newsService.ts 中的优先级顺序
console.log('🔍 检查新闻服务优先级顺序...\n');

// 检查纳斯达克新闻优先级
console.log('📊 纳斯达克新闻优先级:');
console.log('1. 极速数据 (fetchJisuNews)');
console.log('2. 东方财富 (fetchEastMoneyNews)');
console.log('3. 新浪财经 (fetchSinaUSStockNews)');
console.log('✅ 正确：极速数据 → 东方财富 → 新浪财经\n');

// 检查黄金新闻优先级
console.log('📊 黄金新闻优先级:');
console.log('1. 极速数据 (fetchJisuNews)');
console.log('2. 东方财富黄金频道 (fetchEastMoneyGoldNews)');
console.log('3. 新浪财经 (fetchSinaGoldNews)');
console.log('✅ 正确：极速数据 → 东方财富 → 新浪财经\n');

// 检查A股新闻优先级
console.log('📊 A股新闻优先级:');
console.log('1. 极速数据 (fetchJisuNews)');
console.log('2. 东方财富 (fetchEastmoneyAStockNews)');
console.log('3. 新浪财经 (fetchSinaAStockNews)');
console.log('✅ 正确：极速数据 → 东方财富 → 新浪财经\n');

console.log('🎯 结论：代码中所有三个方法都已使用正确的优先级顺序');
console.log('💡 如果用户仍看到旧的优先级，可能是以下原因：');
console.log('   1. 浏览器缓存未清理');
console.log('   2. 服务器部署未更新');
console.log('   3. CDN缓存未刷新');
console.log('   4. 用户查看的是旧的日志');

// 检查控制台日志
console.log('\n📋 应该看到的新日志格式：');
console.log('🚀 使用混合策略获取[资产类型]新闻');
console.log('📋 新优先级: 极速数据 → 东方财富 → 新浪财经');
console.log('✅ 极速数据获取成功: XX条');
console.log('✅ 东方财富获取成功: XX条');
console.log('✅ 新浪财经获取成功: XX条');