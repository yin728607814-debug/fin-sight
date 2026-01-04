#!/usr/bin/env node

/**
 * Supabase 配置向导
 * 帮助用户一步步配置 Supabase
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

function printHeader(text) {
  console.log('\n' + '='.repeat(60));
  console.log(`  ${text}`);
  console.log('='.repeat(60) + '\n');
}

function printStep(step, text) {
  console.log(`\n📍 步骤 ${step}: ${text}\n`);
}

function printSuccess(text) {
  console.log(`✅ ${text}`);
}

function printWarning(text) {
  console.log(`⚠️  ${text}`);
}

function printError(text) {
  console.log(`❌ ${text}`);
}

async function main() {
  printHeader('Supabase 配置向导');
  
  console.log('欢迎使用 Supabase 配置向导！');
  console.log('我会帮助你一步步完成 Supabase 的配置。\n');
  
  // 步骤 1: 检查是否已注册
  printStep(1, '检查 Supabase 账号');
  console.log('请确认你已经完成以下操作：');
  console.log('1. 访问 https://supabase.com');
  console.log('2. 使用 GitHub 或邮箱注册账号');
  console.log('3. 登录到 Supabase 控制台\n');
  
  const hasAccount = await question('你已经注册并登录了吗？(y/n): ');
  if (hasAccount.toLowerCase() !== 'y') {
    printWarning('请先完成注册，然后重新运行此脚本。');
    rl.close();
    return;
  }
  
  // 步骤 2: 创建项目
  printStep(2, '创建 Supabase 项目');
  console.log('在 Supabase 控制台中：');
  console.log('1. 点击 "New Project" 按钮');
  console.log('2. 填写项目信息：');
  console.log('   - Name: portfolio-storage (或任意名称)');
  console.log('   - Database Password: 设置一个强密码（请记住！）');
  console.log('   - Region: 选择 "Northeast Asia (Tokyo)" 或最近的区域');
  console.log('   - Pricing Plan: 选择 "Free"');
  console.log('3. 点击 "Create new project"');
  console.log('4. 等待 1-2 分钟，项目创建完成\n');
  
  const hasProject = await question('项目已创建完成了吗？(y/n): ');
  if (hasProject.toLowerCase() !== 'y') {
    printWarning('请先创建项目，然后重新运行此脚本。');
    rl.close();
    return;
  }
  
  // 步骤 3: 获取 API 凭证
  printStep(3, '获取 API 凭证');
  console.log('在 Supabase 项目仪表板中：');
  console.log('1. 点击左侧菜单的 "Settings" (齿轮图标)');
  console.log('2. 点击 "API" 选项卡');
  console.log('3. 找到以下信息：\n');
  
  console.log('请输入你的 Supabase 配置信息：\n');
  
  const supabaseUrl = await question('Project URL (例如: https://xxxxx.supabase.co): ');
  const supabaseKey = await question('anon public key (很长的字符串): ');
  
  if (!supabaseUrl || !supabaseKey) {
    printError('URL 和 Key 不能为空！');
    rl.close();
    return;
  }
  
  if (!supabaseUrl.includes('supabase.co')) {
    printError('URL 格式不正确，应该包含 "supabase.co"');
    rl.close();
    return;
  }
  
  // 步骤 4: 写入 .env 文件
  printStep(4, '配置环境变量');
  
  const envPath = path.join(process.cwd(), '.env');
  const envExamplePath = path.join(process.cwd(), '.env.example');
  
  let envContent = '';
  
  // 如果 .env 已存在，读取现有内容
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
    printWarning('.env 文件已存在，将更新 Supabase 配置');
  } else if (fs.existsSync(envExamplePath)) {
    envContent = fs.readFileSync(envExamplePath, 'utf8');
    printSuccess('从 .env.example 创建 .env 文件');
  }
  
  // 更新或添加 Supabase 配置
  const supabaseUrlRegex = /VITE_SUPABASE_URL=.*/;
  const supabaseKeyRegex = /VITE_SUPABASE_ANON_KEY=.*/;
  
  if (supabaseUrlRegex.test(envContent)) {
    envContent = envContent.replace(supabaseUrlRegex, `VITE_SUPABASE_URL=${supabaseUrl}`);
  } else {
    envContent += `\nVITE_SUPABASE_URL=${supabaseUrl}`;
  }
  
  if (supabaseKeyRegex.test(envContent)) {
    envContent = envContent.replace(supabaseKeyRegex, `VITE_SUPABASE_ANON_KEY=${supabaseKey}`);
  } else {
    envContent += `\nVITE_SUPABASE_ANON_KEY=${supabaseKey}`;
  }
  
  fs.writeFileSync(envPath, envContent);
  printSuccess('.env 文件已更新');
  
  // 步骤 5: 创建数据库表
  printStep(5, '创建数据库表');
  console.log('现在需要在 Supabase 中创建数据库表：\n');
  console.log('1. 在 Supabase 项目仪表板，点击左侧菜单的 "SQL Editor"');
  console.log('2. 点击 "New query"');
  console.log('3. 打开文件: database/migrations/001_create_positions_table.sql');
  console.log('4. 复制全部内容，粘贴到 SQL Editor');
  console.log('5. 点击 "Run" 执行脚本');
  console.log('6. 看到 "Success. No rows returned" 表示成功\n');
  
  const tableCreated = await question('数据库表已创建了吗？(y/n): ');
  if (tableCreated.toLowerCase() !== 'y') {
    printWarning('请先创建数据库表，然后继续。');
    printWarning('你可以稍后手动执行 database/migrations/001_create_positions_table.sql');
  }
  
  // 步骤 6: 验证配置
  printStep(6, '验证配置');
  console.log('配置已完成！现在让我们验证一下：\n');
  
  printSuccess(`Project URL: ${supabaseUrl}`);
  printSuccess(`API Key: ${supabaseKey.substring(0, 20)}...`);
  printSuccess('.env 文件已更新');
  
  if (tableCreated.toLowerCase() === 'y') {
    printSuccess('数据库表已创建');
  }
  
  console.log('\n下一步：');
  console.log('1. 运行 npm run dev 启动开发服务器');
  console.log('2. 打开浏览器控制台，查看是否有 "Supabase 客户端初始化成功" 的日志');
  console.log('3. 如果有错误，检查 .env 文件中的配置是否正确\n');
  
  console.log('📚 更多帮助：');
  console.log('- 查看 database/SUPABASE_SETUP.md 获取详细文档');
  console.log('- 如果遇到问题，检查浏览器控制台的错误信息\n');
  
  printHeader('配置完成！');
  
  rl.close();
}

main().catch(error => {
  console.error('发生错误:', error);
  rl.close();
  process.exit(1);
});
