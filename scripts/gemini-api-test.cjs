/**
 * Gemini API 测试脚本
 * 用于验证 Gemini 2.5 Flash API 是否可以正常调用
 * 
 * 使用方法：
 * npm run test:gemini
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// 从 .env 文件读取 API Key
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) {
    console.error('❌ 错误：未找到 .env 文件');
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=').trim();
      if (key && value) {
        process.env[key.trim()] = value.replace(/^["']|["']$/g, '');
      }
    }
  }
}

// 测试 Gemini API
async function testGeminiAPI() {
  loadEnv();

  const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ 错误：未找到 GEMINI_API_KEY');
    console.log('请在 .env 文件中设置 VITE_GEMINI_API_KEY 或 GEMINI_API_KEY');
    process.exit(1);
  }

  console.log('🔑 API Key:', apiKey.substring(0, 10) + '...');
  console.log('🚀 开始测试 Gemini 2.5 Flash API...\n');

  const testCases = [
    {
      name: '简单文本生成',
      prompt: '请用一句话介绍 Gemini 2.5 Flash 模型。',
      maxTokens: 100
    },
    {
      name: '新闻分析测试',
      prompt: `请分析以下新闻的情感倾向（积极/中性/消极）：

新闻标题：美联储宣布维持利率不变，市场反应平稳
新闻内容：美联储今日宣布维持基准利率在5.25%-5.50%区间不变，符合市场预期。美联储主席表示，将继续关注通胀数据，并根据经济形势调整政策。

请简要回答：情感倾向是什么？`,
      maxTokens: 200
    }
  ];

  for (const testCase of testCases) {
    console.log(`📝 测试：${testCase.name}`);
    console.log(`提示词：${testCase.prompt.substring(0, 50)}...`);
    
    try {
      const result = await callGeminiAPI(apiKey, testCase.prompt, testCase.maxTokens);
      console.log(`✅ 成功！`);
      console.log(`响应：${result.substring(0, 200)}${result.length > 200 ? '...' : ''}`);
      console.log('');
    } catch (error) {
      console.error(`❌ 失败：${error.message}`);
      console.log('');
    }
  }

  console.log('🎉 测试完成！');
}

// 调用 Gemini API
function callGeminiAPI(apiKey, prompt, maxTokens = 1000) {
  return new Promise((resolve, reject) => {
    const model = 'gemini-2.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`;

    const requestBody = JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: maxTokens,
        topP: 0.95,
        topK: 40
      }
    });

    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestBody)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const response = JSON.parse(data);
            const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              resolve(text);
            } else {
              reject(new Error('响应格式错误：未找到文本内容'));
            }
          } catch (error) {
            reject(new Error(`解析响应失败：${error.message}`));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`请求失败：${error.message}`));
    });

    req.write(requestBody);
    req.end();
  });
}

// 运行测试
testGeminiAPI().catch(error => {
  console.error('测试失败:', error);
  process.exit(1);
});
