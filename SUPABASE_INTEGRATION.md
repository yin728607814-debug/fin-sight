# Supabase 后端存储集成说明

## 概述

投资组合页面已成功集成 Supabase 后端存储，实现了从浏览器本地存储到云端数据库的迁移。

## 功能特性

### ✅ 已实现功能

1. **云端数据存储**
   - 所有持仓数据存储在 Supabase PostgreSQL 数据库
   - 自动用户 ID 管理（UUID）
   - 数据持久化和跨设备同步

2. **数据迁移**
   - 自动检测本地存储数据
   - 一键迁移到云端
   - 迁移完成后自动清理本地数据

3. **CRUD 操作**
   - 创建持仓：支持纳斯达克和黄金两种资产类型
   - 更新持仓：实时更新持仓信息
   - 删除持仓：安全删除持仓记录
   - 查询持仓：快速获取所有持仓数据

4. **乐观更新**
   - UI 立即响应用户操作
   - 后台异步同步到服务器
   - 失败时自动回滚

5. **错误处理**
   - 友好的错误提示
   - 自动重试机制
   - 降级到本地存储（如果 Supabase 未配置）

6. **数据导出**
   - 支持导出为 JSON 格式
   - 包含完整的持仓信息
   - 可用于备份和迁移

## 技术架构

### 核心组件

1. **services/supabaseClient.ts**
   - Supabase 客户端连接配置
   - 环境变量管理

2. **services/positionService.ts**
   - 持仓 CRUD 操作
   - 数据类型转换（PostgreSQL DECIMAL → Number）

3. **services/userService.ts**
   - 用户 ID 生成和管理
   - 使用 UUID 作为用户标识

4. **services/migrationService.ts**
   - 本地数据迁移到 Supabase
   - 数据格式转换

5. **services/portfolioAdapter.ts**
   - 数据格式适配器
   - PositionRecord ↔ Position 转换

6. **hooks/usePortfolioWithSupabase.ts**
   - React Hook 封装
   - 状态管理和乐观更新
   - 与原有 portfolioService 兼容

7. **components/MigrationPrompt.tsx**
   - 数据迁移 UI 组件
   - 迁移进度提示

### 数据流

```
用户操作 → PortfolioPage
         ↓
    usePortfolioWithSupabase Hook
         ↓
    portfolioAdapter (格式转换)
         ↓
    positionService (CRUD)
         ↓
    Supabase Client
         ↓
    PostgreSQL Database
```

## 使用说明

### 首次使用

1. **访问投资组合页面**
   - 打开 http://localhost:3000/portfolio
   - 如果有本地数据，会自动显示迁移提示

2. **数据迁移**
   - 点击"开始迁移"按钮
   - 等待迁移完成
   - 迁移成功后，本地数据会被清理

3. **正常使用**
   - 添加、编辑、删除持仓
   - 所有操作自动同步到云端
   - 页面标题显示"云端同步"标识

### 数据管理

1. **添加持仓**
   - 点击"添加持仓"按钮
   - 填写持仓信息
   - 数据自动保存到云端

2. **编辑持仓**
   - 点击持仓卡片的"编辑"按钮
   - 修改持仓信息
   - 更新自动同步

3. **删除持仓**
   - 点击持仓卡片的"删除"按钮
   - 确认删除
   - 数据从云端删除

4. **导出数据**
   - 点击页面右上角的"导出"按钮
   - 下载 JSON 格式的备份文件

## 环境配置

### 必需的环境变量

在 `.env` 文件中配置：

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Netlify 部署配置

在 Netlify 控制台配置环境变量：
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## 数据库结构

### positions 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| user_id | VARCHAR(255) | 用户 ID |
| asset_type | VARCHAR(20) | 资产类型（nasdaq/gold） |
| fund_name | VARCHAR(255) | 基金名称（纳斯达克） |
| quantity | DECIMAL(10,3) | 黄金克数 |
| average_buy_price | DECIMAL(10,2) | 黄金均价 |
| investment_amount | DECIMAL(12,2) | 持仓金额 |
| profit_loss | DECIMAL(12,2) | 持仓收益 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

### 索引

- `idx_positions_user_id`: 用户 ID 索引
- `idx_positions_asset_type`: 资产类型索引
- `idx_positions_created_at`: 创建时间索引
- `idx_positions_user_asset`: 复合索引（用户 ID + 资产类型）

## 测试

### 测试页面

访问 http://localhost:3000/supabase-test 进行功能测试：
- 查看 Supabase 连接状态
- 测试 CRUD 操作
- 查看持仓列表

### 测试场景

1. **创建持仓**
   - 点击"创建测试持仓"
   - 验证数据出现在列表中

2. **更新持仓**
   - 点击持仓的"更新"按钮
   - 验证收益金额变化

3. **删除持仓**
   - 点击持仓的"删除"按钮
   - 验证数据从列表中消失

4. **数据迁移**
   - 在浏览器本地存储中添加测试数据
   - 刷新页面
   - 验证迁移提示出现
   - 执行迁移并验证成功

## 故障排查

### 问题：页面一直显示"加载中"

**原因**：Supabase 连接失败或表不存在

**解决方案**：
1. 检查环境变量配置
2. 确认 positions 表已创建
3. 查看浏览器控制台错误信息

### 问题：数据迁移失败

**原因**：数据格式不兼容或网络问题

**解决方案**：
1. 检查本地数据格式
2. 确认网络连接正常
3. 查看控制台错误日志

### 问题：CRUD 操作失败

**原因**：权限问题或数据验证失败

**解决方案**：
1. 检查 RLS 策略配置
2. 验证输入数据格式
3. 查看 Supabase 日志

## 性能优化

1. **乐观更新**
   - UI 立即响应，提升用户体验
   - 后台异步同步，减少等待时间

2. **数据缓存**
   - Hook 内部缓存持仓列表
   - 减少不必要的 API 调用

3. **批量操作**
   - 支持批量创建持仓
   - 减少网络请求次数

## 安全性

1. **用户隔离**
   - 每个用户有独立的 UUID
   - 数据按用户 ID 隔离

2. **RLS 策略**
   - 启用 Row Level Security
   - 防止未授权访问

3. **HTTPS 加密**
   - 所有 API 请求使用 HTTPS
   - 数据传输加密

## 下一步计划

- [ ] 实现数据备份和恢复功能
- [ ] 添加数据同步状态指示器
- [ ] 支持离线模式
- [ ] 实现数据版本控制
- [ ] 添加数据统计和分析功能

## 相关文件

- `pages/PortfolioPage.tsx` - 投资组合页面
- `hooks/usePortfolioWithSupabase.ts` - Supabase Hook
- `services/portfolioAdapter.ts` - 数据适配器
- `services/positionService.ts` - 持仓服务
- `services/migrationService.ts` - 迁移服务
- `components/MigrationPrompt.tsx` - 迁移提示组件
- `database/migrations/001_create_positions_table.sql` - 数据库迁移脚本
- `database/SUPABASE_SETUP.md` - Supabase 设置指南
