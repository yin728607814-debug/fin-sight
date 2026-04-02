/**
 * 监控多页请求功能部署状态
 * 等待Cloudflare Pages部署完成后自动测试
 */

const axios = require('axios');

const BASE_URL = 'https://fin-sight.pages.dev';
const CHECK_INTERVAL = 30000; // 30秒检查一次
const MAX_WAIT_TIME = 600000; // 最多等待10分钟

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

async function checkDeployment() {
  try {
    const response = await axios.get(`${BASE_URL}/`, {
      timeout: 10000,
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

async function testNewsAPI(assetType) {
  try {
    // 直接访问页面，检查是否能加载
    const pageUrls = {
      nasdaq: `${BASE_URL}/nasdaq`,
      gold: `${BASE_URL}/gold`,
      astock: `${BASE_URL}/astock`
    };
    
    const response = await axios.get(pageUrls[assetType], {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    });
    
    if (response.status === 200) {
      return {
        success: true,
        message: '页面加载成功',
        status: response.status
      };
    } else {
      return {
        success: false,
        message: `页面返回状态码 ${response.status}`,
        status: response.status
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function runTests() {
  log('\n📊 测试页面加载...', 'cyan');
  
  const results = {};
  
  for (const assetType of ['nasdaq', 'gold', 'astock']) {
    log(`\n🔍 测试 ${assetType.toUpperCase()} 页面...`, 'blue');
    const result = await testNewsAPI(assetType);
    results[assetType] = result;
    
    if (result.success) {
      log(`✅ ${assetType}: ${result.message}`, 'green');
    } else {
      log(`❌ ${assetType}: ${result.error || result.message}`, 'red');
    }
    
    await sleep(2000);
  }
  
  return results;
}

async function monitor() {
  log('\n' + '='.repeat(60), 'cyan');
  log('多页请求功能部署监控', 'cyan');
  log('='.repeat(60), 'cyan');
  log(`\n🌐 监控地址: ${BASE_URL}`, 'blue');
  log(`⏱️  检查间隔: ${CHECK_INTERVAL / 1000}秒`, 'blue');
  log(`⏰ 最大等待: ${MAX_WAIT_TIME / 60000}分钟`, 'blue');
  
  const startTime = Date.now();
  let attempts = 0;
  
  while (Date.now() - startTime < MAX_WAIT_TIME) {
    attempts++;
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
    
    log(`\n[${elapsed}s] 第${attempts}次检查...`, 'yellow');
    
    const isDeployed = await checkDeployment();
    
    if (isDeployed) {
      log(`✅ 部署已完成！`, 'green');
      log(`\n⏳ 等待5秒让部署稳定...`, 'yellow');
      await sleep(5000);
      
      log(`\n🧪 开始测试...`, 'cyan');
      const results = await runTests();
      
      const allPassed = Object.values(results).every(r => r.success);
      
      log(`\n${'='.repeat(60)}`, 'cyan');
      log('测试结果', 'cyan');
      log('='.repeat(60), 'cyan');
      
      if (allPassed) {
        log(`\n🎉 所有页面加载成功！部署正常。`, 'green');
        log(`\n📊 详细结果:`, 'blue');
        Object.entries(results).forEach(([type, result]) => {
          log(`   ${type}: ${result.message}`, 'green');
        });
        log(`\n💡 提示: 请在浏览器中访问以下页面查看新闻数量:`, 'cyan');
        log(`   - 纳斯达克: ${BASE_URL}/nasdaq`, 'cyan');
        log(`   - 黄金: ${BASE_URL}/gold`, 'cyan');
        log(`   - A股: ${BASE_URL}/astock`, 'cyan');
      } else {
        log(`\n⚠️  部分页面加载失败`, 'yellow');
        Object.entries(results).forEach(([type, result]) => {
          const status = result.success ? '✅' : '❌';
          log(`   ${status} ${type}: ${result.message || result.error}`, result.success ? 'green' : 'red');
        });
      }
      
      return;
    }
    
    log(`⏳ 部署尚未完成，${CHECK_INTERVAL / 1000}秒后重试...`, 'yellow');
    await sleep(CHECK_INTERVAL);
  }
  
  log(`\n❌ 超时：等待${MAX_WAIT_TIME / 60000}分钟后部署仍未完成`, 'red');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

monitor().catch(error => {
  log(`\n❌ 监控失败: ${error.message}`, 'red');
  process.exit(1);
});
