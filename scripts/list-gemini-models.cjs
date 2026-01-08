/**
 * 列出所有可用的 Gemini 模型
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

// 列出模型
function listModels(apiKey) {
  return new Promise((resolve, reject) => {
    const url = `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`;

    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      timeout: 30000
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
            resolve(response);
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

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('请求超时'));
    });

    req.end();
  });
}

// 运行
async function run() {
  loadEnv();

  const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ 错误：未找到 GEMINI_API_KEY');
    process.exit(1);
  }

  console.log('🔑 API Key:', apiKey.substring(0, 10) + '...');
  console.log('🚀 获取可用的 Gemini 模型列表...\n');

  try {
    const response = await listModels(apiKey);
    
    if (response.models && Array.isArray(response.models)) {
      console.log(`✅ 找到 ${response.models.length} 个模型：\n`);
      
      // 过滤支持 generateContent 的模型
      const generateModels = response.models.filter(model => 
        model.supportedGenerationMethods?.includes('generateContent')
      );
      
      console.log(`📝 支持 generateContent 的模型 (${generateModels.length}个)：\n`);
      
      generateModels.forEach(model => {
        console.log(`  • ${model.name}`);
        console.log(`    显示名称: ${model.displayName || 'N/A'}`);
        console.log(`    描述: ${model.description || 'N/A'}`);
        console.log('');
      });
    } else {
      console.log('❌ 未找到模型列表');
    }
  } catch (error) {
    console.error('❌ 获取模型列表失败:', error.message);
  }
}

run();
