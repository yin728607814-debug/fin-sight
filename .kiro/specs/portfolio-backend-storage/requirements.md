# 投资组合后端存储需求文档

## 简介

当前投资组合数据（基金配置和持仓信息）存储在浏览器本地存储（localStorage）中，存在数据易丢失、无法跨设备同步、无法备份等问题。本需求旨在将数据迁移到后端数据库存储，提供可靠的数据持久化方案。

## 术语表

- **Portfolio**: 投资组合，包含用户的所有持仓信息
- **Position**: 持仓，单个基金或黄金的投资记录
- **Fund**: 基金，纳斯达克指数基金
- **Gold**: 黄金，实物黄金投资
- **Backend Storage**: 后端存储，指服务器端的数据库或缓存系统
- **Netlify Functions**: Netlify 提供的 Serverless 函数服务
- **Supabase**: 开源的 Firebase 替代品，提供 PostgreSQL 数据库
- **Upstash**: Serverless Redis 服务

## 需求

### 需求 1: 数据存储架构

**用户故事:** 作为开发者，我希望选择合适的后端存储方案，以便提供可靠、高性能的数据持久化服务。

#### 验收标准

1. WHEN 评估存储方案 THEN 系统 SHALL 支持 Supabase (PostgreSQL) 或 Upstash (Redis) 作为后端存储
2. WHEN 选择存储方案 THEN 系统 SHALL 考虑免费额度、性能、可靠性和易用性
3. WHEN 部署后端服务 THEN 系统 SHALL 使用 Netlify Functions 作为 API 层
4. WHEN 存储数据 THEN 系统 SHALL 支持用户隔离，每个用户只能访问自己的数据
5. WHEN 访问数据库 THEN 系统 SHALL 使用环境变量管理数据库连接信息

### 需求 2: 数据模型设计

**用户故事:** 作为开发者，我希望设计清晰的数据模型，以便准确存储投资组合信息。

#### 验收标准

1. WHEN 存储持仓数据 THEN 系统 SHALL 包含基金名称、持仓金额、持仓收益字段
2. WHEN 存储黄金数据 THEN 系统 SHALL 包含黄金克数、均价、持仓金额、持仓收益字段
3. WHEN 存储持仓记录 THEN 系统 SHALL 包含资产类型（纳斯达克/黄金）标识
4. WHEN 创建持仓 THEN 系统 SHALL 自动生成唯一ID和时间戳
5. WHEN 更新持仓 THEN 系统 SHALL 自动更新修改时间戳

### 需求 3: API 接口设计

**用户故事:** 作为前端开发者，我希望有清晰的 API 接口，以便与后端存储交互。

#### 验收标准

1. WHEN 获取持仓列表 THEN 系统 SHALL 提供 GET /api/positions 接口
2. WHEN 创建新持仓 THEN 系统 SHALL 提供 POST /api/positions 接口
3. WHEN 更新持仓 THEN 系统 SHALL 提供 PUT /api/positions/:id 接口
4. WHEN 删除持仓 THEN 系统 SHALL 提供 DELETE /api/positions/:id 接口
5. WHEN API 调用失败 THEN 系统 SHALL 返回标准的错误响应格式

### 需求 4: 数据迁移

**用户故事:** 作为用户，我希望现有的本地数据能够迁移到后端，以便不丢失历史数据。

#### 验收标准

1. WHEN 首次使用后端存储 THEN 系统 SHALL 检测本地存储中的数据
2. WHEN 发现本地数据 THEN 系统 SHALL 提示用户是否迁移数据
3. WHEN 用户确认迁移 THEN 系统 SHALL 将本地数据上传到后端
4. WHEN 迁移成功 THEN 系统 SHALL 清除本地存储中的数据
5. WHEN 迁移失败 THEN 系统 SHALL 保留本地数据并提示错误信息

### 需求 5: 用户认证

**用户故事:** 作为用户，我希望有简单的身份验证机制，以便保护我的投资数据。

#### 验收标准

1. WHEN 访问后端 API THEN 系统 SHALL 要求提供用户标识
2. WHEN 用户首次访问 THEN 系统 SHALL 生成唯一的用户ID
3. WHEN 用户ID生成后 THEN 系统 SHALL 将其存储在浏览器中
4. WHEN 发起API请求 THEN 系统 SHALL 在请求头中包含用户ID
5. WHEN 验证用户ID THEN 系统 SHALL 确保用户只能访问自己的数据

### 需求 6: 错误处理和重试

**用户故事:** 作为用户，我希望系统能够处理网络错误，以便在网络不稳定时仍能正常使用。

#### 验收标准

1. WHEN API 请求失败 THEN 系统 SHALL 自动重试最多3次
2. WHEN 网络断开 THEN 系统 SHALL 缓存操作并在网络恢复后同步
3. WHEN 后端不可用 THEN 系统 SHALL 降级到本地存储模式
4. WHEN 数据冲突 THEN 系统 SHALL 使用最后写入优先策略
5. WHEN 发生错误 THEN 系统 SHALL 向用户显示友好的错误提示

### 需求 7: 性能优化

**用户故事:** 作为用户，我希望数据加载快速，以便获得流畅的使用体验。

#### 验收标准

1. WHEN 加载持仓列表 THEN 系统 SHALL 在2秒内完成
2. WHEN 更新持仓 THEN 系统 SHALL 使用乐观更新策略
3. WHEN 频繁访问数据 THEN 系统 SHALL 在前端缓存数据
4. WHEN 数据变化 THEN 系统 SHALL 只同步变更的部分
5. WHEN 批量操作 THEN 系统 SHALL 支持批量API调用

### 需求 8: 数据备份和恢复

**用户故事:** 作为用户，我希望能够备份和恢复我的投资数据，以便防止数据丢失。

#### 验收标准

1. WHEN 用户请求备份 THEN 系统 SHALL 导出所有持仓数据为JSON文件
2. WHEN 用户上传备份文件 THEN 系统 SHALL 验证数据格式
3. WHEN 恢复数据 THEN 系统 SHALL 提示用户确认覆盖现有数据
4. WHEN 恢复完成 THEN 系统 SHALL 显示恢复的记录数量
5. WHEN 备份文件损坏 THEN 系统 SHALL 拒绝恢复并提示错误

## 非功能需求

### 安全性
- 所有 API 调用必须通过 HTTPS
- 数据库连接信息必须存储在环境变量中
- 用户数据必须隔离，防止跨用户访问

### 可靠性
- 系统可用性目标：99.5%
- 数据持久性目标：99.99%
- 支持降级到本地存储模式

### 性能
- API 响应时间 < 500ms (P95)
- 支持并发请求
- 前端缓存减少不必要的 API 调用

### 可维护性
- 代码结构清晰，易于理解
- 完善的错误日志
- 支持数据库迁移脚本
