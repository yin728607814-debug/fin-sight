# 🚀 一键部署到Netlify

## 方法1：一键部署按钮
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/your-username/investment-news-analyzer)

## 方法2：手动部署

### 步骤1：构建项目
```bash
npm run build
```

### 步骤2：上传到Netlify
1. 访问 [netlify.com](https://netlify.com)
2. 拖拽 `dist` 文件夹到部署区域
3. 等待部署完成

### 步骤3：设置环境变量
在Netlify控制台 → Site settings → Environment variables 中添加：

```
NEWS_API_KEY=4e96dafb9944403f9b76dcf2c5de51a2
ALPHA_VANTAGE_API_KEY=QM9BUDSK391TXWXB  
GEMINI_API_KEY=AIzaSyCAdE2PtKhh7ZktZAywXMVR26-oFoKFZOo
```

## ✅ 部署后验证

访问你的网站，你会看到：
- ❌ 蓝色的"演示数据"提示消失了
- ✅ 显示真实的金融新闻
- ✅ 真实的价格数据
- ✅ AI分析结果

## 🔧 如果遇到问题

1. **检查环境变量**：确保在Netlify中正确设置了API密钥
2. **查看函数日志**：在Netlify控制台查看Functions日志
3. **重新部署**：修改后重新部署

## 📱 预期结果

部署成功后，你的应用将：
- 🌐 在互联网上可访问
- 📰 显示真实的金融新闻
- 📊 显示真实的价格走势图
- 🤖 提供AI驱动的市场分析
- ⚡ 快速响应和更新

就这么简单！