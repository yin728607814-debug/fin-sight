# AI投资顾问故障排查指南

## 问题现象
AI助手无法回答问题，显示错误提示：
```
抱歉，我遇到了一些问题，无法回答您的问题。请稍后再试，或者尝试重新表述您的问题。

可能的原因：
- AI服务暂时不可用
- 网络连接问题
- API配额已用完
```

## 排查步骤

### 1. 检查浏览器控制台
打开浏览器开发者工具（F12），查看Console标签页中的错误信息：

**常见错误及解决方案：**

#### 错误1：401 Unauthorized
```
HTTP 401: Unauthorized
```
**原因**：Gemini API密钥无效或未配置

**解决方案**：
1. 检查 `.env` 文件中的 `GEMINI_API_KEY` 是否正确
2. 访问 https://ai.google.dev/ 获取新的API密钥
3. 重启开发服务器：`npm run dev`

#### 错误2：429 Too Many Requests
```
HTTP 429: Too Many Requests
```
**原因**：API调用次数超过限制

**解决方案**：
1. 等待一段时间后再试（通常1分钟后恢复）
2. 检查是否有其他应用在使用同一个API密钥
3. 升级到付费计划以获得更高配额

#### 错误3：Network Error
```
Network Error / timeout
```
**原因**：网络连接问题

**解决方案**：
1. 检查网络连接是否正常
2. 检查防火墙或代理设置
3. 尝试使用VPN（如果在某些地区）

#### 错误4：CORS Error
```
Access to XMLHttpRequest has been blocked by CORS policy
```
**原因**：跨域请求被阻止（仅在本地开发时）

**解决方案**：
- 本地开发时这是正常现象，部署到Netlify后会自动解决
- 或者使用Netlify Dev进行本地开发：`netlify dev`

### 2. 检查API密钥配置

#### 本地开发环境
检查项目根目录的 `.env` 文件：
```bash
GEMINI_API_KEY=your_actual_api_key_here
```

#### 生产环境（Netlify）
1. 登录Netlify控制台
2. 进入你的站点设置
3. 导航到 Site settings > Environment variables
4. 确认 `GEMINI_API_KEY` 已正确配置

### 3. 验证API密钥是否有效

使用curl命令测试：
```bash
curl -X POST \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [{
      "parts": [{
        "text": "Hello"
      }]
    }]
  }'
```

如果返回正常响应，说明API密钥有效。

### 4. 检查API配额使用情况

1. 访问 Google AI Studio: https://ai.google.dev/
2. 登录你的账号
3. 查看API使用情况和配额限制

**Gemini API免费额度：**
- 每分钟：15次请求
- 每天：1500次请求

### 5. 查看网络请求详情

在浏览器开发者工具中：
1. 打开 Network 标签页
2. 尝试发送一条消息
3. 查找 `generateContent` 请求
4. 检查请求状态和响应内容

### 6. 临时解决方案

如果问题持续存在，可以尝试：

1. **清除浏览器缓存**
   ```
   Ctrl+Shift+Delete (Windows/Linux)
   Cmd+Shift+Delete (Mac)
   ```

2. **清除localStorage**
   在浏览器控制台执行：
   ```javascript
   localStorage.clear();
   location.reload();
   ```

3. **使用隐身模式**
   测试是否是浏览器扩展或缓存问题

4. **切换网络**
   尝试使用不同的网络连接（如手机热点）

## 常见问题FAQ

### Q: 为什么本地开发时总是失败？
A: 本地开发时，浏览器的CORS策略会阻止直接调用Gemini API。建议：
- 部署到Netlify后测试
- 或使用 `netlify dev` 进行本地开发

### Q: API密钥在哪里获取？
A: 访问 https://ai.google.dev/，登录Google账号后即可免费获取API密钥。

### Q: 免费额度用完了怎么办？
A: 
- 等待第二天配额重置
- 创建新的Google账号获取新的API密钥
- 升级到付费计划

### Q: 为什么有时候能用，有时候不能用？
A: 可能原因：
- 达到了每分钟请求限制（15次/分钟）
- 网络不稳定
- Gemini服务临时维护

## 获取帮助

如果以上方法都无法解决问题，请：

1. 记录完整的错误信息（包括浏览器控制台的错误）
2. 记录复现步骤
3. 提交Issue到GitHub仓库
4. 或联系技术支持

## 调试模式

在浏览器控制台执行以下命令启用详细日志：
```javascript
localStorage.setItem('debug', 'true');
location.reload();
```

这将在控制台显示更详细的API请求和响应信息。

关闭调试模式：
```javascript
localStorage.removeItem('debug');
location.reload();
```
