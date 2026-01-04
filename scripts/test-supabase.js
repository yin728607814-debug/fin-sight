#!/usr/bin/env node

/**
 * 测试 Supabase 连接
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 测试 Supabase 连接...\n');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 错误：环境变量未配置');
  console.error('请检查 .env 文件中的 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

console.log(`📍 Project URL: ${supabaseUrl}`);
console.log(`🔑 API Key: ${supabaseKey.substring(0, 20)}...\n`);

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('⏳ 正在测试连接...');
    
    // 测试查询 positions 表
    const { data, error, count } = await supabase
      .from('positions')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      if (error.code === 'PGRST116') {
        console.log('⚠️  positions 表不存在');
        console.log('📝 请在 Supabase SQL Editor 中执行:');
        console.log('   database/migrations/001_create_positions_table.sql\n');
        return false;
      }
      
      console.error('❌ 连接失败:', error.message);
      console.error('错误详情:', error);
      return false;
    }
    
    console.log('✅ Supabase 连接成功！');
    console.log(`📊 positions 表存在，当前记录数: ${count || 0}\n`);
    return true;
    
  } catch (error) {
    console.error('❌ 连接异常:', error.message);
    return false;
  }
}

testConnection().then(success => {
  if (success) {
    console.log('🎉 配置完成！可以开始使用 Supabase 了。');
    console.log('\n下一步:');
    console.log('1. 运行 npm run dev 启动开发服务器');
    console.log('2. 测试数据迁移功能');
  } else {
    console.log('\n❌ 配置未完成，请按照提示操作。');
  }
  process.exit(success ? 0 : 1);
});
