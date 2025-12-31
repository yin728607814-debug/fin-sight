# 清除 localStorage 数据

## 问题

页面报错：`TypeError: u.getTime is not a function`

这是因为 localStorage 中存储了旧格式的数据，其中 `timestamp` 字段的类型不兼容。

## 解决方案

### 方法 1：浏览器控制台清除（推荐）⭐

1. 打开浏览器开发者工具（F12）
2. 切换到 **Console** 标签
3. 输入以下命令并按回车：

```javascript
localStorage.clear();
location.reload();
```

这会清除所有 localStorage 数据并刷新页面。

### 方法 2：只清除相关数据

如果您不想清除所有数据，可以只清除问题数据：

```javascript
// 清除情绪历史数据
localStorage.removeItem('sentiment-history');

// 清除应用状态数据
localStorage.removeItem('investment-news-analyzer-state');

// 刷新页面
location.reload();
```

### 方法 3：浏览器设置清除

#### Chrome/Edge
1. 按 `F12` 打开开发者工具
2. 切换到 **Application** 标签
3. 左侧找到 **Local Storage**
4. 点击您的网站域名
5. 右键点击 → **Clear**

#### Firefox
1. 按 `F12` 打开开发者工具
2. 切换到 **Storage** 标签
3. 左侧找到 **Local Storage**
4. 点击您的网站域名
5. 右键点击 → **Delete All**

## 为什么需要清除？

### 数据格式变化

**旧格式**（导致错误）：
```json
{
  "timestamp": "2025-12-31T10:00:00.000Z"  // 字符串
}
```

**新格式**（兼容）：
```typescript
{
  timestamp: Date | string  // 支持两种类型
}
```

但是旧的代码可能尝试对字符串调用 `.getTime()` 方法，导致错误。

### 清除后会怎样？

- ✅ 错误消失
- ✅ 页面正常加载
- ❌ 历史数据丢失（情绪历史、新闻缓存等）
- ✅ 重新访问页面会生成新数据

## 验证清除成功

清除后，在控制台输入：

```javascript
console.log('localStorage 大小:', Object.keys(localStorage).length);
```

应该显示 `0` 或很小的数字。

## 完整的修复流程

### 步骤 1：清除 localStorage
```javascript
localStorage.clear();
```

### 步骤 2：强制刷新浏览器
- Windows/Linux: `Ctrl + Shift + R`
- Mac: `Cmd + Shift + R`

### 步骤 3：等待 Netlify 部署完成
- 访问：https://app.netlify.com/
- 查看部署状态
- 等待变为 **Published**

### 步骤 4：再次强制刷新
- 确保加载最新的代码

### 步骤 5：重新加载数据
- 访问纳斯达克页面
- 点击"刷新新闻"
- 等待数据加载完成

## 预防措施

### 版本控制

在 localStorage 中添加版本号：

```typescript
const STORAGE_VERSION = '2.0';

// 保存时
localStorage.setItem('version', STORAGE_VERSION);

// 加载时检查
const storedVersion = localStorage.getItem('version');
if (storedVersion !== STORAGE_VERSION) {
  // 版本不匹配，清除旧数据
  localStorage.clear();
  localStorage.setItem('version', STORAGE_VERSION);
}
```

### 数据迁移

而不是直接清除，可以迁移旧数据：

```typescript
function migrateData() {
  const oldData = localStorage.getItem('old-key');
  if (oldData) {
    const parsed = JSON.parse(oldData);
    // 转换格式
    const newData = {
      ...parsed,
      timestamp: new Date(parsed.timestamp)
    };
    localStorage.setItem('new-key', JSON.stringify(newData));
    localStorage.removeItem('old-key');
  }
}
```

## 常见问题

### Q: 清除后数据会丢失吗？

**A**: 是的，但这些数据可以重新生成：
- 新闻：重新获取
- AI分析：重新分析
- 情绪历史：重新记录
- 投资组合：需要重新添加（如果有）

### Q: 能否只清除有问题的数据？

**A**: 可以，使用：
```javascript
localStorage.removeItem('sentiment-history');
localStorage.removeItem('investment-news-analyzer-state');
```

### Q: 清除后还是报错怎么办？

**A**: 可能是：
1. 浏览器缓存问题 → 强制刷新
2. Netlify 还没部署新代码 → 等待部署
3. 其他地方也有类似问题 → 查看控制台错误

## 快速命令

复制以下命令到浏览器控制台：

```javascript
// 完整清除并刷新
localStorage.clear();
console.log('✅ localStorage 已清除');
location.reload();
```

或者只清除相关数据：

```javascript
// 只清除问题数据
['sentiment-history', 'investment-news-analyzer-state'].forEach(key => {
  localStorage.removeItem(key);
  console.log('✅ 已清除:', key);
});
location.reload();
```

---

**立即执行**：打开浏览器控制台（F12），输入 `localStorage.clear(); location.reload();` 并按回车！
