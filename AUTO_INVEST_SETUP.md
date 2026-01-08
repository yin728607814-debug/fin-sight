# 定投功能设置指南

## 问题诊断

经过检查，发现**定投功能没有自动执行的定时器**。虽然代码中有定投服务 (`autoInvestService.ts`)，但缺少触发机制。

## 解决方案（已更新）

### 方案一：GitHub Actions 自动定时执行（推荐 - 免费）

已创建 GitHub Actions 工作流来自动执行定投：

#### 1. 文件说明

- **`.github/workflows/auto-invest.yml`**: GitHub Actions 工作流
  - 每天凌晨 2:00 (北京时间) 自动执行
  - 调用 Netlify Function 触发定投
  - 完全免费

- **`netlify/functions/trigger-auto-invest.ts`**: 定投触发函数
  - 可以被 GitHub Actions 或手动调用
  - 查询所有到期的定投计划
  - 自动更新持仓金额
  - 计算下次执行日期

#### 2. 配置步骤

**第一步：在 GitHub 仓库设置 Secrets**

1. 打开你的 GitHub 仓库
2. 进入 Settings → Secrets and variables → Actions
3. 添加以下 Secrets：

   - `NETLIFY_SITE_URL`: 你的 Netlify 站点 URL
     - 例如：`https://your-site.netlify.app`
   
   - `AUTO_INVEST_TOKEN`: 自定义的安全令牌（可选，用于保护 API）
     - 例如：`your-secret-token-123456`
     - 如果不设置，任何人都可以调用触发函数

**第二步：在 Netlify 设置环境变量（可选）**

如果你设置了 `AUTO_INVEST_TOKEN`，需要在 Netlify 中也添加：

1. 登录 Netlify Dashboard
2. 进入你的站点设置
3. 找到 Environment variables
4. 添加：`AUTO_INVEST_TOKEN` = `your-secret-token-123456`

**第三步：启用 GitHub Actions**

1. 推送代码后，GitHub Actions 会自动启用
2. 查看 Actions 标签页确认工作流已创建
3. 可以手动触发测试：Actions → Auto Invest Daily → Run workflow

#### 3. 验证配置

- 第一次自动执行时间：明天凌晨 2:00 (北京时间)
- 查看执行日志：GitHub → Actions → Auto Invest Daily
- 手动测试：Actions → Auto Invest Daily → Run workflow → Run workflow

### 方案二：手动执行 SQL（临时方案）

#### 使用方法

1. **打开 Supabase SQL Editor**
   - 登录 Supabase Dashboard
   - 进入 SQL Editor

2. **运行检查脚本**
   ```sql
   -- 查看所有需要执行的定投计划
   SELECT 
     fund_name as "基金名称",
     investment_amount as "当前持仓金额",
     auto_invest_amount as "定投金额",
     auto_invest_next_date as "下次定投日期",
     CASE 
       WHEN auto_invest_next_date <= CURRENT_DATE THEN '需要执行'
       ELSE '未到期'
     END as "状态"
   FROM positions
   WHERE auto_invest_enabled = true
   ORDER BY auto_invest_next_date;
   ```

3. **执行定投**
   
   打开 `database/manual_auto_invest.sql` 文件，运行"第三步：批量执行所有到期的定投"部分的 SQL。

   这个脚本会：
   - 自动查找所有到期的定投计划
   - 更新持仓金额（持仓金额 + 定投金额）
   - 更新当前市值（当前市值 + 定投金额）
   - 计算并设置下次执行日期
   - 记录执行时间

4. **验证结果**
   ```sql
   -- 查看更新后的状态
   SELECT 
     fund_name as "基金名称",
     investment_amount as "持仓金额",
     auto_invest_last_executed_date as "上次执行",
     auto_invest_next_date as "下次执行"
   FROM positions
   WHERE auto_invest_enabled = true;
   ```

### 方案三：手动调用 Netlify Function

你也可以手动访问 URL 来触发定投：

```
https://your-site.netlify.app/.netlify/functions/trigger-auto-invest?token=YOUR_TOKEN
```

或者使用外部 Cron 服务（如 cron-job.org）定时调用这个 URL。

## 推荐方案

1. **GitHub Actions**（推荐）- 完全免费，自动执行
2. **手动执行 SQL** - 临时方案，需要手动操作
3. **手动调用 Function** - 可以配合外部 Cron 服务

## 下一步

1. 推送代码到 GitHub
2. 选择并配置合适的定时任务方案
3. 测试定投执行是否正常
4. 监控定投执行日志

## 文件清单

- ✅ `netlify/functions/auto-invest-cron.ts` - Netlify 定时函数
- ✅ `database/manual_auto_invest.sql` - 手动执行 SQL 脚本
- ✅ `netlify.toml` - 已添加定时任务配置
- ✅ `AUTO_INVEST_SETUP.md` - 本说明文档
