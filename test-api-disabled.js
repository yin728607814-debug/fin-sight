#!/usr/bin/env node

/**
 * 测试API停用时的处理逻辑
 */

async function testApiDisabled() {
  console.log('🔧 测试API停用处理逻辑');
  
  // 模拟API返回"接口已停用"的响应
  const mockApiResponse = {
    status: '10013', // 假设这是停用状态码
    msg: '接口已停用',
    message: '接口已停用'
  };
  
  console.log('📊 模拟API响应:', mockApiResponse);
  
  // 测试检测逻辑
  const isApiDisabled = mockApiResponse.msg && (
    mockApiResponse.msg.includes('停用') || 
    mockApiResponse.msg.includes('disabled') ||
    mockApiResponse.msg.includes('接口已停用') ||
    mockApiResponse.msg.includes('接口停用')
  );
  
  const isApiError = mockApiResponse.status === '108' || 
                    mockApiResponse.status === 108 || 
                    mockApiResponse.status === '10013' || 
                    mockApiResponse.status === 10013;
  
  console.log('🔍 检测结果:');
  console.log('- isApiDisabled:', isApiDisabled);
  console.log('- isApiError:', isApiError);
  console.log('- 应该使用备用新闻:', isApiDisabled || isApiError);
  
  if (isApiDisabled || isApiError) {
    console.log('✅ 检测逻辑正确，应该返回备用新闻');
  } else {
    console.log('❌ 检测逻辑有问题，需要修复');
  }
  
  // 测试不同的错误消息格式
  const testCases = [
    { status: '10013', msg: '接口已停用' },
    { status: 10013, msg: '接口已停用' },
    { status: '108', msg: '接口停用' },
    { status: 108, msg: '停用' },
    { status: '0', msg: '接口已停用' }, // status正常但msg显示停用
  ];
  
  console.log('\n🧪 测试不同错误格式:');
  testCases.forEach((testCase, index) => {
    const disabled = testCase.msg && (
      testCase.msg.includes('停用') || 
      testCase.msg.includes('disabled') ||
      testCase.msg.includes('接口已停用') ||
      testCase.msg.includes('接口停用')
    );
    
    const error = testCase.status === '108' || 
                 testCase.status === 108 || 
                 testCase.status === '10013' || 
                 testCase.status === 10013;
    
    console.log(`  ${index + 1}. status: ${testCase.status}, msg: "${testCase.msg}" -> 使用备用: ${disabled || error}`);
  });
}

testApiDisabled().catch(console.error);