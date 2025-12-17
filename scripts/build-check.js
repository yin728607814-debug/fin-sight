#!/usr/bin/env node

/**
 * 简化的构建检查脚本
 * 专注于验证基本的构建和部署配置
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class BuildChecker {
  constructor() {
    this.errors = [];
    this.warnings = [];
  }

  /**
   * 运行基本检查
   */
  async runBasicChecks() {
    console.log('🚀 开始基本构建检查...\n');

    this.checkPackageJson();
    this.checkNetlifyConfiguration();
    this.checkBuildConfiguration();
    this.testBasicBuild();

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
      const requiredScripts = ['build', 'dev'];
      for (const script of requiredScripts) {
        if (!packageJson.scripts[script]) {
          this.errors.push(`缺少必需的脚本: ${script}`);
        }
      }

      console.log('✅ package.json 检查完成\n');
    } catch (error) {
      this.errors.push(`无法读取 package.json: ${error.message}`);
    }
  }

  /**
   * 检查Netlify配置
   */
  checkNetlifyConfiguration() {
    console.log('🌐 检查 Netlify 配置...');
    
    if (!fs.existsSync('netlify.toml')) {
      this.errors.push('缺少 netlify.toml 文件');
      return;
    }

    try {
      const netlifyConfig = fs.readFileSync('netlify.toml', 'utf8');
      
      // 检查必需的配置项
      if (!netlifyConfig.includes('[build]')) {
        this.errors.push('netlify.toml 缺少 [build] 配置');
      }
      
      if (!netlifyConfig.includes('publish = "dist"')) {
        this.errors.push('netlify.toml 缺少正确的 publish 目录配置');
      }
      
      if (!netlifyConfig.includes('[[redirects]]')) {
        this.warnings.push('netlify.toml 缺少 SPA 重定向配置');
      }

      console.log('✅ Netlify 配置检查完成\n');
    } catch (error) {
      this.errors.push(`无法读取 netlify.toml: ${error.message}`);
    }
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

    console.log('✅ 构建配置检查完成\n');
  }

  /**
   * 测试基本构建
   */
  testBasicBuild() {
    console.log('🏗️ 测试基本构建...');
    
    try {
      // 清理之前的构建
      if (fs.existsSync('dist')) {
        execSync('rm -rf dist', { stdio: 'pipe' });
      }

      // 运行构建（跳过类型检查和测试）
      execSync('npx vite build --mode production', { 
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
      if (stats.totalSize > 10 * 1024 * 1024) { // 10MB
        this.warnings.push(`构建产物较大: ${(stats.totalSize / 1024 / 1024).toFixed(2)}MB`);
      }

      console.log(`✅ 构建成功 (总大小: ${(stats.totalSize / 1024 / 1024).toFixed(2)}MB, 文件数: ${stats.fileCount})\n`);
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
const checker = new BuildChecker();
checker.runBasicChecks().catch(console.error);