# 新闻和AI分析数据持久化

## 实现日期
2025-12-31

## 需求背景

用户反馈两个问题：
1. **情绪指数没数据**：即使纳斯达克页面已经加载了新闻，仪表盘的情绪指数仍然显示"暂无数据"
2. **数据不持久化**：每次刷新页面都需要重新加载新闻和AI分析，浪费API配额

## 解决方案

### ✅ 前端持久化（已实现）

使用 **localStorage** 持久化所有新闻和分析数据，无需后端支持。

## 实现细节

### 1. 持久化的数据

```typescript
interface PersistableState {
  currentAsset: AssetType;           // 当前选择的资产
  news: {                            // 新闻数据
    gold: NewsItem[];
    nasdaq: NewsItem[];
  };
  analysis: {                        // AI分析数据
    gold: NewsAnalysis[];
    nasdaq: NewsAnalysis[];
  };
  overallAnalysis: {                 // 整体市场分析
    gold: OverallMarketAnalysis | null;
    nasdaq: OverallMarketAnalysis | null;
  };
  priceData: {                       // 价格数据
    gold: PriceData[];
    nasdaq: PriceData[];
  };
  timestamp: number;                 // 数据保存时间戳
  version: string;                   // 版本号
}
```

### 2. 数据过期机制

```typescript
// 数据过期时间：24小时
const DATA_EXPIRATION_MS = 24 * 60 * 60 * 1000;

// 加载时检查是否过期
const isExpired = stored.timestamp && (now - stored.timestamp > DATA_EXPIRATION_MS);

if (isExpired) {
  console.log('持久化数据已过期，使用初始状态');
  return { currentAsset: stored.currentAsset };
}
```

**过期策略**：
- ✅ 数据保存时记录时间戳
- ✅ 加载时检查是否超过24小时
- ✅ 过期数据自动清除，只保留 `currentAsset`
- ✅ 用户可以手动点击"刷新"重新加载

### 3. 防抖优化

```typescript
// 使用防抖避免频繁保存
useEffect(() => {
  if (!enablePersistence) return;
  
  const timeoutId = setTimeout(() => {
    savePersistedState(state);
  }, 500); // 500ms 防抖
  
  return () => clearTimeout(timeoutId);
}, [state, enablePersistence]);
```

**优化效果**：
- ✅ 避免每次状态变化都保存
- ✅ 减少 localStorage 写入次数
- ✅ 提升性能

### 4. 错误处理

```typescript
try {
  setLocalStorage(STORAGE_KEY, persistableState);
} catch (error) {
  console.warn('保存持久化状态失败:', error);
  
  // 如果存储失败（可能是数据太大），尝试只保存关键数据
  try {
    const minimalState = {
      currentAsset: state.currentAsset,
      timestamp: Date.now(),
      version: STORAGE_VERSION
    };
    setLocalStorage(STORAGE_KEY, minimalState);
  } catch (fallbackError) {
    console.error('保存最小化状态也失败:', fallbackError);
  }
}
```

**降级策略**：
1. 尝试保存完整数据
2. 如果失败（数据太大），只保存 `currentAsset`
3. 如果还失败，记录错误但不影响应用运行

## 工作流程

### 首次访问
```
1. 用户访问纳斯达克页面
2. 加载新闻 → 保存到 Context
3. AI分析新闻 → 保存到 Context
4. Context 自动保存到 localStorage ✓
```

### 刷新页面
```
1. 页面加载
2. Context 从 localStorage 读取数据
3. 检查数据是否过期
4. 如果未过期 → 直接使用缓存数据 ✓
5. 如果过期 → 使用空数据，等待用户刷新
```

### 切换页面
```
1. 用户从纳斯达克页面切换到仪表盘
2. 仪表盘从 Context 读取数据
3. 情绪指数卡片显示分析结果 ✓
```

### 数据过期
```
1. 24小时后数据过期
2. 用户访问页面 → 显示"数据已过期"
3. 用户点击"刷新" → 重新加载数据
4. 新数据保存到 localStorage ✓
```

## localStorage 容量

### 容量限制
- **Chrome/Edge**: 10MB
- **Firefox**: 10MB
- **Safari**: 5MB

### 数据大小估算
```javascript
// 单条新闻约 1KB
// 50条新闻 = 50KB
// 纳斯达克 + 黄金 = 100KB

// 单条分析约 2KB
// 50条分析 = 100KB
// 纳斯达克 + 黄金 = 200KB

// 价格数据（30天）约 50KB
// 纳斯达克 + 黄金 = 100KB

// 总计：约 400KB
```

**结论**：数据量远小于 localStorage 限制，完全够用 ✓

## 优势

