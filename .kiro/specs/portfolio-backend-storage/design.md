# 投资组合后端存储设计文档

## 概述

本设计文档描述了将投资组合数据从浏览器本地存储迁移到后端数据库的完整方案。我们将使用 **Netlify Functions + Supabase (PostgreSQL)** 作为主要技术栈，提供可靠、可扩展的数据持久化服务。

## 架构设计

### 整体架构

```
┌─────────────────┐
│   React 前端    │
│  (Vite + React) │
└────────┬────────┘
         │ HTTPS
         ▼
┌─────────────────┐
│ Netlify Functions│
│   (API Layer)   │
└────────┬────────┘
         │ PostgreSQL Protocol
         ▼
┌─────────────────┐
│    Supabase     │
│  (PostgreSQL)   │
└─────────────────┘
```

### 技术选型

#### 1. 后端存储：Supabase (PostgreSQL)

**选择理由：**
- ✅ 免费额度：500MB 数据库 + 50,000 月活用户
- ✅ 关系型数据库，支持复杂查询和事务
- ✅ 内置 Row Level Security (RLS) 支持数据隔离
- ✅ 提供 REST API 和 JavaScript SDK
- ✅ 自动备份和恢复功能
- ✅ 实时订阅功能（可选）

**替代方案：Upstash Redis**
- 优点：更快的读写速度，适合缓存
- 缺点：数据结构简单，不支持复杂查询
- 适用场景：如果只需要简单的 key-value 存储

#### 2. API 层：Netlify Functions

**选择理由：**
- ✅ 与前端部署在同一平台，配置简单
- ✅ 免费额度：125,000 次请求/月
- ✅ 自动扩展，无需管理服务器
- ✅ 支持环境变量管理
- ✅ 与 Supabase 集成简单

#### 3. 用户认证：简化方案

**选择理由：**
- 使用浏览器生成的 UUID 作为用户标识
- 存储在 localStorage 中
- 无需复杂的注册/登录流程
- 适合个人使用场景

## 数据模型设计

### 数据库表结构

#### 1. positions 表

```sql
CREATE TABLE positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  asset_type VARCHAR(20) NOT NULL CHECK (asset_type IN ('nasdaq', 'gold')),
  
  -- 基金信息（纳斯达克）
  fund_name VARCHAR(255),
  
  -- 黄金信息
  quantity DECIMAL(10, 3),  -- 黄金克数
  average_buy_price DECIMAL(10, 2),  -- 黄金均价（元/克）
  
  -- 通用信息
  investment_amount DECIMAL(12, 2) NOT NULL,  -- 持仓金额（元）
  profit_loss DECIMAL(12, 2) NOT NULL,  -- 持仓收益（元）
  
  -- 元数据
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 索引
  INDEX idx_user_id (user_id),
  INDEX idx_asset_type (asset_type),
  INDEX idx_created_at (created_at)
);

-- 自动更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_positions_updated_at 
  BEFORE UPDATE ON positions 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own positions"
  ON positions
  FOR ALL
  USING (user_id = current_setting('app.user_id', true));
```

### TypeScript 类型定义

```typescript
// types/database.ts
export interface PositionRecord {
  id: string;
  user_id: string;
  asset_type: 'nasdaq' | 'gold';
  
  // 基金信息
  fund_name?: string;
  
  // 黄金信息
  quantity?: number;
  average_buy_price?: number;
  
  // 通用信息
  investment_amount: number;
  profit_loss: number;
  
  // 元数据
  created_at: string;
  updated_at: string;
}

export interface CreatePositionInput {
  asset_type: 'nasdaq' | 'gold';
  fund_name?: string;
  quantity?: number;
  average_buy_price?: number;
  investment_amount: number;
  profit_loss: number;
}

export interface UpdatePositionInput {
  fund_name?: string;
  quantity?: number;
  average_buy_price?: number;
  investment_amount?: number;
  profit_loss?: number;
}
```

## API 接口设计

### 1. 获取持仓列表

**端点:** `GET /api/positions`

**请求头:**
```
X-User-ID: <user_uuid>
```

