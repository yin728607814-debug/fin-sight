# 混合新闻源策略说明

## 📋 概述

实现了多源聚合的混合新闻策略，优先使用中文源，确保高相关性和足够数量的纳斯达克新闻。

## 🎯 策略设计

### 核心流程

```
1. 并发获取多个中文源
   ├─ 新浪财经美股频道 (目标30条)
   └─ 东方财富美股频道 (目标30条)
   
2. 合并去重
   └─ 按URL去重，保留唯一新闻
   
3. 相关性评分
   └─ 多维度评分系统 (0-100分)
   
4. 过滤排序
   ├─ 过滤低相关性 (阈值40分)
   └─ 按评分排序
   
5. 智能补充
   └─ 如果不足50条，使用Finnhub+翻译补充
```

## 📊 相关性评分系统

### 评分维度（总分100分）

#### 1. URL匹配 (30分)
- 包含 `/usstock/` 或 `/stock/us` = +30分

#### 2. 标题关键词 (40分)
- **高权重** (15分)
  - 纳斯达克、NASDAQ、纳指
- **中权重** (10分)
  - 美股、科技股、华尔街
- **公司名** (15分)
  - 苹果、微软、谷歌、亚马逊、特斯拉、英伟达
  - Apple、Microsoft、Google、Amazon、Tesla、NVIDIA
  - AAPL、MSFT、GOOGL、AMZN、TSLA、NVDA

#### 3. 内容关键词 (20分)
- **行业词** (10分)
  - 科技、创新、AI、人工智能、芯片、半导体
- **股票代码** (10分)
  - AAPL、MSFT、GOOGL、AMZN、TSLA、NVDA、META、NFLX

#### 4. 来源可靠性 (10分)
- 新浪财经/东方财富 = +10分
- 其他来源 = +5分

### 评分阈值
- **保留阈值**: ≥40分
- **高相关性**: ≥60分
- **中相关性**: 40-60分

## 🔧 技术实现

### 新增文件

#### 1. Netlify Function
```
netlify/functions/eastmoney-news-proxy.js
```
- 爬取东方财富美股新闻
- 返回统一JSON格式

#### 2. 测试文件
```
test-hybrid-news.ts          # TypeScript测试脚本
test-hybrid-news.html        # 浏览器测试页面
```

### 修改文件

#### services/newsService.ts
新增方法：
- `fetchNasdaqNewsHybrid()` - 混合策略主方法
- `fetchSinaUSStockNews()` - 获取新浪美股新闻
- `fetchEastMoneyNews()` - 获取东方财富新闻
- `calculateNasdaqRelevanceScore()` - 计算相关性评分
- `deduplicateNews()` - 去重新闻

## 📈 预期效果

### 新闻质量
- **相关性**: 90%+ (通过评分系统保证)
- **数量**: 稳定50条
- **语言**: 优先中文，备用翻译

### API配额优化
- **理想情况**: 0次翻译 (中文源充足)
- **一般情况**: 10-20次翻译 (补充少量)
- **最坏情况**: 50次翻译 (降级到Finnhub)

### 性能
- **加载速度**: 3-5秒 (并发获取)
- **缓存时间**: 15分钟

## 🧪 测试方法

### 方法1: TypeScript测试
```bash
npx ts-node test-hybrid-news.ts
```

### 方法2: 浏览器测试
1. 启动开发服务器: `npm run dev`
2. 访问: `http://localhost:3001/test-hybrid-news.html`
3. 点击"开始测试"按钮

### 测试指标

#### 必须通过
- ✅ 新闻数量 ≥ 50条
- ✅ 平均相关性 ≥ 50分
- ✅ 高相关性占比 ≥ 30%
- ✅ 来源多样性 ≥ 2个来源
- ✅ 纳斯达克关键词 ≥ 10条

#### 优秀标准
- 🌟 新闻数量 = 50条
- 🌟 平均相关性 ≥ 60分
- 🌟 高相关性占比 ≥ 50%
- 🌟 来源多样性 ≥ 3个来源
- 🌟 纳斯达克关键词 ≥ 30条

## 🔄 降级策略

### 情况A: 中文源充足 (≥50条)
```
新浪财经 + 东方财富 → 去重 → 评分 → 排序 → 返回前50条
✅ 不调用翻译API
✅ 节省配额
```

### 情况B: 中文源不足 (30-49条)
```
新浪财经 + 东方财富 → 去重 → 评分 → 排序
                                    ↓
                            不足50条，补充Finnhub
                                    ↓
                            翻译补充的新闻
                                    ↓
                            返回50条
⚠️ 部分调用翻译API
```

### 情况C: 中文源失败 (<30条)
```
完全使用Finnhub → 翻译 → 返回50条
⚠️ 完全调用翻译API (降级方案)
```

## 📝 使用示例

```typescript
import { NewsService } from './services/newsService';

const newsService = new NewsService();

// 获取纳斯达克新闻（自动使用混合策略）
const news = await newsService.fetchMarketNews('nasdaq', 50);

console.log(`获取${news.length}条新闻`);
console.log(`平均相关性: ${news.reduce((sum, n) => sum + n.relevanceScore, 0) / news.length}`);
```

## 🚀 部署说明

### 1. 推送代码
```bash
git add .
git commit -m "实现混合新闻源策略"
git push origin main
```

### 2. Netlify自动部署
- Netlify会自动检测到新的Function
- 自动部署 `eastmoney-news-proxy` 函数

### 3. 验证部署
访问生产环境测试页面：
```
https://your-site.netlify.app/test-hybrid-news.html
```

## 🎉 优势总结

### 1. 高相关性
- ✅ 多维度评分系统
- ✅ 智能过滤低相关性新闻
- ✅ 关键词覆盖全面

### 2. 数量保证
- ✅ 多源聚合
- ✅ 智能降级
- ✅ 稳定50条

### 3. 用户体验
- ✅ 原生中文，阅读流畅
- ✅ 加载速度快
- ✅ 内容质量高

### 4. 成本优化
- ✅ 优先中文源（免费）
- ✅ 减少翻译调用
- ✅ 节省API配额

## 🔍 监控建议

### 关键指标
1. **新闻数量**: 应稳定在50条
2. **平均相关性**: 应≥50分
3. **中文源占比**: 应≥60%
4. **翻译调用次数**: 应≤20次/请求

### 异常处理
- 如果中文源持续失败，检查代理函数
- 如果相关性偏低，调整评分权重
- 如果数量不足，增加源或降低阈值

## 📞 问题反馈

如遇到问题，请检查：
1. Netlify Functions是否正常部署
2. 新浪财经/东方财富API是否可访问
3. Finnhub API密钥是否有效
4. 浏览器控制台是否有错误信息
