/**
 * 搜索A股基金代码
 * 用于查找天天基金网的基金代码
 */

const funds = [
  '前海开源嘉鑫灵活配置混合C',
  '长城久嘉创新成长灵活配置混合C',
  '汇添富中证电池主题ETF联接C',
  '国投瑞银白银期货(LOF)C',
  '永赢高端设备智选混合C',
  '华夏有色金属ETF联接C',
  '永赢科技智选混合C',
  '华安黄金ETF联接C',
  '永赢半导体产业智选混合C',
  '天弘中证光伏产业指数C'
];

console.log('需要查找的A股基金：');
console.log('================================');
funds.forEach((fund, index) => {
  console.log(`${index + 1}. ${fund}`);
});

console.log('\n说明：');
console.log('1. 访问 https://fund.eastmoney.com/');
console.log('2. 在搜索框中输入基金名称');
console.log('3. 找到对应的基金代码（6位数字）');
console.log('4. 测试API: http://fundgz.1234567.com.cn/js/[基金代码].js');
console.log('\n例如：');
console.log('天弘中证光伏产业指数C -> 代码: 011103');
console.log('API: http://fundgz.1234567.com.cn/js/011103.js');
