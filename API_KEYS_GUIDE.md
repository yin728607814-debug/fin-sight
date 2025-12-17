# API密钥获取指南

为了获取真实的新闻和价格数据，你需要申请以下API密钥：

## 1. News API (新闻数据)

**网站：** https://newsapi.org/

**步骤：**
1. 访问 https://newsapi.org/register
2. 注册免费账户
3. 验证邮箱后登录
4. 在Dashboard中找到你的API Key
5. 将API Key复制到 `.env` 文件的 `NEWS_API_KEY=` 后面

**免费限制：**
- 每天1000次请求
- 只能获取过去30天的新闻
- 适合开发和测试使用

## 2. Alpha Vantage API (价格数据)

**网站：** https://www.alphavantage.co/

**步骤：**
1. 访问 https://www.alphavantage.co/support/#api-key
2. 填写表单申请免费API Key
3. 查收邮件获取API Key
4. 将API Key复制到 `.env` 文件的 `ALPHA_VANTAGE_API_KEY=` 后面

**免费限制：**
- 每分钟5次请求
- 每天500次请求
- 适合个人项目使用

## 3. Google Gemini API (AI分析)

**网站：** https://ai.google.dev/

**步骤：**
1. 访问 https://makersuite.google.com/app/apikey
2. 使用Google账户登录
3. 点击"Create API Key"
4. 选择项目或创建新项目
5. 复制生成的API Key
6. 将API Key复制到 `.env` 文件的 `GEMINI_API_KEY=` 后面

**免费限制：**
- 每分钟15次请求
- 每天1500次请求
- 适合开发和小规模使用

## 配置示例

完成申请后，你的 `.env` 文件应该类似这样：

```env
NEWS_API_KEY=1234567890abcdef1234567890abcdef
ALPHA_VANTAGE_API_KEY=ABCDEFGHIJKLMNOP
GEMINI_API_KEY=AIzaSyABC123DEF456GHI789JKL012MNO345PQR
```

## 测试配置

配置完成后：
1. 重启开发服务器 (`npm run dev`)
2. 访问 http://localhost:3000
3. 点击"刷新新闻"按钮测试新闻API
4. 查看价格图表测试价格API
5. 进行新闻分析测试AI API

## 故障排除

**如果遇到API错误：**
1. 检查API密钥是否正确复制
2. 确认API密钥没有过期
3. 检查是否超出了免费限制
4. 查看浏览器控制台的错误信息

**常见错误：**
- `401 Unauthorized`: API密钥无效或过期
- `429 Too Many Requests`: 超出请求限制
- `403 Forbidden`: API密钥权限不足

## 备用方案

如果暂时无法获取API密钥，应用会自动使用演示数据，但这不是真实的市场数据。