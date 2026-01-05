# 认证系统部署指南

## 部署前准备

### 1. Supabase 配置

在 Supabase 控制台完成以下配置：

#### 1.1 执行数据库迁移

在 Supabase SQL Editor 中依次执行：

```sql
-- 1. 创建 positions 表
database/migrations/001_create_positions_table.sql

-- 2. 创建 fund_configs 表
database/migrations/002_create_fund_configs_table.sql

-- 3. 添加 A股 支持
database/migrations/003_add_astock_support.sql

-- 4. 启用 RLS 策略（重要！）
database/migrations/004_enable_rls_policies.sql
```

#### 1.2 配置认证设置

在 Supabase 控制台 → Authentication → Settings：

1. **Email Auth**
   - 启用 Email provider
   - 可选：关闭 "Confirm email" 以便测试

2. **Site URL**
   - 设置为你的应用 URL（如 `https://your-app.netlify.app`）

3. **Redirect URLs**
   - 添加允许的重定向 URL
   - 格式：`https://your-app.netlify.app/**`

### 2. 环境变量配置

#### 2.1 本地开发 (`.env`)

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

#### 2.2 Netlify 部署

在 Netlify 控制台 → Site settings → Environment variables 添加：

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

或使用 Netlify CLI：

```bash
netlify env:set VITE_SUPABASE_URL "https://your-project.supabase.co"
netlify env:set VITE_SUPABASE_ANON_KEY "your_anon_key"
```

## 部署步骤

### 1. 构建项目

```bash
npm run build
```

### 2. 部署到 Netlify

```bash
# 使用 Netlify CLI
netlify deploy --prod

# 或推送到 Git（如果配置了自动部署）
git add .
git commit -m "feat: 添加认证系统"
git push origin main
```

### 3. 验证部署

访问你的应用 URL，测试以下功能：

- [ ] 访问首页自动跳转到登录页
- [ ] 注册新用户
- [ ] 登录已有用户
- [ ] 查看投资组合（只能看到自己的数据）
- [ ] 退出登录
- [ ] 忘记密码功能

## 数据迁移

### 从固定用户ID迁移到多用户

如果你之前使用固定用户ID（`ffbce643-c892-4f7d-b4e1-736bdc60b816`），需要：

1. **创建对应的用户账号**

在 Supabase 控制台 → Authentication → Users，手动创建用户：
- Email: 你的邮箱
- Password: 设置密码
- 复制生成的 User ID

2. **更新现有数据的 user_id**

```sql
-- 将旧的固定ID数据关联到新用户
UPDATE positions 
SET user_id = '新用户的UUID'
WHERE user_id = 'ffbce643-c892-4f7d-b4e1-736bdc60b816';

UPDATE fund_configs 
SET user_id = '新用户的UUID'
WHERE user_id = 'ffbce643-c892-4f7d-b4e1-736bdc60b816';
```

## 故障排查

### 问题 1: 登录后看不到数据

**原因**: RLS 策略未正确配置

**解决方案**:
```sql
-- 检查 RLS 是否启用
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('positions', 'fund_configs');

-- 检查策略是否存在
SELECT * FROM pg_policies 
WHERE tablename IN ('positions', 'fund_configs');
```

### 问题 2: 注册后无法登录

**原因**: Supabase 要求邮箱验证

**解决方案**:
1. 在 Supabase 控制台关闭邮箱验证
2. 或在测试邮箱中点击验证链接

### 问题 3: 环境变量未生效

**原因**: Netlify 环境变量未正确配置

**解决方案**:
```bash
# 检查环境变量
netlify env:list

# 重新部署
netlify deploy --prod
```

### 问题 4: CORS 错误

**原因**: Supabase URL 配置不正确

**解决方案**:
1. 检查 `.env` 文件中的 URL
2. 确保 Supabase 项目未暂停
3. 检查 Supabase 控制台的 API 设置

## 安全建议

1. **不要提交 `.env` 文件到 Git**
   - 已在 `.gitignore` 中配置

2. **定期轮换 API 密钥**
   - 在 Supabase 控制台可以重新生成

3. **启用 RLS**
   - 确保所有表都启用了 RLS
   - 测试不同用户的数据隔离

4. **配置密码策略**
   - 在 Supabase 控制台设置密码强度要求

5. **监控认证日志**
   - 在 Supabase 控制台查看登录活动

## 测试清单

部署后测试以下场景：

- [ ] 新用户注册
- [ ] 用户登录
- [ ] 用户登出
- [ ] 忘记密码
- [ ] 添加持仓（只能看到自己的）
- [ ] 添加基金配置（只能看到自己的）
- [ ] 多个用户数据隔离
- [ ] 未登录访问受保护页面
- [ ] 登录后返回原页面
- [ ] 会话持久化（刷新页面仍保持登录）

## 回滚方案

如果认证系统出现问题，可以临时回滚：

1. **禁用路由保护**
   - 在 `App.tsx` 中移除 `<ProtectedRoute>` 包裹

2. **使用固定用户ID**
   - 在 `AuthContext.tsx` 中硬编码用户ID

3. **禁用 RLS**
   ```sql
   ALTER TABLE positions DISABLE ROW LEVEL SECURITY;
   ALTER TABLE fund_configs DISABLE ROW LEVEL SECURITY;
   ```

## 支持

如有问题，请查看：
- [Supabase 文档](https://supabase.com/docs)
- [Netlify 文档](https://docs.netlify.com)
- 项目 `AUTH_SYSTEM.md` 文件
