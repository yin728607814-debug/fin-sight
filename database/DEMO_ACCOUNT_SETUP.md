# 演示账号设置指南

## 概述
本指南将帮助你创建一个演示账号，用于展示投资组合功能，而不暴露真实的财务数据。

## 前提条件
- 已有 Supabase 项目访问权限
- 已完成数据库迁移（RLS 策略已启用）

## 步骤

### 1. 在 Supabase 中创建新用户

1. 登录 Supabase Dashboard
2. 进入 `Authentication` > `Users`
3. 点击 `Add user` > `Create new user`
4. 填写信息：
   - Email: `demo@finsight.com`
   - Password: `Demo123456!`
   - Auto Confirm User: ✅ 勾选
5. 点击 `Create user`
6. **复制新创建用户的 UUID**（在用户列表中可以看到）

### 2. 修复 RLS 策略并创建演示数据

1. 打开 Supabase SQL Editor
2. 打开 `database/create_demo_account.sql` 文件
3. **重要**：将文件中所有的 `'demo-user-uuid-here'` 替换为步骤1中复制的实际 UUID
4. 执行整个 SQL 脚本

### 3. 验证数据

执行以下查询验证数据是否创建成功：

```sql
-- 查看持仓汇总
SELECT 
  asset_type,
  COUNT(*) as position_count,
  SUM(shares * current_price) as total_value
FROM positions
WHERE user_id = '你的演示账号UUID'
GROUP BY asset_type;
```

预期结果：
- nasdaq: 3个持仓，总值约80万
- gold: 3个持仓，总值约60万
- astock: 3个持仓，总值约10万

### 4. 登录演示账号

1. 退出当前账号
2. 使用演示账号登录：
   - Email: `demo@finsight.com`
   - Password: `Demo123456!`
3. 进入投资组合页面，查看演示数据

## 数据配置详情

### 纳斯达克持仓（80万）
- QQQ (Invesco QQQ Trust): 2000股 × $210.50 = $421,000 ≈ 40万
- TQQQ (ProShares UltraPro QQQ): 3500股 × $60.20 = $210,700 ≈ 20万
- QQQM (Invesco NASDAQ 100 ETF): 1200股 × $175.30 = $210,360 ≈ 20万

### 黄金持仓（60万）
- GLD (SPDR Gold Shares): 1500股 × $208.50 = $312,750 ≈ 30万
- IAU (iShares Gold Trust): 4000股 × $52.30 = $209,200 ≈ 20万
- GLDM (SPDR Gold MiniShares Trust): 2000股 × $52.10 = $104,200 ≈ 10万

### A股持仓（10万）
- 510300 (沪深300ETF): 12000股 × ¥4.35 = ¥52,200 ≈ 5万
- 159915 (创业板ETF): 15000股 × ¥2.08 = ¥31,200 ≈ 3万
- 510500 (中证500ETF): 3000股 × ¥6.95 = ¥20,850 ≈ 2万

## 安全说明

### RLS 策略已修复
脚本会自动修复 `auto_invest_plans` 表的 RLS 策略，确保：
- 每个用户只能看到自己的数据
- 无法访问其他用户的持仓、配置或定投计划
- 所有表（positions, fund_configs, auto_invest_plans, sentiment_history）都有正确的 RLS 策略

### 数据隔离
- 真实账号和演示账号的数据完全隔离
- 通过 Supabase Auth 的 `auth.uid()` 实现用户识别
- 数据库层面强制执行访问控制

## 故障排除

### 问题：执行 SQL 时报错 "policy already exists"
**解决**：先删除旧策略，然后重新创建。脚本中已包含 `DROP POLICY IF EXISTS`。

### 问题：登录演示账号后看不到数据
**检查**：
1. 确认 UUID 替换正确
2. 确认 SQL 脚本执行成功
3. 检查浏览器控制台是否有错误
4. 确认 RLS 策略已正确应用

### 问题：看到其他用户的数据
**原因**：RLS 策略未正确配置
**解决**：重新执行 SQL 脚本的第一部分（RLS 策略修复）

## 后续维护

### 更新演示数据
如需更新演示账号的持仓数据，可以：
1. 登录演示账号
2. 在投资组合页面手动添加/编辑持仓
3. 或者修改 SQL 脚本重新执行

### 删除演示账号
1. 在 Supabase Dashboard 中删除用户
2. 相关数据会通过 `ON DELETE CASCADE` 自动清理

## 完成！
现在你可以安全地使用演示账号进行展示，而不会暴露真实的财务数据。
