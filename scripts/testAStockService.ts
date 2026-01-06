/**
 * 测试A股基金服务
 */

import { aStockFundService } from '../services/aStockFundService';
import { getAllFunds } from '../config/aStockFunds';

async function testService() {
  console.log('开始测试A股基金服务...\n');
  console.log('='.repeat(60));
  
  // 获取所有基金
  const allFunds = getAllFunds();
  console.log(`\n共有 ${allFunds.length} 个基金\n`);

  // 测试单个基金
  console.log('测试单个基金获取:');
  const testFund = '前海开源嘉鑫灵活配置混合C';
  const data = await aStockFundService.getFundData(testFund);
  
  if (data) {
    console.log(`✅ ${data.fundName} (${data.fundCode})`);
    console.log(`   净值: ${data.netValue}`);
    console.log(`   估算净值: ${data.estimatedValue}`);
    console.log(`   当日收益率: ${data.dailyReturn}%`);
    console.log(`   更新时间: ${data.updateTime}`);
    
    // 测试收益计算
    const investmentAmount = 10000;
    const profit = aStockFundService.calculateDailyProfit(investmentAmount, data.dailyReturn);
    console.log(`   假设持仓 ¥${investmentAmount}，当日收益: ¥${profit.toFixed(2)}`);
  } else {
    console.log(`❌ 获取失败`);
  }

  console.log('\n' + '='.repeat(60));
  
  // 测试批量获取
  console.log('\n测试批量获取所有基金:');
  const fundNames = allFunds.map(f => f.name);
  const batchData = await aStockFundService.getBatchFundData(fundNames);
  
  console.log(`\n成功获取 ${batchData.size}/${fundNames.length} 个基金数据\n`);
  
  // 显示所有基金数据
  let totalReturn = 0;
  batchData.forEach((data, fundName) => {
    const returnSymbol = data.dailyReturn >= 0 ? '+' : '';
    console.log(`${data.fundName}`);
    console.log(`  代码: ${data.fundCode}`);
    console.log(`  收益率: ${returnSymbol}${data.dailyReturn}%`);
    console.log(`  净值: ${data.netValue} → ${data.estimatedValue}`);
    console.log('');
    
    totalReturn += data.dailyReturn;
  });
  
  const avgReturn = totalReturn / batchData.size;
  console.log('='.repeat(60));
  console.log(`平均收益率: ${avgReturn >= 0 ? '+' : ''}${avgReturn.toFixed(2)}%`);
  console.log('='.repeat(60));
}

// 运行测试
testService().catch(console.error);
