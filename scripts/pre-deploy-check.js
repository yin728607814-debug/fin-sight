#!/usr/bin/env node

/**
 * 部署前检查脚本
 * 验证构建配置、环境变量和代码质量
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class PreDeployChecker {
  constructor() {
    this.errors = [];
    this.warnings = [];
  }

  /**
   * 运行所有检查
   */
  async runAllChecks() {
    console.log('🚀 开始部署前检查...\n');

    this.checkPackageJson();
    this.checkEnvironmentFiles();
    this.checkBuildConfiguration();
    this.checkCloudflareConfiguration();
    await this.runTests();
    await this.runLinting();
    this.checkTypeScript();
    this.checkBuildOutput();

    this.printResults();
    
    if (this.errors.length > 0) {
      process.exit(1);
    }
  }

  /**
   * 检查package.json配置
   */
  checkPackageJson() {
    console.log('📦 检查 package.json...');
    
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      
      // 检查必需的脚本
      const requiredScripts = ['build', 'test', 'lint'];
      for (const script of requiredScripts) {
        if (!packageJson.scripts[script]) {
          this.errors.push(`缺少必需的脚本: ${script}`);
        }
      }

      // 检查依赖版本
      if (packageJson.dependencies) {
        const deps = packageJson.dependencies;
        if (deps.react && !deps.react.startsWith('^18')) {
          this.warnings.push('React版本可能过旧，建议使用18.x');
        }
      }

      console.log('✅ package.json 检查完成\n');
    } catch (error) {
      this.errors.push(`无法读取 package.json: ${error.message}`);
    }
  }

  /**
   * 检查环境变量文件
   */
  checkEnvironmentFiles() {
    console.log('🔐 检查环境变量配置...');
    
    // 检查 .env.example 是否存在
    if (!fs.existsSync('.env.example')) {
      this.warnings.push('缺少 .env.example 文件');
    } else {
      const envExample = fs.readFileSync('.env.example', 'utf8');
      const requiredVars = ['GEMINI_API_KEY', 'NEWS_API_KEY', 'ALPHA_VANTAGE_API_KEY'];
      
      for (const varName of requiredVars) {
        if (!envExample.includes(varName)) {
          this.warnings.push(`环境变量示例文件中缺少: ${varName}`);
        }
      }
    }

    console.log('✅ 环境变量检查完成\n');
  }

  /**
   * 检查构建配置
   */
  checkBuildConfiguration() {
    console.log('⚙️ 检查构建配置...');
    
    // 检查 vite.config.ts
    if (!fs.existsSync('vite.config.ts')) {
      this.errors.push('缺少 vite.config.ts 文件');
    }

    // 检查 tsconfig.json
    if (!fs.existsSync('tsconfig.json')) {
      this.errors.push('缺少 tsconfig.json 文件');
    }

    // 检查 tailwind.config.js
    if (!fs.existsSync('tailwind.config.js')) {
      this.warnings.push('缺少 tailwind.config.js 文件');
    }

    console.log('✅ 构建配置检查完成\n');
  }

  /**
   * 检查 Cloudflare 配置
   */
  checkCloudflareConfiguration() {
    console.log('🌐 检查 Cloudflare 配置...');
    
    if (!fs.existsSync('wrangler.toml')) {
      this.errors.push('缺少 wrangler.toml 文件');
      return;
    }

    try {
      const cloudflareConfig = fs.readFileSync('wrangler.toml', 'utf8');
      
      // 检查必需的配置项
      if (!cloudflareConfig.includes('[build]')) {
        this.errors.push('wrangler.toml 缺少 [build] 配置');
      }
      
      if (!cloudflareConfig.includes('command = "npm run build"')) {
        this.warnings.push('wrangler.toml 未声明 npm run build 构建命令');
      }
      
      if (!fs.existsSync('functions')) {
        this.errors.push('缺少 Cloudflare Pages Functions 目录: functions');
      }

      console.log('✅ Cloudflare 配置检查完成\n');
    } catch (error) {
      this.errors.push(`无法读取 wrangler.toml: ${error.message}`);
    }
  }

  /**
   * 运行测试
   */
  async runTests() {
    console.log('🧪 运行测试...');
    
    try {
      execSync('npm test -- --passWithNoTests --watchAll=false', { 
        stdio: 'pipe',
        timeout: 60000 
      });
      console.log('✅ 所有测试通过\n');
    } catch (error) {
      this.errors.push(`测试失败: ${error.message}`);
    }
  }

  /**
   * 运行代码检查
   */
  async runLinting() {
    console.log('🔍 运行代码检查...');
    
    try {
      execSync('npm run lint', { 
        stdio: 'pipe',
        timeout: 30000 
      });
      console.log('✅ 代码检查通过\n');
    } catch (error) {
      this.warnings.push(`代码检查发现问题: ${error.message}`);
    }
  }

  /**
   * 检查TypeScript类型
   */
  checkTypeScript() {
    console.log('📝 检查 TypeScript 类型...');
    
    try {
      execSync('npx tsc --noEmit', { 
        stdio: 'pipe',
        timeout: 30000 
      });
      console.log('✅ TypeScript 类型检查通过\n');
    } catch (error) {
      this.errors.push(`TypeScript 类型错误: ${error.message}`);
    }
  }

  /**
   * 检查构建输出
   */
  checkBuildOutput() {
    console.log('🏗️ 检查构建输出...');
    
    try {
      // 运行构建
      execSync('npm run build', { 
        stdio: 'pipe',
        timeout: 120000 
      });

      // 检查构建产物
      if (!fs.existsSync('dist')) {
        this.errors.push('构建后缺少 dist 目录');
        return;
      }

      if (!fs.existsSync('dist/index.html')) {
        this.errors.push('构建后缺少 index.html 文件');
      }

      // 检查构建产物大小
      const stats = this.getBuildStats();
      if (stats.totalSize > 5 * 1024 * 1024) { // 5MB
        this.warnings.push(`构建产物较大: ${(stats.totalSize / 1024 / 1024).toFixed(2)}MB`);
      }

      console.log(`✅ 构建成功 (总大小: ${(stats.totalSize / 1024 / 1024).toFixed(2)}MB)\n`);
    } catch (error) {
      this.errors.push(`构建失败: ${error.message}`);
    }
  }

  /**
   * 获取构建统计信息
   */
  getBuildStats() {
    const distPath = path.join(process.cwd(), 'dist');
    let totalSize = 0;
    let fileCount = 0;

    function calculateSize(dir) {
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          calculateSize(filePath);
        } else {
          totalSize += stat.size;
          fileCount++;
        }
      }
    }

    if (fs.existsSync(distPath)) {
      calculateSize(distPath);
    }

    return { totalSize, fileCount };
  }

  /**
   * 打印检查结果
   */
  printResults() {
    console.log('📋 检查结果汇总:');
    console.log('================\n');

    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('🎉 所有检查都通过了！可以安全部署。\n');
      return;
    }

    if (this.errors.length > 0) {
      console.log('❌ 发现错误:');
      this.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
      console.log();
    }

    if (this.warnings.length > 0) {
      console.log('⚠️ 发现警告:');
      this.warnings.forEach((warning, index) => {
        console.log(`  ${index + 1}. ${warning}`);
      });
      console.log();
    }

    if (this.errors.length > 0) {
      console.log('🚫 部署被阻止，请修复上述错误后重试。\n');
    } else {
      console.log('✅ 可以部署，但建议处理上述警告。\n');
    }
  }
}

// 运行检查
const checker = new PreDeployChecker();
checker.runAllChecks().catch(console.error);
