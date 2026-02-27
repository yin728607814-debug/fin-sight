# AI 聊天功能数据库迁移指南

## 概述
AI 聊天功能已从 localStorage 迁移到 Supabase 数据库，支持：
- 按资产类型（黄金/纳斯达克/A股）分别存储聊天记录
- 按用户隔离，每个用户只能看到自己的聊天记录
- 云端持久化，跨设备同步

## 数据库迁移步骤

### 1. 登录 Supabase Dashboard
访问 https://supabase.com/dashboard

### 2. 选择项目
选择你的 FinSight 项目

### 3. 执行迁移脚本
1. 点击左侧菜单的 **SQL Editor**
2. 点击 **New Query**
3. 复制 `database/migrations/010_create_chat_messages.sql` 的内容
4. 粘贴到 SQL 编辑器
5. 点击 **Run** 执行

### 4. 验证表创建
1. 点击左侧菜单的 **Table Editor**
2. 确认 `chat_messages` 表已创建
3. 检查表结构：
   - `id` (uuid, primary key)
   - `user_id` (varchar, 用户ID)
   - `asset_type` (varchar, 资产类型: nasdaq/gold/astock)
   - `role` (varchar, 角色: user/assistant)
   - `content` (text, 消息内容)
   - `context` (jsonb, 上下文信息)
   - `created_at` (timestamp)
   - `updated_at` (timestamp)

### 5. 验证 RLS 策略
1. 在 Table Editor 中选择 `chat_messages` 表
2. 点击 **RLS** 标签
3. 确认以下策略已创建：
   - Users can view own chat messages (SELECT)
   - Users can insert own chat messages (INSERT)
   - Users can delete own chat messages (DELETE)

## 功能说明

### 按资产类型分离
- 纳斯达克的聊天记录独立存储
- 黄金的聊天记录独立存储
- A股的聊天记录独立存储
- 切换资产类型时自动加载对应的历史记录

### 用户隔离
- 每个用户只能查看、创建、删除自己的聊天记录
- 通过 RLS 策略在数据库层面强制隔离
- 管理员可以查看所有记录（用于调试）

### 数据保留
- 聊天记录保留 30 天
- 每个资产类型最多保存 50 条消息
- 超过限制的旧消息会被自动清理

## 测试验证

### 1. 测试聊天功能
1. 登录应用
2. 访问 AI 投资顾问页面
3. 选择纳斯达克，发送消息
4. 切换到黄金，发送消息
5. 再切换回纳斯达克，确认之前的消息还在

### 2. 测试用户隔离
1. 使用账号 A 登录，发送消息
2. 退出登录
3. 使用账号 B 登录
4. 确认看不到账号 A 的消息

### 3. 测试清空功能
1. 在某个资产类型下发送消息
2. 点击"清空"按钮
3. 确认该资产类型的消息被清空
4. 切换到其他资产类型，确认其他消息未受影响

## 故障排除

### 问题：聊天记录无法保存
**可能原因**：
- 用户未登录
- RLS 策略配置错误
- 数据库连接问题

**解决方案**：
1. 确认用户已登录
2. 检查浏览器控制台错误信息
3. 在 Supabase Dashboard 检查 RLS 策略
4. 验证 Supabase 连接配置

### 问题：看到其他用户的消息
**可能原因**：
- RLS 策略未启用
- 使用管理员账号登录

**解决方案**：
1. 确认 RLS 已启用：`ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;`
2. 检查是否使用了 service_role key（管理员密钥）
3. 确认使用的是 anon key

### 问题：切换资产类型后消息混乱
**可能原因**：
- 前端缓存问题
- asset_type 字段值不正确

**解决方案**：
1. 清除浏览器缓存
2. 检查数据库中 asset_type 字段的值
3. 确认前端传递的 assetType 参数正确

## 数据迁移（可选）

如果需要将旧的 localStorage 数据迁移到 Supabase：

1. 打开浏览器开发者工具
2. 在 Console 中运行以下代码：

```javascript
// 获取旧数据
const oldData = localStorage.getItem('chat_history');
if (oldData) {
  const parsed = JSON.parse(oldData);
  console.log('旧聊天记录:', parsed);
  // 手动将数据导入到新系统
}
```

注意：由于旧数据没有 asset_type 字段，需要手动指定资产类型。

## 相关文件

- 迁移脚本：`database/migrations/010_create_chat_messages.sql`
- 服务实现：`services/chatService.ts`
- UI 组件：`components/ChatWindow.tsx`
- 页面组件：`pages/AIChatPage.tsx`
