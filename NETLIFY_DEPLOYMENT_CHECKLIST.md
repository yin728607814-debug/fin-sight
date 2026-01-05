# Netlify 部署检查清单

## 部署前准备

### 1. Supabase 数据库配置

在 Supabase SQL Editor 中执行以下脚本：

#### ✅ 创建 positions 表
```sql
-- 执行 database/migrations/001_create_positions_table.sql
```

#### ✅ 创建 fund_configs 表
```sql
-- 执行 database/migrations/002_create_fund_configs_table.sql
```

### 2. Netlify 环境变量配置

在 Netlify 控制台 → Site settings → Environment variables 中添加：

```
VITE_SUPABASE_URL=https://bhedgcynaclprbztcmcl.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_wQzNQgLEPJn7P4n46eiFyw_LhJnpwu3
```

**重要**：配置完环境变量后需要重新部署！

### 3. 代码推送

```bash
git push origin main
```

✅ 已完成！代码已推送到 GitHub

## 部署后验证

### 1. 基础功能验证

访问以下页面确认正常工作：

- [ ] 首页: `https://your-app.netlify.app/`
- [ ] 投资组合: `https://your-app.netlify.app/portfolio`
- [ ] Supabase测试: `https://your-app.netlify.app/supabase-test`
- [ ] 数据导入: `https://your-app.netlify.app/import-data`

### 2. Supabase 连接测试

访问 Supabase 测试页面：
```
https://your-app.netlify.app/supabase-test
```

检查项：
- [ ] Supabase 状态显示"已连接"
- [ ] 可以创建测试持仓
- [ ] 可以查看持仓列表
- [ ] 可以更新持仓
- [ ] 可以删除持仓

### 3. 基金数据导入测试

访问数据导入页面：
```
https://your-app.netlify.app/import-data
```

执行步骤：
1. [ ] 查看数据预览（应显示20条基金数据）
2. [ ] 点击"开始导入"
3. [ ] 等待导入完成
4. [ ] 检查导入结果：
   - 基金配置创建: 20个
   - 持仓记录创建: 20个
   - 错误: 0个

### 4. 投资组合页面验证

访问投资组合页面：
```
https://your-app.netlify.app/portfolio
```

检查项：
- [ ] 页面标题显示"云端同步"标识
- [ ] 显示导入的20条持仓记录
- [ ] 持仓列表正确显示基金名称、金额、收益
- [ ] 可以添加新持仓
- [ ] 可以编辑持仓
- [ ] 可以删除持仓
- [ ] 数据实时同步到 Supabase

### 5. 数据迁移测试（如果有本地数据）

如果之前有本地存储的数据：
- [ ] 访问投资组合页面时显示迁移提示
- [ ] 点击"开始迁移"
- [ ] 迁移成功完成
- [ ] 本地数据已清理
- [ ] 数据已同步到 Supabase

## 常见问题排查

### 问题1：Supabase 状态显示"未配置"

**原因**：环境变量未配置或配置错误

**解决方案**：
1. 检查 Netlify 环境变量是否正确配置
2. 确认变量名称正确：
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. 重新部署应用

### 问题2：数据库表不存在错误

**错误信息**：`Could not find the table 'public.positions'` 或 `Could not find the table 'public.fund_configs'`

**解决方案**：
1. 登录 Supabase Dashboard
2. 打开 SQL Editor
3. 执行数据库迁移脚本：
   - `database/migrations/001_create_positions_table.sql`
   - `database/migrations/002_create_fund_configs_table.sql`

### 问题3：导入数据失败

**可能原因**：
- 网络连接问题
- Supabase 配置错误
- 数据格式问题

**解决方案**：
1. 检查浏览器控制台错误信息
2. 确认 Supabase 连接正常
3. 查看导入结果中的具体错误信息
4. 手动修复失败的数据

### 问题4：页面加载缓慢

**可能原因**：
- Supabase 查询性能问题
- 数据量过大

**解决方案**：
1. 检查 Supabase 索引是否创建
2. 优化查询语句
3. 考虑添加分页功能

## 性能监控

### Supabase 使用情况

登录 Supabase Dashboard 查看：
- [ ] API 请求次数
- [ ] 数据库存储使用量
- [ ] 活跃连接数

### Netlify 部署状态

登录 Netlify Dashboard 查看：
- [ ] 部署状态（成功/失败）
- [ ] 构建日志
- [ ] 函数调用次数

## 数据备份

定期备份数据：
1. [ ] 在投资组合页面点击"导出"按钮
2. [ ] 下载 JSON 备份文件
3. [ ] 保存到安全位置

## 下一步

部署验收通过后：
- [ ] 通知团队成员
- [ ] 更新文档
- [ ] 监控生产环境运行状况
- [ ] 收集用户反馈

## 联系信息

如有问题，请查看：
- `SUPABASE_INTEGRATION.md` - Supabase 集成说明
- `FUND_DATA_IMPORT.md` - 基金数据导入说明
- `database/SUPABASE_SETUP.md` - Supabase 设置指南

## 部署时间

- 代码推送时间: 2026-01-04
- 预计部署完成: 自动部署约需 2-5 分钟
- 验收负责人: [您的名字]

---

**注意**：首次部署后，请务必完成所有验证步骤，确保功能正常运行！
