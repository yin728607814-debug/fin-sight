# 认证系统说明

## 概述

本应用已集成 Supabase Auth 认证系统，支持用户注册、登录、登出和密码重置功能。

## 功能特性

### ✅ 已实现功能

1. **用户注册** (`/register`)
   - 邮箱 + 密码注册
   - 密码确认验证
   - 自动登录并跳转

2. **用户登录** (`/login`)
   - 邮箱 + 密码登录
   - 错误提示（中文）
   - 登录后跳转到首页

3. **忘记密码** (`/forgot-password`)
   - 发送密码重置邮件
   - 邮件链接重置密码

4. **路由保护**
   - 所有主要页面需要登录才能访问
   - 未登录自动跳转到登录页
   - 登录后返回原页面

5. **用户菜单**
   - 显示当前用户邮箱
   - 退出登录功能
   - 集成在所有页面的 Header 中

6. **数据隔离**
   - 每个用户只能看到自己的数据
   - 使用 Supabase RLS (Row Level Security)
   - 自动过滤 user_id

## 文件结构

```
services/
  ├── authService.ts          # 认证服务（登录、注册、登出）
  └── userService.ts          # 用户服务（获取用户ID）

utils/
  └── AuthContext.tsx         # 认证上下文（全局状态管理）

components/
  ├── ProtectedRoute.tsx      # 路由保护组件
  └── AppHeader.tsx           # 应用头部（含用户菜单）

pages/
  ├── LoginPage.tsx           # 登录页面
  ├── RegisterPage.tsx        # 注册页面
  └── ForgotPasswordPage.tsx  # 忘记密码页面

database/migrations/
  └── 004_enable_rls_policies.sql  # RLS 策略
```

## 使用方法

### 1. 数据库配置

在 Supabase 控制台执行 RLS 策略：

```bash
# 在 Supabase SQL Editor 中执行
database/migrations/004_enable_rls_policies.sql
```

### 2. 环境变量

确保 `.env` 文件包含 Supabase 配置：

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. 在组件中使用认证

```typescript
import { useAuth } from '../utils/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <div>
      {isAuthenticated && (
        <p>欢迎, {user?.email}</p>
      )}
      <button onClick={logout}>退出</button>
    </div>
  );
}
```

### 4. 保护路由

在 `App.tsx` 中，所有需要登录的路由都已用 `ProtectedRoute` 包裹：

```typescript
<Route 
  path="/portfolio" 
  element={
    <ProtectedRoute>
      <PortfolioPage />
    </ProtectedRoute>
  } 
/>
```

### 5. 使用 AppHeader 组件

在页面中使用统一的 Header 组件：

```typescript
import { AppHeader } from '../components/AppHeader';

<AppHeader
  title="页面标题"
  icon={<YourIcon />}
  badge="可选徽章"
  actions={<YourActions />}
/>
```

## 数据访问

### 自动用户ID注入

所有数据服务（`positionService`, `fundConfigService`）会自动使用当前登录用户的ID：

```typescript
// 不需要手动传递 userId
const positions = await positionService.getPositions();
const configs = await fundConfigService.getAllConfigs();
```

### RLS 策略

数据库层面的安全策略确保：
- 用户只能查询自己的数据
- 用户只能修改自己的数据
- 用户只能删除自己的数据

## 错误处理

所有认证错误都已翻译成中文：

- `Invalid login credentials` → "邮箱或密码错误"
- `Email not confirmed` → "请先验证邮箱"
- `User already registered` → "该邮箱已被注册"
- 等等...

## 测试账号

可以在 Supabase 控制台的 Authentication 页面创建测试用户，或直接通过注册页面注册。

## 注意事项

1. **邮箱验证**：Supabase 默认需要邮箱验证，可以在 Supabase 控制台关闭
2. **密码要求**：最少 6 个字符
3. **会话持久化**：登录状态会保存在浏览器中
4. **自动刷新**：Token 会自动刷新，无需手动处理

## 下一步优化

- [ ] 添加社交登录（Google, GitHub 等）
- [ ] 添加用户资料编辑页面
- [ ] 添加邮箱验证提醒
- [ ] 添加记住我功能
- [ ] 添加登录历史记录
