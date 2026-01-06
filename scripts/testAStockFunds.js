/**
 * 测试所有A股基金的API可用性
 * 使用天天基金网API获取实时净值数据
 */

const funds = [
  { code: '001770', name: '前海开源嘉鑫灵活配置混合C' },
  { code: '010052', name: '长城久嘉创新成长灵活配置混合C' },
  { code: '012863', name: '汇添富中证电池主题ETF联接C' },
  { code: '019005', name: '国投瑞银白银期货(LOF)C' },
  { code: '015790', name: '永赢高端设备智选混合C' },
  { code: '016708', name: '华夏有色金属ETF联接C' },
  { code: '022365', name: '永赢科技智选混合C' },
  { code: '015968', name: '永赢半导体产业智选混合C' }
];

async function testFund(fund) {
  const url = `http://fundgz.1234567.com.cn/js/${fund.code}.js`;
  
  try {
    const response = await fetch(url);
    const text = await response.text();
    
    // 解析JSONP响应
    const jsonMatch = text.match(/jsonpgz\((.*)\)/);
    if (!jsonMatch) {
      console.log(`❌ ${fund.name} (${fund.code}): 无法解析响应`);
      return false;
    }
    
    const data = JSON.parse(jsonMatch[1]);
    
    console.log(`✅ ${fund.name} (${fund.code}):`);
    console.log(`   净值: ${data.dwjz}`);
    console.log(`   估算净值: ${data.gsz}`);
    console.log(`   涨跌幅: ${data.gszzl}%`);
    console.log(`   更新时间: ${data.gztime}`);
    console.log('');
    
    return true;
  } catch (error) {
    console.log(`❌ ${fund.name} (${fund.code}): ${error.message}`);
    return false;
  }
}

async function testAllFunds() {
  console.log('开始测试所有A股基金API...\n');
  console.log('='.repeat(60));
  console.log('');
  
  let successCount = 0;
  let failCount = 0;
  
  for (const fund of funds) {
    const success = await testFund(fund);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
    // 延迟避免请求过快
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('='.repeat(60));
  console.log(`\n测试完成: ${successCount} 成功, ${failCount} 失败`);
  console.log(`成功率: ${((successCount / funds.length) * 100).toFixed(1)}%`);
}

// 运行测试
testAllFunds();
