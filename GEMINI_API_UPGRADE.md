# Gemini API 升级说明

## 当前配置

你的应用已经配置为使用 **Gemini 2.5 Flash** 模型。

### 使用的模型

- **模型名称**：`gemini-2.5-flash`
- **API 端点**：`https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent`

### 模型特点

- ✅ **速度快**：响应时间短，适合实时应用
- ✅ **性价比高**：价格便宜，质量好
- ✅ **额度充足**：每分钟 1K 次请求，每天 1M tokens
- ✅ **能力强**：比 2.0 Flash 更强，接近 Pro 级别

### 免费额度

- **每分钟**：1,000 次请求
- **每天**：1,000,000 tokens
- **每月**：足够处理大量新闻分析

### 付费定价（如果超出免费额度）

- **输入**：$0.075 / 百万 tokens（≤128K context）
- **输出**：$0.30 / 百万 tokens（≤128K context）

**成本估算**：
- 假设每天分析 100 条新闻
- 每条新闻约 500 tokens 输入 + 200 tokens 输出
- 每月成本：约 $0.30（非常便宜！）

## 测试 API

### 方法一：运行测试脚本

```bash
node scripts/test-gemini-api.js
```

这个脚本会：
1. 读取你的 `.env` 文件中的 API Key
2. 测试简单文本生成
3. 测试新闻分析功能
4. 显示详细的测试结果

### 方法二：手动测试

使用 curl 命令测试：

```bash
curl -X POST \
  "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [{
      "parts": [{
        "text": "请用一句话介绍 Gemini 2.5 Flash 模型。"
      }]
    }],
    "generationConfig": {
      "temperature": 0.7,
      "maxOutputTokens": 100
    }
  }'
```

## 代码位置

Gemini API 在以下文件中使用：

1. **`services/analysisService.ts`**
   - 新闻分析服务
   - 情感分析
   - 关键词提取

2. **`services/newsService.ts`**
   - 新闻摘要生成
   - 新闻分类

3. **`netlify/functions/translate.js`**
   - 翻译功能

## 环境变量配置

确保在以下位置配置了 API Key：

### 本地开发（`.env` 文件）

```env
VITE_GEMINI_API_KEY=your_api_key_here
```

或

```env
GEMINI_API_KEY=your_api_key_here
```

### Netlify 部署

在 Netlify Dashboard 中设置环境变量：

1. 进入你的站点设置
2. 找到 "Environment variables"
3. 添加：
   - Name: `VITE_GEMINI_API_KEY`
   - Value: 你的 API Key

## 如何获取 API Key

1. 访问 [Google AI Studio](https://aistudio.google.com/)
2. 登录你的 Google 账号
3. 点击 "Get API Key"
4. 创建新的 API Key
5. 复制 API Key 到 `.env` 文件

## 升级到 Gemini 3 Pro（可选）

如果将来需要更强的能力，可以升级到 Gemini 3 Pro：

### 修改模型名称

在以下文件中将 `gemini-2.5-flash` 替换为 `gemini-3-pro`：

1. `services/analysisService.ts` (第 121 行)
2. `services/newsService.ts` (第 840, 911 行)
3. `netlify/functions/translate.js` (第 85 行)

### Gemini 3 Pro 特点

- ✅ **最强能力**：推理和理解能力最强
- ✅ **最高质量**：输出质量最好
- ⚠️ **限制较多**：每分钟 25 次请求
- ⚠️ **价格较高**：比 Flash 贵

## 常见问题

### Q: 如何知道 API 是否正常工作？

A: 运行测试脚本：`node scripts/test-gemini-api.js`

### Q: 如何查看 API 使用量？

A: 访问 [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Dashboard

### Q: 免费额度够用吗？

A: 对于个人使用，免费额度完全够用。每天 1M tokens 可以分析数百条新闻。

### Q: 如何启用付费？

A: 
1. 访问 Google Cloud Console
2. 启用计费
3. 绑定信用卡
4. 设置预算提醒

### Q: Gemini 2.5 Flash 和 3 Pro 哪个更好？

A: 
- **日常使用**：2.5 Flash（速度快、便宜、够用）
- **高质量需求**：3 Pro（能力最强、质量最高）
- **推荐**：先用 2.5 Flash，如果觉得质量不够再升级

## 监控和优化

### 监控 API 使用

在代码中添加日志：

```typescript
console.log('Gemini API 调用:', {
  model: 'gemini-2.5-flash',
  inputTokens: estimatedInputTokens,
  timestamp: new Date().toISOString()
});
```

### 优化建议

1. **缓存结果**：相同的新闻不要重复分析
2. **批量处理**：一次请求分析多条新闻
3. **控制 token 数量**：限制输入和输出长度
4. **错误重试**：网络错误时自动重试

## 下一步

1. ✅ 运行测试脚本验证 API
2. ✅ 检查应用是否正常工作
3. ✅ 监控 API 使用量
4. ✅ 根据需要调整模型

如有问题，查看测试脚本输出的错误信息。
