# 新闻API源配置指南

## 🎯 推荐的稳定API服务

为了解决新浪财经经常超时的问题，我们集成了多个稳定的付费API服务作为主要数据源。

### 1. **极速数据 (jisuapi.com)** ⭐⭐⭐⭐⭐

**优势**：
- 专业的数据服务商，稳定性极佳
- 支持财经、股票等16个新闻频道
- 数据质量高，更新及时
- 有免费试用额度

**价格**：
- 免费额度：通常提供100-1000次免费调用
- 付费价格：约0.01-0.05元/次，性价比高

**申请步骤**：
1. 访问 [https://www.jisuapi.com/](https://www.jisuapi.com/)
2. 注册账号并实名认证
3. 申请"新闻API"接口
4. 获取API密钥

**配置**：
```bash
# 在 .env 文件中添加
VITE_JISU_API_KEY=your_jisu_api_key_here
```

### 2. **探数API (tanshuapi.com)** ⭐⭐⭐⭐

**优势**：
- 新用户赠送10000次免费调用
- 专门针对AI训练和数据分析优化
- 支持头条、财经、股票等16个频道
- 接口简单易用

**价格**：
- 免费额度：新用户10000次
- 付费价格：约0.005-0.02元/次

**申请步骤**：
1. 访问 [https://www.tanshuapi.com/](https://www.tanshuapi.com/)
2. 注册账号
3. 申请"头条新闻API"
4. 获取API密钥

**配置**：
```bash
# 在 .env 文件中添加
VITE_TANSHU_API_KEY=your_tanshu_api_key_here
```

### 3. **Finnhub (finnhub.io)** ⭐⭐⭐

**优势**：
- 国际知名金融数据提供商
- 英文新闻质量高
- 免费额度较大

**缺点**：
- 需要翻译成中文
- 主要针对美股市场

**配置**：
```bash
# 在 .env 文件中添加
VITE_FINNHUB_API_KEY=your_finnhub_api_key_here
```

## 🔄 降级策略

我们的系统采用智能降级策略，确保即使某个API失败也不会影响用户体验：

### 纳斯达克新闻
1. **极速数据** (股票频道) - 主要源
2. **东方财富** (美股专页) - 备用源
3. **新浪财经** (5秒快速超时) - 补充源
4. **Finnhub** (翻译) - 最后备用

### 黄金新闻
1. **极速数据** (财经频道) - 主要源
2. **东方财富** (黄金频道) - 备用源
3. **新浪财经** (5秒快速超时) - 补充源
4. **Finnhub** (翻译) - 最后备用

### A股新闻
1. **极速数据** (股票频道) - 主要源
2. **探数API** (股票频道) - 备用源
3. **东方财富** (A股频道) - 补充源
4. **新浪财经** (5秒快速超时) - 最后备用

## 💰 成本估算

假设每天获取新闻1000次：

| API服务 | 月成本 | 年成本 | 稳定性 |
|---------|--------|--------|--------|
| 极速数据 | ¥15-50 | ¥180-600 | ⭐⭐⭐⭐⭐ |
| 探数API | ¥5-30 | ¥60-360 | ⭐⭐⭐⭐ |
| Finnhub | $0-10 | $0-120 | ⭐⭐⭐⭐ |
| 新浪财经 | 免费 | 免费 | ⭐⭐ |

**推荐配置**：
- 生产环境：极速数据 + 探数API + Finnhub
- 开发环境：探数API (免费额度) + Finnhub
- 预算有限：探数API + 新浪财经

## 🚀 部署配置

### Cloudflare Pages 环境变量

在 Cloudflare Pages 控制台中设置以下环境变量：

```
VITE_JISU_API_KEY=your_jisu_api_key_here
VITE_TANSHU_API_KEY=your_tanshu_api_key_here
VITE_FINNHUB_API_KEY=your_finnhub_api_key_here
```

### 本地开发配置

创建 `.env` 文件：

```bash
# 复制 .env.example 到 .env
cp .env.example .env

# 编辑 .env 文件，填入真实的API密钥
```

## 🧪 测试验证

运行测试脚本验证API配置：

```bash
# 测试新的API源
node scripts/test-new-apis.js

# 测试Finnhub代理
node scripts/test-finnhub-proxy.js

# 测试A股新闻混合策略
node scripts/test-astock-news.js
```

## 📊 监控和优化

### 性能监控
- 每个API的响应时间
- 成功率统计
- 数据质量评分

### 成本优化
- 根据使用量调整API优先级
- 设置每日调用限制
- 监控API配额使用情况

### 故障处理
- 自动降级到备用API
- 错误日志记录
- 用户友好的错误提示

## 🔧 故障排除

### 常见问题

1. **API密钥无效**
   - 检查密钥是否正确复制
   - 确认API服务是否已激活
   - 检查账户余额

2. **请求超时**
   - 检查网络连接
   - 确认API服务状态
   - 调整超时设置

3. **配额超限**
   - 检查API使用量
   - 升级API套餐
   - 启用降级策略

### 调试技巧

```bash
# 查看API调用日志
# 在浏览器开发者工具的Console中查看详细日志

# 测试单个API
curl -X GET "https://your-domain.com/jisu-news-proxy?category=股票&num=10"
```

## 📈 未来扩展

计划支持的API源：
- 腾讯新闻API
- 百度新闻API
- 网易新闻API
- 今日头条API

通过多源策略，我们确保了新闻数据的稳定性和可靠性，彻底解决了新浪财经超时的问题。