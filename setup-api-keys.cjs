#!/usr/bin/env node

/**
 * API密钥设置脚本
 * 帮助用户快速配置真实的API密钥
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const envPath = path.join(__dirname, '.env');

console.log('🚀 投资新闻分析器 - API密钥配置向导\n');
console.log('此脚本将帮助您配置真实的API密钥以获取真实数据\n');

const apiConfigs = [
  {
    name: 'News API',
    key: 'NEWS_API_KEY',
    description: '用于获取金融新闻数据',
    url: 'https://newsapi.org/',
    instructions: [
      '1. 访问 https://newsapi.org/register',
      '2. 注册免费账户并验证邮箱',
      '3. 登录后在Dashboard中找到API Key',
      '4. 复制API Key'
    ],
    limits: '免费限制: 每天1000次请求'
  },
  {
    name: 'Alpha Vantage API',
    key: 'ALPHA_VANTAGE_API_KEY',
    description: '用于获取股票和价格数据',
    url: 'https://www.alphavantage.co/',
    instructions: [
      '1. 访问 https://www.alphavantage.co/support/#api-key',
      '2. 填写表单申请免费API Key',
      '3. 查收邮件获取API Key',
      '4. 复制API Key'
    ],
    limits: '免费限制: 每分钟5次请求，每天500次请求'
  },
  {
    name: 'Google Gemini API',
    key: 'GEMINI_API_KEY',
    description: '用于AI新闻影响分析',
    url: 'https://ai.google.dev/',
    instructions: [
      '1. 访问 https://makersuite.google.com/app/apikey',
      '2. 使用Google账户登录',
      '3. 点击"Create API Key"',
      '4. 选择项目或创建新项目',
      '5. 复制生成的API Key'
    ],
    limits: '免费限制: 每分钟15次请求，每天1500次请求'
  }
];

async function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupApiKeys() {
  console.log('📋 API密钥配置清单:\n');
  
  apiConfigs.forEach((config, index) => {
    console.log(`${index + 1}. ${config.name}`);
    console.log(`   ${config.description}`);
    console.log(`   网站: ${config.url}`);
    console.log(`   ${config.limits}\n`);
  });

  const proceed = await question('是否要开始配置API密钥? (y/n): ');
  if (proceed.toLowerCase() !== 'y' && proceed.toLowerCase() !== 'yes') {
    console.log('配置已取消。');
    rl.close();
    return;
  }

  console.log('\n🔧 开始配置...\n');

  // 读取现有的.env文件
  let envContent = '';
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }

  const envLines = envContent.split('\n');
  const envMap = new Map();

  // 解析现有环境变量
  envLines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        envMap.set(key.trim(), valueParts.join('=').trim());
      }
    }
  });

  // 配置每个API密钥
  for (const config of apiConfigs) {
    console.log(`\n📡 配置 ${config.name}`);
    console.log(`${config.description}\n`);
    
    console.log('获取API密钥的步骤:');
    config.instructions.forEach(instruction => {
      console.log(`   ${instruction}`);
    });
    console.log(`\n   ${config.limits}\n`);

    const currentValue = envMap.get(config.key);
    if (currentValue && !currentValue.includes('your_') && !currentValue.includes('placeholder')) {
      console.log(`✅ 当前已配置: ${currentValue.substring(0, 8)}...`);
      const keepCurrent = await question('保持当前配置? (y/n): ');
      if (keepCurrent.toLowerCase() === 'y' || keepCurrent.toLowerCase() === 'yes') {
        continue;
      }
    }

    const openUrl = await question(`是否要打开 ${config.url} ? (y/n): `);
    if (openUrl.toLowerCase() === 'y' || openUrl.toLowerCase() === 'yes') {
      const { exec } = require('child_process');
      const platform = process.platform;
      const command = platform === 'darwin' ? 'open' : platform === 'win32' ? 'start' : 'xdg-open';
      exec(`${command} ${config.url}`);
      console.log(`已打开 ${config.url}`);
    }

    const apiKey = await question(`请输入您的 ${config.name} API密钥 (留空跳过): `);
    
    if (apiKey.trim()) {
      envMap.set(config.key, apiKey.trim());
      console.log(`✅ ${config.name} API密钥已设置`);
    } else {
      console.log(`⏭️  跳过 ${config.name} 配置`);
    }
  }

  // 生成新的.env文件内容
  const newEnvContent = `# API Keys for Investment News Analyzer
# 配置完成时间: ${new Date().toLocaleString()}

# News API - 获取金融新闻 (https://newsapi.org/)
NEWS_API_KEY=${envMap.get('NEWS_API_KEY') || 'your_news_api_key_here'}

# Alpha Vantage API - 获取股票和价格数据 (https://www.alphavantage.co/)
ALPHA_VANTAGE_API_KEY=${envMap.get('ALPHA_VANTAGE_API_KEY') || 'your_alpha_vantage_api_key_here'}

# Gemini API - 用于AI新闻分析 (https://ai.google.dev/)
GEMINI_API_KEY=${envMap.get('GEMINI_API_KEY') || 'your_gemini_api_key_here'}

# Development settings
VITE_APP_TITLE=Investment News Analyzer
VITE_APP_VERSION=1.0.0
`;

  // 写入.env文件
  fs.writeFileSync(envPath, newEnvContent);
  
  console.log('\n✅ 配置完成！');
  console.log(`📁 配置已保存到: ${envPath}`);
  
  const configuredKeys = Array.from(envMap.entries())
    .filter(([key, value]) => apiConfigs.some(config => config.key === key) && 
             value && !value.includes('your_') && !value.includes('placeholder'))
    .map(([key]) => key);

  if (configuredKeys.length > 0) {
    console.log(`\n🎉 已配置的API密钥: ${configuredKeys.length}/${apiConfigs.length}`);
    configuredKeys.forEach(key => {
      const config = apiConfigs.find(c => c.key === key);
      console.log(`   ✅ ${config.name}`);
    });
  }

  const missingKeys = apiConfigs.filter(config => 
    !envMap.has(config.key) || 
    !envMap.get(config.key) || 
    envMap.get(config.key).includes('your_') || 
    envMap.get(config.key).includes('placeholder')
  );

  if (missingKeys.length > 0) {
    console.log(`\n⚠️  仍需配置的API密钥:`);
    missingKeys.forEach(config => {
      console.log(`   ❌ ${config.name} - ${config.url}`);
    });
  }

  console.log('\n🚀 下一步:');
  console.log('1. 重启开发服务器: npm run dev');
  console.log('2. 访问 http://localhost:3001');
  console.log('3. 查看首页的API配置状态');
  console.log('\n📖 详细指南请查看: API_KEYS_GUIDE.md');

  rl.close();
}

setupApiKeys().catch(console.error);