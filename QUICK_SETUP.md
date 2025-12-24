# 快速设置指南

## 步骤1：获取Finnhub API密钥

1. 访问：https://finnhub.io/register
2. 注册账号（可以用Google账号快速注册）
3. 登录后，在Dashboard页面复制你的API Key

## 步骤2：导入环境变量到Netlify

### 方法A：使用导入文件（推荐）

1. 打开 `netlify-env-import.txt` 文件
2. 将 `你的Finnhub密钥` 替换为你刚才获取的Finnhub API Key
3. 登录 Netlify → 进入你的项目
4. Site settings → Environment variables
5. 点击 "Import from a .env file"
6. 复制粘贴 `netlify-env-import.txt` 的全部内容
7. 点击 Import

### 方法B：手动添加（如果导入不工作）

在Netlify的Environment variables页面，逐个添加：

```
NEWS_API_KEY = 4e96dafb9944403f9b76dcf2c5de51a2
VITE_NEWS_API_KEY = 4e96dafb9944403f9b76dcf2c5de51a2

ALPHA_VANTAGE_API_KEY = QM9BUDSK391TXWXB
VITE_ALPHA_VANTAGE_API_KEY = QM9BUDSK391TXWXB

GEMINI_API_KEY = AIzaSyCAdE2PtKhh7ZktZAywXMVR26-oFoKFZOo
VITE_GEMINI_API_KEY = AIzaSyCAdE2PtKhh7ZktZAywXMVR26-oFoKFZOo

FINNHUB_API_KEY = [你的Finnhub密钥]
VITE_FINNHUB_API_KEY = [你的Finnhub密钥]

VITE_APP_TITLE = Investment News Analyzer
VITE_APP_VERSION = 1.0.0
```

## 步骤3：触发重新部署

1. 保存环境变量后
2. Netlify会自动触发重新部署
3. 或者手动点击 "Trigger deploy" → "Deploy site"

## 步骤4：验证

部署完成后：
1. 访问你的网站
2. 进入纳斯达克页面
3. 应该能看到真实的纳斯达克新闻了

## 注意事项

- Finnhub免费版：60次/分钟，30,000次/月
- 如果看到演示数据，检查浏览器控制台的错误信息
- 确保所有 `VITE_` 开头的变量都已配置
