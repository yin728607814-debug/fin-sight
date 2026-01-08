# 定投功能设置指南

## 问题诊断

经过检查，发现**定投功能没有自动执行的定时器**。虽然代码中有定投服务 (`autoInvestService.ts`)，但缺少触发机制。

## 解决方案

### 方案一：使用 Netlify Scheduled Functions（推荐）

已创建 Netlify 定时函数来自动执行定投：

#### 1. 文件说明

- **`netlify/functions/auto-invest-cron.ts`**: 定时执行函数
  - 每天凌晨 2:00 (北京时间) 自动执行
  - 查询所有到期的定投计划
  - 自动更新持仓金额
  - 计算下次执行日期

- **`netlify.toml`**: 已添加定时任务配置
  ```toml
  [[functions]]
    name = "auto-invest-cron"
    schedule = "0 18 * * *"  # UTC 18:00 = 北京时间 02:00
  ```

#### 2. 部署步骤

1. **推送代码到 GitHub**
   ```bash
   git add .
   git commit -m "添加定投定时任务"
   git push origin main
   ```

2. **在 Netlify 控制台启用 Scheduled Functions**
   - 登录 Netlify Dashboard
   - 进入你的站点设置
   - 找到 "Functions" → "Scheduled Functions"
   - 确认 `auto-invest-cron` 已启用

3. **验证配置**
   - 查看 Netlify 函数日志
   - 第一次执行时间：明天凌晨 2:00

#### 3. 注意事项

- Netlify Scheduled Functions 需要 **Pro 计划**（$19/月）
- 如果你使用的是免费计划，需要升级或使用方案二

### 方案二：手动执行 SQL（临时方案）

如果不想使用定时任务，可以手动执行 SQL 来触发定投。

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

### 方案三：使用外部 Cron 服务

如果 Netlify 免费计划不支持定时任务，可以使用外部服务：

#### 1. 创建触发端点

创建一个可以被外部调用的 Netlify Function：

```typescript
// netlify/functions/trigger-auto-invest.ts
// 需要添加认证 token 保护
```

#### 2. 使用免费 Cron 服务

- **EasyCron** (https://www.easycron.com/) - 免费计划
- **cron-job.org** (https://cron-job.org/) - 完全免费
- **GitHub Actions** - 免费（推荐）

#### 3. GitHub Actions 示例

创建 `.github/workflows/auto-invest.yml`:

```yaml
name: Auto Invest Daily

on:
  schedule:
    - cron: '0 18 * * *'  # UTC 18:00 = 北京时间 02:00
  workflow_dispatch:  # 允许手动触发

jobs:
  trigger-auto-invest:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Auto Invest
        run: |
          curl -X POST https://your-site.netlify.app/.netlify/functions/trigger-auto-invest \
            -H "Authorization: Bearer ${{ secrets.AUTO_INVEST_TOKEN }}"
```

## 当前状态检查

运行以下 SQL 检查当前定投状态：

```sql
-- 查看所有定投计划
SELECT 
  fund_name,
  auto_invest_enabled,
  auto_invest_amount,
  auto_invest_frequency,
  auto_invest_next_date,
  auto_invest_last_executed_date
FROM positions
WHERE auto_invest_enabled = true;
```

## 推荐方案

1. **如果有 Netlify Pro 计划**：使用方案一（Netlify Scheduled Functions）
2. **如果是免费计划**：使用方案三（GitHub Actions）
3. **临时解决**：使用方案二（手动执行 SQL）

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
