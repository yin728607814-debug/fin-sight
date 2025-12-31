# localStorage 调试指南

## 如何检查 localStorage 中的数据

### 方法 1：浏览器开发者工具

1. 打开浏览器开发者工具（F12）
2. 切换到 **Application** 标签（Chrome）或 **Storage** 标签（Firefox）
3. 左侧找到 **Local Storage**
4. 点击你的网站域名
5. 查找 `investment-news-analyzer-state` 键

### 方法 2：控制台命令

在浏览器控制台（Console）中输入：

```javascript
// 查看完整的持久化数据
const data = JSON.parse(localStorage.getItem('investment-news-analyzer-state'));
console.log('持久化数据:', data);

// 查看新闻数量
console.log('纳斯达克新闻数量:', data?.news?.nasdaq?.length || 0);
console.log('黄金新闻数量:', data?.news?.gold?.length || 0);

// 查看分析数量
console.log('纳斯达克分析数量:', data?.analysis?.nasdaq?.length || 0);
console.log('黄金分析数量:', data?.analysis?.gold?.length || 0);

// 查看数据时间戳
if (data?.timestamp) {
  const date = new Date(data.timestamp);
  const hoursAgo = (Date.now() - data.timestamp) / (1000 * 60 * 60);
  console.log('数据保存时间:', date.toLocaleString());
  console.log('距今小时数:', hoursAgo.toFixed(1));
  console.log('是否过期（>24h）:', hoursAgo > 24);
}

// 查看版本
console.log('数据版本:', data?.version);
```

### 方法 3：清除数据重新测试

如果数据有问题，可以清除后重新测试：

```javascript
// 清除持久化数据
localStorage.removeItem('investment-news-analyzer-state');
console.log('已清除持久化数据');

// 刷新页面
location.reload();
```

## 测试流程

### 完整测试步骤

1. **清除旧数据**
   ```javascript
   localStorage.removeItem('investment-news-analyzer-state');
   location.reload();
   ```

2. **访问纳斯达克页面**
   - 点击"纳斯达克100"
   - 等待新闻加载完成
   - 等待AI分析完成

3. **检查数据是否保存**
   ```javascript
   const data = JSON.parse(localStorage.getItem('investment-news-analyzer-state'));
   console.log('新闻数量:', data?.news?.nasdaq?.length);
   console.log('分析数量:', data?.analysis?.nasdaq?.length);
   ```

4. **访问仪表盘**
   - 点击"智能仪表盘"
   - 查看情绪指数卡片
   - 应该显示情绪分数

5. **刷新页面测试**
   - 按 F5 刷新页面
   - 情绪指数应该保持显示

## 常见问题

### Q1: 为什么情绪指数没数据？

**可能原因：**
1. 还没有访问过纳斯达克页面
2. 新闻加载失败
3. AI分析失败
4. localStorage 被清除
5. 数据已过期（>24小时）

**解决方法：**
1. 访问纳斯达克页面
2. 等待新闻加载完成（看到新闻列表）
3. 等待AI分析完成（看到情绪指数）
4. 再访问仪表盘

### Q2: 数据什么时候会过期？

- 数据保存后 **24小时** 自动过期
- 过期后需要重新访问页面加载数据

### Q3: 如何强制刷新数据？

在纳斯达克或黄金页面：
1. 点击页面上的"刷新"按钮
2. 或者清除 localStorage 后刷新页面

### Q4: 数据占用多少空间？

```javascript
// 查看数据大小
const data = localStorage.getItem('investment-news-analyzer-state');
const sizeKB = (data?.length || 0) / 1024;
console.log('数据大小:', sizeKB.toFixed(2), 'KB');
```

通常约 400KB，远小于 localStorage 的 5-10MB 限制。

## 调试代码片段

### 完整调试脚本

```javascript
// 复制这段代码到浏览器控制台运行

console.log('=== localStorage 调试信息 ===');

const key = 'investment-news-analyzer-state';
const raw = localStorage.getItem(key);

if (!raw) {
  console.log('❌ 没有找到持久化数据');
  console.log('💡 请先访问纳斯达克或黄金页面加载数据');
} else {
  try {
    const data = JSON.parse(raw);
    
    console.log('✅ 找到持久化数据');
    console.log('📦 数据大小:', (raw.length / 1024).toFixed(2), 'KB');
    console.log('🔢 版本:', data.version);
    
    if (data.timestamp) {
      const date = new Date(data.timestamp);
      const hoursAgo = (Date.now() - data.timestamp) / (1000 * 60 * 60);
      console.log('⏰ 保存时间:', date.toLocaleString());
      console.log('⌛ 距今:', hoursAgo.toFixed(1), '小时');
      console.log(hoursAgo > 24 ? '⚠️ 数据已过期' : '✅ 数据未过期');
    }
    
    console.log('\n📰 新闻数据:');
    console.log('  纳斯达克:', data.news?.nasdaq?.length || 0, '条');
    console.log('  黄金:', data.news?.gold?.length || 0, '条');
    
    console.log('\n🤖 AI分析:');
    console.log('  纳斯达克:', data.analysis?.nasdaq?.length || 0, '条');
    console.log('  黄金:', data.analysis?.gold?.length || 0, '条');
    
    console.log('\n📊 整体分析:');
    console.log('  纳斯达克:', data.overallAnalysis?.nasdaq ? '✅' : '❌');
    console.log('  黄金:', data.overallAnalysis?.gold ? '✅' : '❌');
    
    console.log('\n💹 价格数据:');
    console.log('  纳斯达克:', data.priceData?.nasdaq?.length || 0, '条');
    console.log('  黄金:', data.priceData?.gold?.length || 0, '条');
    
    // 检查情绪指数所需数据
    const nasdaqAnalysis = data.analysis?.nasdaq || [];
    if (nasdaqAnalysis.length > 0) {
      console.log('\n✅ 纳斯达克情绪指数应该可以显示');
    } else {
      console.log('\n❌ 纳斯达克没有分析数据，情绪指数无法显示');
      console.log('💡 请访问纳斯达克页面加载新闻并等待AI分析完成');
    }
    
  } catch (error) {
    console.error('❌ 解析数据失败:', error);
    console.log('💡 数据可能已损坏，建议清除后重新加载');
  }
}

console.log('\n=== 调试完成 ===');
```

## 快速修复命令

### 清除所有数据重新开始

```javascript
// 清除所有相关数据
localStorage.removeItem('investment-news-analyzer-state');
localStorage.removeItem('dashboard_layouts');
localStorage.removeItem('dashboard_current_layout');
localStorage.removeItem('portfolio_positions');
console.log('✅ 已清除所有数据');
location.reload();
```

### 只清除新闻数据

```javascript
const data = JSON.parse(localStorage.getItem('investment-news-analyzer-state'));
if (data) {
  data.news = { gold: [], nasdaq: [] };
  data.analysis = { gold: [], nasdaq: [] };
  data.overallAnalysis = { gold: null, nasdaq: null };
  data.timestamp = Date.now();
  localStorage.setItem('investment-news-analyzer-state', JSON.stringify(data));
  console.log('✅ 已清除新闻和分析数据');
  location.reload();
}
```

---

**使用建议：**
1. 先运行完整调试脚本查看当前状态
2. 如果没有数据，访问纳斯达克页面加载
3. 如果数据有问题，清除后重新加载
4. 如果还有问题，查看浏览器控制台的错误信息
