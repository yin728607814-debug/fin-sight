# Finnhub API 设置指南

## 为什么切换到Finnhub？

Alpha Vantage免费版限制太严格：
- ❌ 每天只有25次请求
- ❌ 每秒只能1次请求

Finnhub免费版更慷慨：
- ✅ 每分钟60次请求
- ✅ 专注金融市场新闻
- ✅ 数据质量高

## 获取Finnhub API密钥

### 1. 注册账号
访问：https://finnhub.io/register

### 2. 获取API密钥
注册后，在Dashboard页面可以看到你的API Key

### 3. 配置到Netlify

#### 方法1：通过Netlify UI配置
1. 登录 Netlify
2. 进入你的项目
3. 点击 "Site settings" → "Environment variables"
4. 添加新变量：
   - Key: `VITE_FINNHUB_API_KEY`
   - Value: 你的Finnhub API密钥

#### 方法2：通过本地.env文件（开发环境）
```bash
# .env
VITE_FINNHUB_API_KEY=你的Finnhub_API密钥
FINNHUB_API_KEY=你的Finnhub_API密钥
```

## 注意事项

- 纳斯达克新闻使用 `VITE_FINNHUB_API_KEY`
- 价格数据继续使用 `VITE_ALPHA_VANTAGE_API_KEY`
- 两个API密钥互不影响

## API限制

Finnhub免费版：
- 60次请求/分钟
- 每月30,000次请求
- 足够你的应用使用

## 测试

配置完成后：
1. 重新部署Netlify
2. 访问纳斯达克页面
3. 应该能看到真实的纳斯达克新闻了
