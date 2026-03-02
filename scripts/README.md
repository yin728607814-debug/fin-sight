# 测试脚本使用说明

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
