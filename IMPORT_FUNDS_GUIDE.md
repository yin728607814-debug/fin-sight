# 基金数据导入指南

本指南将帮助你将 NEW_TZZH.txt 中的基金数据导入到系统中。

## 前置条件

1. 已完成数据库迁移（执行 `database/migrations/003_add_astock_support.sql`）
2. 知道你的用户ID（可以在浏览器控制台运行 `localStorage.getItem('userId')` 获取）

## 导入步骤

### 步骤 1: 执行数据库迁移

在 Supabase SQL Editor 中执行以下脚本：

```sql
-- 文件: database/migrations/003_add_astock_support.sql
```

这将添加 A股 支持到数据库。

### 步骤 2: 获取你的用户ID

1. 打开浏览器开发者工具（F12）
2. 在控制台（Console）中运行：
   ```javascript
   localStorage.getItem('userId')
   ```
3. 复制返回的用户ID

### 步骤 3: 生成导入SQL

运行以下命令生成导入SQL（将 YOUR_USER_ID 替换为你的实际用户ID）：

```bash
npx ts-node scripts/importFundsData.ts YOUR_USER_ID > import.sql
```

或者手动编辑 `scripts/importFundsData.ts` 中的用户ID并运行。

### 步骤 4: 执行导入SQL

1. 打开生成的 `import.sql` 文件
2. 复制所有内容
3. 在 Supabase SQL Editor 中粘贴并执行

## 数据说明

### 纳斯达克基金（20个）

从 NEW_TZZH.txt 分割线上方的数据，包括：
- 摩根纳斯达克100指数(QDII)人民币A
- 建信纳斯达克100指数QDII A
- 南方纳斯达克100指数发起(QDII) A
- ... 等共20个基金

### A股基金（10个）

从 NEW_TZZH.txt 分割线下方的数据，包括：
- 前海开源嘉鑫灵活配置混合C
- 长城久嘉创新成长灵活配置混合C
- 汇添富中证电池主题ETF联接C
- ... 等共10个基金

## 数据格式

每条数据包含：
- **基金名称**: 完整的基金名称
- **当前金额**: 持仓总金额（元）
- **盈亏**: 持仓收益（元）

系统会自动计算：
- **投资金额** = 当前金额 - 盈亏
- **收益率** = 盈亏 / 投资金额 × 100%

## 验证导入

导入完成后，可以在 Supabase SQL Editor 中运行以下查询验证：

```sql
-- 查看基金配置统计
SELECT fund_type, COUNT(*) as count
FROM fund_configs
WHERE user_id = 'YOUR_USER_ID'
GROUP BY fund_type;

-- 查看持仓统计
SELECT asset_type, COUNT(*) as count, 
       SUM(investment_amount) as total_investment,
       SUM(profit_loss) as total_profit
FROM positions
WHERE user_id = 'YOUR_USER_ID'
GROUP BY asset_type;
```

预期结果：
- fund_configs: nasdaq (20), astock (10)
- positions: nasdaq (20), astock (10)

## 界面使用

导入完成后，在投资组合页面你将看到：

1. **顶部总览Tab**: 全部资产 | 纳斯达克100 | A股基金 | 现货黄金
2. **持仓列表Tab**: 全部 | 纳斯达克 | A股 | 黄金
3. **添加持仓**: 可以选择资产类型（纳斯达克/A股/黄金）

## 注意事项

1. 导入前请备份现有数据
2. 确保用户ID正确，否则数据会关联到错误的用户
3. 如果基金名称已存在，导入会失败（需要先删除或修改）
4. A股基金暂时没有实时价格更新，收益需要手动维护

## 故障排除

### 问题：导入失败，提示约束违反

**解决方案**: 确保已执行 `003_add_astock_support.sql` 迁移脚本

### 问题：看不到导入的数据

**解决方案**: 
1. 检查用户ID是否正确
2. 刷新页面
3. 检查浏览器控制台是否有错误

### 问题：基金名称重复

**解决方案**: 
```sql
-- 删除重复的基金配置
DELETE FROM fund_configs 
WHERE user_id = 'YOUR_USER_ID' 
AND name = '重复的基金名称';

-- 删除重复的持仓
DELETE FROM positions 
WHERE user_id = 'YOUR_USER_ID' 
AND fund_name = '重复的基金名称';
```

## 后续步骤

1. 在基金配置页面查看所有基金
2. 在投资组合页面查看持仓统计
3. 根据需要调整持仓金额和收益
4. 定期更新A股基金的收益数据

## 技术支持

如有问题，请查看：
- `database/migrations/003_add_astock_support.sql` - 数据库迁移脚本
- `scripts/importFundsData.ts` - 数据导入脚本
- `types.ts` - 类型定义
- `services/fundConfigService.ts` - 基金配置服务
- `services/positionService.ts` - 持仓服务
