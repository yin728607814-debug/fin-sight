# 价格数据修复说明

## 问题描述
趋势图显示的是演示数据，而不是从API获取的真实价格数据。

## 修复内容

### 1. 移除演示数据回退逻辑
**文件**: `services/priceService.ts`

**修改内容**:
- 移除了当API调用失败时回退到 `generateDemoPriceData()` 的逻辑
- 现在当API失败时会抛出错误，而不是静默使用演示数据
- 这确保了只有真实数据才会被显示

**修改位置**:
1. `fetchPriceHistory()` 方法的 catch 块
2. `getCurrentPrice()` 方法的 catch 块

### 2. 创建缓存清理工具
**文件**: `public/clear-price-cache.html`

**功能**:
- 检测并显示所有价格相关的缓存
- 一键清除所有价格数据缓存
- 清除后自动刷新页面以获取最新数据

**使用方法**:
访问 `/clear-price-cache.html` 并点击"清除所有价格缓存"按钮

### 3. 创建API测试工具
**文件**: `public/test-price-api.html`

**功能**:
- 测试黄金价格API (Investing.com)
- 测试纳斯达克100API (Yahoo Finance)
- 测试上证指数API (Sina Finance)
- 显示详细的API响应数据

**使用方法**:
访问 `/test-price-api.html` 并点击对应的测试按钮

## 数据流程

```
页面加载
  ↓
NewsAnalyzer 组件挂载
  ↓
调用 fetchAndAnalyze()
  ↓
并行调用 fetchNews() 和 fetchPriceData()
  ↓
fetchPriceData() 调用 priceService.fetchFiveDayPriceHistory()
  ↓
根据资产类型调用对应的 Netlify Function:
  - 黄金: /.netlify/functions/investing-proxy
  - 纳斯达克: /.netlify/functions/yahoo-finance-proxy
  - A股: /.netlify/functions/sina-stock-proxy
  ↓
获取真实API数据
  ↓
转换为标准格式
  ↓
设置到 Context 状态
  ↓
TrendChart 组件显示数据
```

## API配置

### 黄金价格
- **数据源**: Yahoo Finance Gold Futures (GC=F)
- **调整**: 期货价格调整为现货价格 (×0.9973)
- **端点**: `/.netlify/functions/investing-proxy`
- **参数**: `symbol=gold&range=5d`

### 纳斯达克100
- **数据源**: Yahoo Finance
- **符号**: ^NDX
- **端点**: `/.netlify/functions/yahoo-finance-proxy`
- **参数**: `symbol=nasdaq&range=5d&interval=1d`

### 上证指数
- **数据源**: 新浪财经
- **符号**: sh000001
- **端点**: `/.netlify/functions/sina-stock-proxy`
- **参数**: `symbol=sh000001&range=5d`

## 验证步骤

1. **清除缓存**:
   ```
   访问 /clear-price-cache.html
   点击"清除所有价格缓存"
   ```

2. **测试API**:
   ```
   访问 /test-price-api.html
   点击"测试所有API"
   确认所有API返回 ✅ 成功状态
   ```

3. **验证页面**:
   ```
   访问 /gold 或 /nasdaq 或 /astock
   检查趋势图是否显示真实价格
   查看数据来源信息（图表底部）
   确认显示"真实数据"而不是"模拟数据"
   ```

## 错误处理

如果API调用失败，现在会:
1. 在控制台显示详细错误信息
2. 在页面上显示错误消息
3. 提供"刷新价格"按钮让用户重试
4. **不再**回退到演示数据

## 注意事项

1. **网络要求**: 需要能够访问外部API（Yahoo Finance、Sina Finance）
2. **缓存时间**: 价格数据缓存1分钟，确保数据及时更新
3. **数据验证**: 所有API响应都经过验证，确保数据质量
4. **错误透明**: 当API失败时，用户会看到明确的错误信息

## 下一步

如果仍然看到演示数据，请:
1. 打开浏览器开发者工具 (F12)
2. 查看 Console 标签页的错误信息
3. 查看 Network 标签页，确认API请求是否成功
4. 使用 `/test-price-api.html` 测试API连接
5. 使用 `/clear-price-cache.html` 清除所有缓存

## 技术细节

### 缓存键格式
- 黄金: `price_gold_investing_v2_5`
- 纳斯达克: `price_nasdaq_yahoo_5`
- A股: `price_astock_sina_5`

### 数据格式
```typescript
interface PriceData {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  change: number;
  changePercent: number;
}
```

### 验证规则
- 价格必须 > 0
- high >= max(open, close)
- low <= min(open, close)
- 黄金价格范围: 2000-8000
- 上证指数范围: 2500-4000