**响应:**
```json
{
  "success": true,
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "asset_type": "nasdaq",
      "fund_name": "摩根纳斯达克100指数(QDII)人民币A",
      "investment_amount": 51114.10,
      "profit_loss": -335.90,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### 2. 创建持仓

**端点:** `POST /api/positions`

**请求头:**
```
X-User-ID: <user_uuid>
Content-Type: application/json
```

**请求体:**
```json
{
  "asset_type": "nasdaq",
  "fund_name": "摩根纳斯达克100指数(QDII)人民币A",
  "investment_amount": 51114.10,
  "profit_loss": -335.90
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "asset_type": "nasdaq",
    "fund_name": "摩根纳斯达克100指数(QDII)人民币A",
    "investment_amount": 51114.10,
    "profit_loss": -335.90,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

### 3. 更新持仓

**端点:** `PUT /api/positions/:id`

**请求头:**
```
X-User-ID: <user_uuid>
Content-Type: application/json
```

**请求体:**
```json
{
  "investment_amount": 52000.00,
  "profit_loss": 550.00
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "asset_type": "nasdaq",
    "fund_name": "摩根纳斯达克100指数(QDII)人民币A",
    "investment_amount": 52000.00,
    "profit_loss": 550.00,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-02T00:00:00Z"
  }
}
```

### 4. 删除持仓

**端点:** `DELETE /api/positions/:id`

**请求头:**
```
X-User-ID: <user_uuid>
```

**响应:**
```json
{
  "success": true,
  "message": "Position deleted successfully"
}
```

### 5. 批量导入持仓

**端点:** `POST /api/positions/batch`

**请求头:**
```
X-User-ID: <user_uuid>
Content-Type: application/json
```

**请求体:**
```json
{
  "positions": [
    {
      "asset_type": "nasdaq",
      "fund_name": "摩根纳斯达克100指数(QDII)人民币A",
      "investment_amount": 51114.10,
      "profit_loss": -335.90
    },
    {
      "asset_type": "gold",
      "quantity": 100.5,
      "average_buy_price": 500.00,
      "investment_amount": 50250.00,
      "profit_loss": 1250.00
    }
  ]
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "imported": 2,
    "failed": 0
  }
}
```

## 组件设计

### 1. 后端服务层

#### Supabase 客户端

```typescript
// services/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
```

#### 持仓服务

```typescript
// services/positionService.ts
import { supabase } from './supabaseClient';
import { PositionRecord, CreatePositionInput, UpdatePositionInput } from '../types/database';

export class PositionService {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  async getPositions(): Promise<PositionRecord[]> {
    const { data, error } = await supabase
      .from('positions')
      .select('*')
      .eq('user_id', this.userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async createPosition(input: CreatePositionInput): Promise<PositionRecord> {
    const { data, error } = await supabase
      .from('positions')
      .insert({
        user_id: this.userId,
        ...input
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updatePosition(id: string, input: UpdatePositionInput): Promise<PositionRecord> {
    const { data, error } = await supabase
      .from('positions')
      .update(input)
      .eq('id', id)
      .eq('user_id', this.userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deletePosition(id: string): Promise<void> {
    const { error } = await supabase
      .from('positions')
      .delete()
      .eq('id', id)
      .eq('user_id', this.userId);

    if (error) throw error;
  }

  async batchCreatePositions(inputs: CreatePositionInput[]): Promise<number> {
    const records = inputs.map(input => ({
      user_id: this.userId,
      ...input
    }));

    const { data, error } = await supabase
      .from('positions')
      .insert(records)
      .select();

    if (error) throw error;
    return data.length;
  }
}
```

### 2. 用户认证服务

```typescript
// services/userService.ts
import { v4 as uuidv4 } from 'uuid';

const USER_ID_KEY = 'portfolio_user_id';

export class UserService {
  static getUserId(): string {
    let userId = localStorage.getItem(USER_ID_KEY);
    
    if (!userId) {
      userId = uuidv4();
      localStorage.setItem(USER_ID_KEY, userId);
    }
    
    return userId;
  }

  static clearUserId(): void {
    localStorage.removeItem(USER_ID_KEY);
  }
}
```

### 3. 数据迁移服务

```typescript
// services/migrationService.ts
import { PositionService } from './positionService';
import { UserService } from './userService';
import { EnhancedPosition } from '../types';

export class MigrationService {
  static async migrateFromLocalStorage(): Promise<{ success: boolean; count: number }> {
    try {
      // 1. 读取本地存储的数据
      const localData = localStorage.getItem('portfolio_positions');
      if (!localData) {
        return { success: true, count: 0 };
      }

      const positions: EnhancedPosition[] = JSON.parse(localData);
      if (positions.length === 0) {
        return { success: true, count: 0 };
      }

      // 2. 转换为后端格式
      const userId = UserService.getUserId();
      const positionService = new PositionService(userId);

      const inputs = positions.map(pos => ({
        asset_type: pos.assetType,
        fund_name: pos.fundName,
        quantity: pos.quantity,
        average_buy_price: pos.averageBuyPrice,
        investment_amount: pos.investmentAmount,
        profit_loss: pos.profitLoss
      }));

      // 3. 批量上传到后端
      const count = await positionService.batchCreatePositions(inputs);

      // 4. 清除本地存储
      localStorage.removeItem('portfolio_positions');

      return { success: true, count };
    } catch (error) {
      console.error('Migration failed:', error);
      return { success: false, count: 0 };
    }
  }

  static hasLocalData(): boolean {
    const localData = localStorage.getItem('portfolio_positions');
    return !!localData && JSON.parse(localData).length > 0;
  }
}
```

### 4. 前端 Hook

```typescript
// hooks/usePositions.ts
import { useState, useEffect } from 'react';
import { PositionService } from '../services/positionService';
import { UserService } from '../services/userService';
import { PositionRecord, CreatePositionInput, UpdatePositionInput } from '../types/database';

export function usePositions() {
  const [positions, setPositions] = useState<PositionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const positionService = new PositionService(UserService.getUserId());

  const fetchPositions = async () => {
    try {
      setLoading(true);
      const data = await positionService.getPositions();
      setPositions(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch positions');
    } finally {
      setLoading(false);
    }
  };

  const createPosition = async (input: CreatePositionInput) => {
    try {
      const newPosition = await positionService.createPosition(input);
      setPositions(prev => [newPosition, ...prev]);
      return newPosition;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create position');
      throw err;
    }
  };

  const updatePosition = async (id: string, input: UpdatePositionInput) => {
    try {
      const updated = await positionService.updatePosition(id, input);
      setPositions(prev => prev.map(p => p.id === id ? updated : p));
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update position');
      throw err;
    }
  };

  const deletePosition = async (id: string) => {
    try {
      await positionService.deletePosition(id);
      setPositions(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete position');
      throw err;
    }
  };

  useEffect(() => {
    fetchPositions();
  }, []);

  return {
    positions,
    loading,
    error,
    refetch: fetchPositions,
    createPosition,
    updatePosition,
    deletePosition
  };
}
```

## 错误处理

### 错误类型

```typescript
// types/errors.ts
export enum StorageErrorType {
  NETWORK_ERROR = 'network_error',
  AUTH_ERROR = 'auth_error',
  VALIDATION_ERROR = 'validation_error',
  NOT_FOUND = 'not_found',
  CONFLICT = 'conflict',
  SERVER_ERROR = 'server_error'
}

export class StorageError extends Error {
  constructor(
    public type: StorageErrorType,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'StorageError';
  }
}
```

### 错误处理策略

1. **网络错误**: 自动重试3次，指数退避
2. **认证错误**: 清除用户ID，提示重新登录
3. **验证错误**: 显示具体的验证失败信息
4. **服务器错误**: 降级到本地存储模式

## 测试策略

### 单元测试

- 测试 PositionService 的所有方法
- 测试 UserService 的用户ID生成和存储
- 测试 MigrationService 的数据迁移逻辑

### 集成测试

- 测试完整的 CRUD 流程
- 测试数据迁移流程
- 测试错误处理和重试机制

### 端到端测试

- 测试用户从本地存储迁移到后端的完整流程
- 测试跨设备数据同步
- 测试网络断开和恢复场景

## 部署步骤

### 1. Supabase 设置

1. 注册 Supabase 账号
2. 创建新项目
3. 执行数据库迁移脚本
4. 获取 API URL 和 anon key

### 2. 环境变量配置

```bash
# .env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. 安装依赖

```bash
npm install @supabase/supabase-js uuid
npm install --save-dev @types/uuid
```

### 4. 部署到 Netlify

1. 在 Netlify 控制台添加环境变量
2. 推送代码触发自动部署
3. 验证 API 功能

## 性能优化

### 1. 前端缓存

- 使用 React Query 或 SWR 管理服务器状态
- 实现乐观更新减少等待时间
- 缓存持仓列表，减少不必要的请求

### 2. 批量操作

- 支持批量创建、更新、删除
- 减少 API 调用次数

### 3. 数据库优化

- 为常用查询字段添加索引
- 使用连接池管理数据库连接
- 定期清理过期数据

## 安全考虑

### 1. 数据隔离

- 使用 Row Level Security (RLS) 确保用户只能访问自己的数据
- 在 API 层验证用户ID

### 2. 输入验证

- 验证所有用户输入
- 防止 SQL 注入
- 限制请求频率

### 3. 敏感信息保护

- 数据库连接信息存储在环境变量中
- 不在前端暴露敏感信息
- 使用 HTTPS 加密传输

## 监控和日志

### 1. 错误监控

- 记录所有 API 错误
- 监控数据库性能
- 设置告警阈值

### 2. 使用统计

- 记录 API 调用次数
- 监控响应时间
- 分析用户行为

## 未来扩展

### 1. 多设备同步

- 实现实时数据同步
- 处理数据冲突

### 2. 数据分析

- 统计投资收益趋势
- 生成投资报告

### 3. 社交功能

- 分享投资组合
- 对比收益率

## 总结

本设计提供了一个完整的后端存储方案，使用 Supabase 作为数据库，Netlify Functions 作为 API 层。方案具有以下优点：

- ✅ 可靠的数据持久化
- ✅ 简单的用户认证
- ✅ 平滑的数据迁移
- ✅ 良好的错误处理
- ✅ 优秀的性能
- ✅ 易于维护和扩展