### ✅ 前端持久化的优点

1. **无需后端**
   - 不需要数据库
   - 不需要API接口
   - 降低系统复杂度

2. **即时响应**
   - 无网络延迟
   - 离线可用
   - 用户体验好

3. **节省API配额**
   - 避免重复请求
   - 减少API调用次数
   - 降低成本

4. **隐私保护**
   - 数据存储在用户本地
   - 不上传到服务器
   - 更安全

5. **零成本**
   - 无需服务器
   - 无需数据库
   - 无需维护

### ⚠️ 限制

1. **不跨设备**
   - 每个浏览器独立存储
   - 不同设备不同步

2. **可被清除**
   - 用户清除浏览器数据会丢失
   - 隐私模式不持久化

3. **容量限制**
   - 5-10MB 限制
   - 但对我们的数据量足够

## 测试验证

### 测试场景 1：新闻持久化
1. ✅ 访问纳斯达克页面
2. ✅ 加载新闻
3. ✅ 刷新页面 → 新闻保持 ✓
4. ✅ 关闭浏览器重新打开 → 新闻保持 ✓

### 测试场景 2：AI分析持久化
1. ✅ 访问纳斯达克页面
2. ✅ AI分析新闻
3. ✅ 刷新页面 → 分析结果保持 ✓
4. ✅ 访问仪表盘 → 情绪指数显示 ✓

### 测试场景 3：数据过期
1. ✅ 加载数据
2. ✅ 修改时间戳为25小时前
3. ✅ 刷新页面 → 数据被清除 ✓
4. ✅ 显示"数据已过期"提示 ✓

### 测试场景 4：跨页面数据共享
1. ✅ 在纳斯达克页面加载数据
2. ✅ 切换到仪表盘 → 情绪指数显示 ✓
3. ✅ 切换到黄金页面 → 数据保持 ✓
4. ✅ 返回纳斯达克 → 数据保持 ✓

### 构建测试
```bash
npm run build
✓ built in 3.81s
```

## 与后端方案对比

| 特性 | 前端 localStorage | 后端数据库 |
|------|------------------|-----------|
| 实现复杂度 | ⭐ 简单 | ⭐⭐⭐ 复杂 |
| 开发时间 | 1小时 | 1-2天 |
| 响应速度 | ⚡ 即时 | 🐌 网络延迟 |
| 跨设备同步 | ❌ 不支持 | ✅ 支持 |
| 离线可用 | ✅ 支持 | ❌ 不支持 |
| 成本 | 💰 免费 | 💰💰 需要服务器 |
| 维护成本 | 💰 零 | 💰💰 需要维护 |
| 数据安全 | ✅ 本地存储 | ⚠️ 需要加密 |
| 适用场景 | 个人使用 | 团队协作 |

## 建议

### 当前方案（前端持久化）适用于：
- ✅ 个人使用
- ✅ 单设备使用
- ✅ 快速开发
- ✅ 零成本运营

### 如果未来需要：
- 跨设备同步 → 考虑后端方案
- 团队协作 → 考虑后端方案
- 数据分析 → 考虑后端方案
- 用户管理 → 考虑后端方案

## 后续优化（可选）

### 优化 1：数据压缩
```typescript
// 使用 LZ-String 压缩数据
import LZString from 'lz-string';

const compressed = LZString.compress(JSON.stringify(data));
localStorage.setItem(key, compressed);

const decompressed = LZString.decompress(localStorage.getItem(key));
const data = JSON.parse(decompressed);
```

### 优化 2：IndexedDB
```typescript
// 如果数据量很大，使用 IndexedDB
import { openDB } from 'idb';

const db = await openDB('news-db', 1, {
  upgrade(db) {
    db.createObjectStore('news');
  }
});

await db.put('news', data, 'nasdaq');
const data = await db.get('news', 'nasdaq');
```

### 优化 3：导出/导入
```typescript
// 允许用户导出数据到文件
export function exportData() {
  const data = localStorage.getItem(STORAGE_KEY);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  // 下载文件
}

// 允许用户导入数据
export function importData(file: File) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const data = e.target.result;
    localStorage.setItem(STORAGE_KEY, data);
  };
  reader.readAsText(file);
}
```

## 修改的文件

- `utils/context.tsx` - 添加新闻和分析数据持久化

## 影响范围

- 所有使用 Context 的页面都会受益
- 不影响现有功能
- 向后兼容

---

## 实现完成 ✅

现在新闻和AI分析数据会自动持久化到 localStorage，刷新页面或重新部署都不会丢失！

**数据保留时间**：24小时
**存储位置**：浏览器 localStorage
**容量限制**：5-10MB（足够使用）
**过期策略**：自动清除过期数据
