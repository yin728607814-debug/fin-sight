# Netlify 环境变量配置指南

## 需要在 Netlify 中配置的环境变量

在 Netlify 控制台中，进入 **Site settings > Environment variables**，添加以下环境变量：

### 1. News API（新闻数据源）
```
NEWS_API_KEY=4e96dafb9944403f9b76dcf2c5de51a2
VITE_NEWS_API_KEY=4e96dafb9944403f9b76dcf2c5de51a2
```
- 用途：获取金融新闻
- 获取地址：https://newsapi.org/

### 2. Alpha Vantage API（股票价格数据）
```
ALPHA_VANTAGE_API_KEY=QM9BUDSK391TXWXB
VITE_ALPHA_VANTAGE_API_KEY=QM9BUDSK391TXWXB
```
- 用途：获取股票和价格数据
- 获取地址：https://www.alphavantage.co/

### 3. Gemini API（AI分析）
```
GEMINI_API_KEY=AIzaSyCAdE2PtKhh7ZktZAywXMVR26-oFoKFZOo
VITE_GEMINI_API_KEY=AIzaSyCAdE2PtKhh7ZktZAywXMVR26-oFoKFZOo
```
- 用途：AI新闻影响分析
- 获取地址：https://ai.google.dev/
- 模型：gemini-2.5-flash

### 4. 应用配置
```
VITE_APP_TITLE=Investment News Analyzer
VITE_APP_VERSION=1.0.0
```

## 配置步骤

1. 登录 Netlify 控制台
2. 选择你的站点
3. 进入 **Site settings** > **Environment variables**
4. 点击 **Add a variable**
5. 逐个添加上述环境变量
6. 保存后触发重新部署

## 注意事项

- ⚠️ 所有以 `VITE_` 开头的变量会被打包到前端代码中
- ⚠️ 不带 `VITE_` 前缀的变量仅在 Netlify Functions 中可用
- ⚠️ 修改环境变量后需要重新部署才能生效
- ⚠️ Gemini API 使用的是 v1 版本，模型为 gemini-2.5-flash

## 验证配置

部署完成后，打开浏览器控制台，检查：
1. 是否有 API 密钥相关的错误
2. AI 分析是否返回智能结果（而非简单的关键词分析）
3. 黄金价格数据是否正常加载
