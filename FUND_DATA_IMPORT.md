# 基金数据导入说明

## 概述

已创建基金配置表和数据导入功能，可以将 NEW_TZZH.txt 中的基金数据导入到 Supabase。

## 数据库表结构

### fund_configs 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| user_id | VARCHAR(255) | 用户 ID |
| name | VARCHAR(255) | 基金名称 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

## 使用步骤

### 1. 创建 fund_configs 表

在 Supabase SQL Editor 中执行：

```bash
database/migrations/002_create_fund_configs_table.sql
```

或者直接执行以下 SQL：

```sql
-- 创建 fund_configs 表
CREATE TABLE IF NOT EXISTS fund_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_fund_configs_user_id ON fund_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_fund_configs_name ON fund_configs(name);
CREATE INDEX IF NOT EXISTS idx_fund_configs_created_at ON fund_configs(created_at DESC);

-- 创建触发器
DROP TRIGGER IF EXISTS update_fund_configs_updated_at ON fund_configs;
CREATE TRIGGER update_fund_configs_updated_at 
  BEFORE UPDATE ON fund_configs 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 启用 RLS
ALTER TABLE fund_configs ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON fund_configs;
CREATE POLICY "Enable all operations for authenticated users"
  ON fund_configs
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

### 2. 访问导入页面

打开浏览器访问：

```
http://localhost:3000/import-data
```

或者在部署后访问：

```
https://your-app.netlify.app/import-data
```

### 3. 执行导入

1. 页面会显示 NEW_TZZH.txt 中的所有基金数据预览（20条）
2. 点击"开始导入"按钮
3. 等待导入完成
4. 查看导入结果：
   - 基金配置创建数量
   - 持仓记录创建数量
   - 错误信息（如果有）

### 4. 验证导入结果

访问投资组合页面查看导入的数据：

```
http://localhost:3000/portfolio
```

## 导入的数据

从 NEW_TZZH.txt 导入的基金数据包括：

1. **基金配置** (20个)
   - 摩根纳斯达克100指数(QDII)人民币A
   - 建信纳斯达克100指数QDII A
   - 南方纳斯达克100指数发起(QDII) A
   - ... 等共20个基金

2. **持仓记录** (20条)
   - 每个基金对应一条持仓记录
   - 包含持仓金额和持仓收益

## 数据格式

NEW_TZZH.txt 的数据格式：

```
基金名称｜持仓金额｜持仓收益
```

示例：
```
摩根纳斯达克100指数(QDII)人民币A ｜51114.10｜-335.90
```

## 技术实现

### 核心文件

1. **database/migrations/002_create_fund_configs_table.sql**
   - 基金配置表创建脚本

2. **types/database.ts**
   - FundConfigRecord 类型定义
   - CreateFundConfigInput 类型定义
   - UpdateFundConfigInput 类型定义

3. **services/fundConfigSupabaseService.ts**
   - 基金配置 CRUD 服务
   - 批量创建功能
   - 搜索功能

4. **pages/ImportDataPage.tsx**
   - 数据导入页面
   - 数据预览
   - 导入执行和结果显示

5. **scripts/import-fund-data.ts**
   - 命令行导入脚本（可选）

### 导入流程

```
1. 解析 NEW_TZZH.txt 数据
   ↓
2. 批量创建基金配置（去重）
   ↓
3. 逐条创建持仓记录
   ↓
4. 显示导入结果
```

## 注意事项

1. **去重处理**
   - 基金配置会自动去重
   - 已存在的基金配置不会重复创建

2. **错误处理**
   - 如果某条持仓创建失败，会继续处理其他数据
   - 所有错误会在结果中显示

3. **数据验证**
   - 基金名称不能为空
   - 持仓金额和收益必须是有效数字

4. **用户隔离**
   - 每个用户的数据独立存储
   - 使用 user_id 进行隔离

## Netlify 部署配置

确保在 Netlify 环境变量中配置：

```
VITE_SUPABASE_URL=https://bhedgcynaclprbztcmcl.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 故障排查

### 问题：导入失败

**可能原因**：
- Supabase 未配置
- fund_configs 表未创建
- 网络连接问题

**解决方案**：
1. 检查环境变量配置
2. 确认 fund_configs 表已创建
3. 查看浏览器控制台错误信息

### 问题：部分数据导入失败

**可能原因**：
- 数据格式不正确
- 持仓记录已存在

**解决方案**：
1. 检查导入结果中的错误信息
2. 手动修复失败的数据
3. 重新执行导入

## 后续优化

- [ ] 支持从文件上传导入
- [ ] 支持导入历史记录
- [ ] 支持批量更新持仓
- [ ] 支持导入进度显示
- [ ] 支持导入回滚功能
