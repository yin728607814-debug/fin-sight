# 🧹 清除旧数据脚本

## 问题说明

如果你在部署后仍然看到 `TypeError: u.getTime is not a function` 错误，这是因为浏览器的 localStorage 中还保存着旧格式的数据。

## 解决方案

### 方法 1：在浏览器控制台执行清理脚本（推荐）

1. 打开浏览器开发者工具（按 F12）
2. 切换到 "Console"（控制台）标签
3. 复制并粘贴以下代码，然后按回车：

```javascript
// 🧹 清除所有旧的分析数据
console.log('🔄 开始清除旧数据...');

// 1. 清除情绪历史（包含旧的 timestamp 格式）
localStorage.removeItem('sentiment-history');
console.log('✅ 已清除 sentiment-history');

// 2. 清除应用状态中的分析数据
const appStateKey = 'investment-news-analyzer-state';
const appState = localStorage.getItem(appStateKey);
if (appState) {
  try {
    const parsed = JSON.parse(appState);
    // 只清除分析数据，保留其他设置
    parsed.analysis = { gold: [], nasdaq: [] };
    parsed.overallAnalysis = { gold: null, nasdaq: null };
    parsed.version = '2.2';
    localStorage.setItem(appStateKey, JSON.stringify(parsed));
    console.log('✅ 已清除应用状态中的分析数据');
  } catch (e) {
    localStorage.removeItem(appStateKey);
    console.log('✅ 已完全清除应用状态');
  }
}

// 3. 清除聊天历史（可能包含旧的 timestamp）
localStorage.removeItem('chat_history');
console.log('✅ 已清除聊天历史');

// 4. 设置迁移版本
localStorage.setItem('data-migration-version', '2.2');
console.log('✅ 已设置迁移版本为 2.2');

console.log('🎉 清除完成！刷新页面...');
setTimeout(() => location.reload(), 1000);
```

### 方法 2：硬刷新（简单但可能不彻底）

按以下组合键：
- **Windows/Linux**: `Ctrl + Shift + R`
- **Mac**: `Cmd + Shift + R`

### 方法 3：清除浏览器缓存

1. 打开开发者工具（F12）
2. 右键点击浏览器刷新按钮
3. 选择 "清空缓存并硬性重新加载"

## 验证修复

清除数据并刷新后，你应该看到：
- ✅ 页面正常加载
- ✅ 没有 `getTime is not a function` 错误
- ✅ 情绪指数正常显示
- ✅ 所有功能正常工作

## 为什么会出现这个问题？

之前的代码创建了 `Date` 对象并存储到 localStorage：
```javascript
timestamp: new Date()  // ❌ Date 对象
```

当 `JSON.stringify()` 序列化时，Date 对象被转换为字符串。但代码期望的是 Date 对象，所以调用 `.getTime()` 时报错。

现在的代码直接使用 ISO 字符串：
```javascript
timestamp: new Date().toISOString()  // ✅ 字符串
```

但旧数据仍然在 localStorage 中，所以需要清除。

## 注意事项

清除数据后：
- ✅ 保留：主题设置、仪表盘布局、投资组合数据
- ❌ 清除：情绪历史、分析结果、聊天记录

这些被清除的数据会在你重新使用应用时自动生成。
