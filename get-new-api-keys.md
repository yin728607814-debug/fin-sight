# 获取新的API密钥

## 问题分析
从测试结果看：
- News API: 工作正常（显示success: 5 items）
- Alpha Vantage API: 报错"apikey is invalid or missing"
- Gemini API: 需要更新模型名称

## 解决方案

### 1. 获取新的Alpha Vantage API密钥
访问：https://www.alphavantage.co/support/#api-key
- 免费注册
- 获取新的API密钥
- 替换现有密钥

### 2. 当前API密钥状态
- NEWS_API_KEY: ✅ 工作正常 (4e96dafb9944403f9b76dcf2c5de51a2)
- ALPHA_VANTAGE_API_KEY: ❌ 需要更新 (QM9BUDSK391TXWXB 已失效)
- GEMINI_API_KEY: ✅ 密钥有效，但需要更新模型 (AIzaSyCAdE2PtKhh7ZktZAywXMVR26-oFoKFZOo)

### 3. 推荐的新密钥
请访问以下网站获取新密钥：

1. **Alpha Vantage** (必需): https://www.alphavantage.co/support/#api-key
   - 免费，立即可用
   - 每分钟5次请求限制

2. **备用方案**: 如果Alpha Vantage不工作，可以考虑：
   - Finnhub API: https://finnhub.io/
   - IEX Cloud: https://iexcloud.io/
   - Polygon.io: https://polygon.io/

### 4. 测试步骤
1. 获取新的Alpha Vantage API密钥
2. 在Netlify中更新环境变量
3. 访问 https://你的域名/.netlify/functions/test-keys 检查密钥
4. 访问 https://你的域名/test-simple.html 测试所有功能