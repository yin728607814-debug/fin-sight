# 环境变量配置指南

## 📋 完整的环境变量列表

### 1. News API
```env
NEWS_API_KEY=4e96dafb9944403f9b76dcf2c5de51a2
VITE_NEWS_API_KEY=4e96dafb9944403f9b76dcf2c5de51a2
```
- **用途**: 获取金融新闻（备用）
- **来源**: https://newsapi.org/
- **限制**: 免费版每天100次请求
- **状态**: ✅ 已配置

### 2. Alpha Vantage API
```env
ALPHA_VANTAGE_API_KEY=QM9BUDSK391TXWXB
VITE_ALPHA_VANTAGE_API_KEY=QM9BUDSK391TXWXB
```
- **用途**: 获取股票价格数据
- **来源**: https://www.alphavantage.co/
- **限制**: 免费版每天25次请求
- **状态**: ✅ 已配置

### 3. Finnhub API
```env
FINNHUB_API_KEY=d55pnopr01qu4cciap2gd55pnopr01qu4cciap30
VITE_FINNHUB_API_KEY=d55pnopr01qu4cciap2gd55pnopr01qu4cciap30
```
- **用途**: 获取纳斯达克英文新闻（备用源）
- **来源**: https://finnhub.io/
- **限制**: 免费版60次/分钟
- **状态**: ✅ 已配置

### 4. Gemini API ⭐ 重要
```env
GEMINI_API_KEY=AIzaSyDwPZDAO4HkB2kvPfbfPc35DZCZGEpHJYM
VITE_GEMINI_API_KEY=AIzaSyDwPZDAO4HkB2kvPfbfPc35DZCZGEpHJYM
```
- **用途**: AI新闻分析 + 新闻翻译
- **来源**: https://ai.google.dev/
- **限制**: 免费版15次/分钟，1500次/天
- **状态**: ✅ 已配置（新项目密钥）
- **优化措施**:
  - 分析缓存: 2小时
  - 新闻缓存: 15分钟
  - 优先使用中文源（减少翻译）
  - 批量处理（50条=1次调用）

### 5. 应用配置
```env
VITE_APP_TITLE=Investment News Analyzer
VITE_APP_VERSION=1.0.0
```

## 🚀 快速导入到Netlify

### 方法1: 使用导入文件（推荐）

1. **打开文件**: `NETLIFY_ENV_IMPORT.txt`
2. **复制全部内容**
3. **访问Netlify**: https://app.netlify.com/
4. **进入项目**: Site settings → Environment variables
5. **点击**: "Import from a .env file"
6. **粘贴内容**并点击 "Import variables"
7. **触发重新部署**

### 方法2: 手动添加

如果导入失败，可以手动添加每个变量：

1. 访问: Site settings → Environment variables
2. 点击: "Add a variable"
3. 逐个添加上面列出的10个变量

## 📊 当前API使用策略

### 纳斯达克页面
```
优先级1: 新浪财经美股频道 (中文，免费，无限制)
优先级2: 东方财富美股频道 (中文，免费，无限制)
优先级3: Finnhub (英文，备用) + Gemini翻译
```

**优势**:
- ✅ 优先使用中文源，减少翻译API调用
- ✅ 多源聚合，保证50条新闻
- ✅ 相关性评分系统，确保质量

### 黄金页面
```
新浪财经 (中文，免费，无限制)
```

**优势**:
- ✅ 完全中文，无需翻译
- ✅ 免费无限制

### AI分析
```
Gemini API (批量处理)
- 50条新闻 = 1次API调用
- 缓存2小时
```

**优势**:
- ✅ 批量处理，节省98%的API调用
- ✅ 长时间缓存，减少重复调用
- ✅ 每天可支持500-750次页面访问

## 📈 API配额监控

### Gemini API（最重要）
- **每分钟**: 15次请求
- **每天**: 1500次请求
- **当前使用**: 
  - 纳斯达克页面: 2次/访问（理想情况0次）
  - 黄金页面: 1次/访问
- **预计支持**: 每天500-750次页面访问

### 监控建议
1. 定期检查Gemini API使用情况
2. 如果接近限制，考虑：
   - 增加缓存时间
   - 减少新闻数量
   - 创建新的Google Cloud项目

## 🔧 故障排查

### 问题1: Gemini API配额用完
**症状**: 返回429错误
**解决方案**:
1. 等待到明天UTC 00:00（北京时间早上8点）
2. 或创建新的Google Cloud项目
3. 或升级到付费版

### 问题2: 新闻获取失败
**症状**: 显示演示数据
**检查**:
1. 新浪财经API是否可访问
2. 东方财富Function是否部署
3. Finnhub API密钥是否有效

### 问题3: 翻译失败
**症状**: 显示英文新闻
**检查**:
1. Gemini API密钥是否正确
2. 是否超出配额限制
3. 网络连接是否正常

## 📝 环境变量命名规则

### VITE_ 前缀
- 用于前端代码可访问的变量
- 会被打包到前端代码中
- 例如: `VITE_GEMINI_API_KEY`

### 无前缀
- 用于Netlify Functions（服务器端）
- 不会暴露到前端
- 例如: `GEMINI_API_KEY`

### 为什么需要两个？
- 前端和后端都需要访问API
- 保持一致性，避免混淆
- Netlify会自动处理

## 🔒 安全建议

1. **不要提交.env到Git**
   - 已添加到.gitignore
   - 只提交.env.example

2. **定期更换密钥**
   - 特别是Gemini API密钥
   - 如果怀疑泄露，立即更换

3. **监控API使用**
   - 定期检查配额使用情况
   - 发现异常立即调查

## 📞 获取新密钥

### News API
1. 访问: https://newsapi.org/
2. 注册账号
3. 获取API密钥

### Alpha Vantage
1. 访问: https://www.alphavantage.co/
2. 点击 "Get your free API key"
3. 填写信息获取密钥

### Finnhub
1. 访问: https://finnhub.io/register
2. 注册账号
3. 在Dashboard获取API密钥

### Gemini
1. 访问: https://ai.google.dev/
2. 点击 "Get API key"
3. 创建或选择Google Cloud项目
4. 生成API密钥

## ✅ 配置检查清单

部署前请确认：

- [ ] 所有10个环境变量已配置
- [ ] Gemini API密钥是新项目的密钥
- [ ] Finnhub API密钥已添加
- [ ] 在Netlify中导入成功
- [ ] 触发重新部署
- [ ] 生产环境测试通过

## 🎉 完成！

环境变量配置完成后，你的应用将：
- ✅ 使用高质量的中文新闻源
- ✅ 智能降级到备用源
- ✅ 优化API配额使用
- ✅ 提供流畅的用户体验
