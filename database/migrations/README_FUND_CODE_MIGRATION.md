# 基金代码功能迁移指南

## 概述
此迁移添加了基金代码字段，用于更准确地获取基金收益率数据。

## 数据库迁移步骤

### 1. 在 Supabase 控制台执行 SQL

1. 登录 Supabase 控制台
2. 进入你的项目
3. 点击左侧菜单的 "SQL Editor"
4. 创建新查询
5. 复制并执行 `add_fund_code.sql` 中的 SQL 语句

### 2. 验证迁移

执行以下 SQL 验证字段已添加：

```sql
-- 检查 fund_configs 表结构
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'fund_configs'
AND column_name = 'fund_code';

-- 检查 positions 表结构
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'positions'
AND column_name = 'fund_code';
```

## 现有基金代码导入

### 方法1：通过 UI 手动更新

1. 访问 `/fund-config` 页面
2. 编辑每个基金
3. 添加对应的基金代码

### 方法2：通过 SQL 批量更新

如果你知道现有基金的代码，可以执行类似以下的 SQL：

```sql
-- 示例：更新纳斯达克100基金代码
UPDATE fund_configs 
SET fund_code = '161125' 
WHERE name = '易方达标普信息科技人民币A' 
AND fund_type = 'nasdaq';

-- 示例：更新A股基金代码
UPDATE fund_configs 
SET fund_code = '110011' 
WHERE name = '易方达中小盘混合' 
AND fund_type = 'astock';
```

### 方法3：从现有持仓同步

如果你的持仓中已经有基金代码信息，可以执行：

```sql
-- 从 positions 同步到 fund_configs
UPDATE fund_configs fc
SET fund_code = p.fund_code
FROM positions p
WHERE fc.name = p.fund_name
AND p.fund_code IS NOT NULL
AND fc.fund_code IS NULL;
```

## 功能说明

### 添加持仓时
- 系统会自动从选择的基金配置中获取基金代码
- 基金代码会保存到持仓记录中

### 编辑持仓时
- 可以查看和修改基金代码
- 修改后会更新持仓记录

### 获取收益率时
- 如果持仓有基金代码，系统会使用该代码获取准确的收益率
- 如果没有基金代码，系统会尝试使用基金名称匹配

## 注意事项

1. 基金代码是可选字段，不影响现有功能
2. 建议为所有基金配置添加基金代码，以获得更准确的收益率数据
3. 基金代码通常是6位数字（如：161125）
4. 可以从天天基金网、支付宝等平台查询基金代码

## 回滚

如果需要回滚此迁移，执行：

```sql
-- 删除 fund_configs 表的 fund_code 列
ALTER TABLE fund_configs DROP COLUMN IF EXISTS fund_code;

-- 删除 positions 表的 fund_code 列
ALTER TABLE positions DROP COLUMN IF EXISTS fund_code;
```
