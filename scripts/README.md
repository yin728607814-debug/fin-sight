# 测试脚本使用说明

## 分析服务修复测试

### 测试JSON解析修复

```bash
# 测试分析服务的JSON解析容错性
node scripts/test-analysis-fix.js
```

测试会验证：
- 自动移除markdown标记
- 修复未转义的换行符
- 移除多余的逗号
- 补全截断的JSON
- 提供兜底分析结果

## 新API源测试

### 测试极速数据和探数API

```bash
# 确保开发服务器正在运行
npm run dev

# 在另一个终端运行测试
node scripts/test-new-apis.js
```

测试会验证：
- 极速数据股票新闻获取
- 极速数据财经新闻获取
- 探数API股票新闻获取
- 探数API财经新闻获取

注意：需要在 `.env` 文件中配置相应的API密钥：
- `VITE_JISU_API_KEY` - 极速数据API密钥
- `VITE_TANSHU_API_KEY` - 探数API密钥

## Finnhub 代理测试

### 测试 Finnhub 新闻代理功能

```bash
# 确保开发服务器正在运行
npm run dev

# 在另一个终端运行测试
node scripts/test-finnhub-proxy.js
```

测试会验证：
- AAPL 公司新闻获取
- GLD (黄金ETF) 新闻获取
- 通用财经新闻获取
- 代理返回格式是否正确

注意：需要在 `.env` 文件中配置 `VITE_FINNHUB_API_KEY`。如果未配置，代理会返回错误，但不会影响整体应用（Finnhub 是可选的补充源）。

## A股新闻混合策略测试

### 测试A股新闻获取（东方财富 + 新浪财经混合策略）

```bash
# 确保开发服务器正在运行
npm run dev

# 在另一个终端运行测试
node scripts/test-astock-news.js
```

测试会验证：
- 东方财富A股新闻获取
- 新浪财经A股新闻补充（带超时保护）
- 新闻去重和相关性评分
- 不同数量级的性能（50/100/200条）

## 新浪新闻速度测试

### 1. 安装测试依赖

```bash
npm install --save-dev express cors
```

### 2. 启动测试服务器

在一个终端窗口运行：

```bash
node scripts/test-server.js
```

你会看到：
```
🚀 测试服务器运行在 http://localhost:3001
📡 新浪新闻代理: http://localhost:3001/sina-news-proxy?num=50
```

### 3. 运行测试

在另一个终端窗口运行：

```bash
node scripts/test-sina-news.js
```

### 4. 查看结果

测试会显示：
- 每个请求的耗时
- 获取的新闻数量
- 平均速度（条/秒）
- 成功率统计

### 手动测试

你也可以直接在浏览器中访问：

- 50条新闻: http://localhost:3001/sina-news-proxy?num=50
- 100条新闻: http://localhost:3001/sina-news-proxy?num=100
- 500条新闻: http://localhost:3001/sina-news-proxy?num=500

浏览器的开发者工具（Network标签）会显示请求耗时。

### 使用 curl 测试

```bash
# 测试50条新闻
time curl "http://localhost:3001/sina-news-proxy?num=50" | jq '.totalResults'

# 测试500条新闻
time curl "http://localhost:3001/sina-news-proxy?num=500" | jq '.totalResults'
```

## 预期结果

优化后的性能：
- 50条新闻：约1-2秒
- 100条新闻：约1-3秒
- 200条新闻：约2-5秒
- 500条新闻：约5-10秒

如果超时或速度太慢，说明需要进一步优化。
