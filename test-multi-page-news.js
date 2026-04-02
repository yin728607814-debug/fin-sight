/**
 * 测试新浪财经多页请求功能
 * 验证美股、黄金、A股新闻是否能通过多页请求获取足够数量
 */

const axios = require('axios');

// 测试配置
const BASE_URL = 'https://fin-sight.pages.dev';
const TIMEOUT = 60000; // 60秒超时

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testNewsSource(assetType, targetCount = 30) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`测试 ${assetType.toUpperCase()} 新闻获取`, 'cyan');
  log('='.repeat(60), 'cyan');
  
  try {
    const startTime = Date.now();
    
    // 调用API
    log(`\n📡 请求 ${assetType} 新闻...`, 'blue');
    const response = await axios.get(`${BASE_URL}/api/news`, {
      params: {
        assetType: assetType,
        limit: 50
      },
      timeout: TIMEOUT
    });
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    if (!response.data || !Array.isArray(response.data)) {
      log(`❌ 响应格式错误`, 'red');
      return false;
    }
    
    const news = response.data;
    log(`✅ 获取成功 (${duration}秒)`, 'green');
    log(`📊 总数量: ${news.length}条`, 'blue');
    
    // 统计来源
    const sources = {};
    news.forEach(item => {
      const source = item.source || 'Unknown';
      sources[source] = (sources[source] || 0) + 1;
    });
    
    log(`\n📋 来源分布:`, 'yellow');
    Object.entries(sources).forEach(([source, count]) => {
      const percentage = ((count / news.length) * 100).toFixed(1);
      log(`   ${source}: ${count}条 (${percentage}%)`, 'yellow');
    });
    
    // 检查是否达到目标
    const success = news.length >= targetCount;
    log(`\n🎯 目标: ${targetCount}条`, success ? 'green' : 'red');
    log(`📊 实际: ${news.length}条`, success ? 'green' : 'red');
    
    if (success) {
      log(`✅ 达到目标！`, 'green');
    } else {
      log(`❌ 未达到目标 (差${targetCount - news.length}条)`, 'red');
    }
    
    // 显示前5条新闻标题
    log(`\n📰 前5条新闻:`, 'cyan');
    news.slice(0, 5).forEach((item, index) => {
      log(`   ${index + 1}. [${item.source}] ${item.title.substring(0, 60)}...`, 'cyan');
    });
    
    return success;
    
  } catch (error) {
    log(`\n❌ 测试失败: ${error.message}`, 'red');
    if (error.response) {
      log(`   状态码: ${error.response.status}`, 'red');
      log(`   响应: ${JSON.stringify(error.response.data).substring(0, 200)}`, 'red');
    }
    return false;
  }
}

async function runTests() {
  log('\n' + '='.repeat(60), 'cyan');
  log('新浪财经多页请求功能测试', 'cyan');
  log('='.repeat(60), 'cyan');
  log(`\n🌐 测试环境: ${BASE_URL}`, 'blue');
  log(`⏱️  超时时间: ${TIMEOUT / 1000}秒`, 'blue');
  log(`🎯 目标: 每个页面至少30条新闻`, 'blue');
  
  const results = {
    nasdaq: false,
    gold: false,
    astock: false
  };
  
  // 测试纳斯达克
  results.nasdaq = await testNewsSource('nasdaq', 30);
  await sleep(2000); // 等待2秒
  
  // 测试黄金
  results.gold = await testNewsSource('gold', 30);
  await sleep(2000); // 等待2秒
  
  // 测试A股
  results.astock = await testNewsSource('astock', 30);
  
  // 总结
  log(`\n${'='.repeat(60)}`, 'cyan');
  log('测试总结', 'cyan');
  log('='.repeat(60), 'cyan');
  
  const total = Object.keys(results).length;
  const passed = Object.values(results).filter(r => r).length;
  
  log(`\n📊 测试结果:`, 'blue');
  log(`   纳斯达克: ${results.nasdaq ? '✅ 通过' : '❌ 失败'}`, results.nasdaq ? 'green' : 'red');
  log(`   黄金: ${results.gold ? '✅ 通过' : '❌ 失败'}`, results.gold ? 'green' : 'red');
  log(`   A股: ${results.astock ? '✅ 通过' : '❌ 失败'}`, results.astock ? 'green' : 'red');
  
  log(`\n🎯 总计: ${passed}/${total} 通过`, passed === total ? 'green' : 'yellow');
  
  if (passed === total) {
    log(`\n🎉 所有测试通过！多页请求功能正常工作。`, 'green');
  } else {
    log(`\n⚠️  部分测试失败，需要进一步优化。`, 'yellow');
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 运行测试
runTests().catch(error => {
  log(`\n❌ 测试执行失败: ${error.message}`, 'red');
  process.exit(1);
});
