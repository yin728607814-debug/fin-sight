/**
 * Netlify函数 - Gemini翻译API代理
 * 将英文新闻翻译成中文
 */

const https = require('https');

/**
 * Gemini 模型列表（按优先级排序）
 * 注意：Gemini 3 系列需要使用 v1beta API
 */
const GEMINI_MODELS = [
  { model: 'gemini-3-flash-preview', version: 'v1beta' },    // 首选：Gemini 3.0 Flash（快速且强大）
  { model: 'gemini-3-pro-preview', version: 'v1beta' },      // 备选1：Gemini 3.0 Pro（最强但较慢）
  { model: 'gemini-2.5-flash', version: 'v1' },              // 备选2：Gemini 2.5 Flash
  { model: 'gemini-2.5-pro', version: 'v1' },                // 备选3：Gemini 2.5 Pro
  { model: 'gemini-2.0-flash', version: 'v1' },              // 备选4：Gemini 2.0 Flash
];

/**
 * 调用 Gemini API（带自动降级）
 */
async function callGeminiWithFallback(apiKey, prompt) {
  let lastError = null;

  for (const { model, version } of GEMINI_MODELS) {
    try {
      const requestData = JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 4096  // 增加到 4096，用于翻译较长的文本
        }
      });

      const url = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${apiKey}`;

      const response = await new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const options = {
          hostname: urlObj.hostname,
          path: urlObj.pathname + urlObj.search,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(requestData)
          }
        };

        const req = https.request(options, (res) => {
          let data = '';
          
          res.on('data', (chunk) => {
            data += chunk;
          });
          
          res.on('end', () => {
            try {
              const jsonData = JSON.parse(data);
              resolve({
                statusCode: res.statusCode,
                data: jsonData
              });
            } catch (error) {
              reject(new Error(`Failed to parse JSON: ${error.message}`));
            }
          });
        });

        req.on('error', (error) => {
          reject(error);
        });

        req.write(requestData);
        req.end();
      });

      const translatedText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (translatedText) {
        if (model !== GEMINI_MODELS[0].model) {
          console.log(`ℹ️ 使用备用模型: ${model} (${version})`);
        }
        return translatedText.trim();
      }

      // 如果没有文本但有错误信息
      if (response.data?.error) {
        throw new Error(response.data.error.message || 'Unknown error');
      }

    } catch (error) {
      lastError = error;
      const status = error.response?.status || error.statusCode;
      
      // 503 (服务过载) 或 429 (配额限制) 时尝试下一个模型
      if (status === 503 || status === 429) {
        console.log(`⚠️ ${model} 不可用 (${status})，尝试下一个模型...`);
        continue;
      }
      
      // 其他错误直接抛出
      throw error;
    }
  }

  // 所有模型都失败
  throw lastError || new Error('所有 Gemini 模型都不可用');
}

exports.handler = async (event, _context) => {
  // 只允许POST请求
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // 处理预检请求
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  try {
    // 从环境变量获取API密钥
    const apiKey = process.env.GEMINI_API_KEY;
    
    console.log('🔑 检查Gemini API密钥:', {
      hasGeminiApiKey: !!process.env.GEMINI_API_KEY,
      finalApiKey: apiKey ? apiKey.substring(0, 10) + '...' : 'none'
    });
    
    if (!apiKey) {
      console.error('❌ Gemini API密钥未配置');
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: 'Gemini API key not configured'
        })
      };
    }

    // 解析请求体
    const { text } = JSON.parse(event.body || '{}');
    
    if (!text) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: 'Text parameter is required' 
        })
      };
    }

    console.log('📥 收到翻译请求:', { textLength: text.length });

    // 调用Gemini API（带自动降级）
    try {
      const translatedText = await callGeminiWithFallback(
        apiKey,
        `请将以下英文翻译成中文，保持原意和专业性，只返回翻译结果，不要添加任何解释：\n\n${text}`
      );

      console.log('✅ 翻译成功，长度:', translatedText.length);

      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          translatedText
        })
      };
    } catch (apiError) {
      console.error('❌ Gemini API调用失败:', apiError.message);
      
      // 返回原文作为后备
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          translatedText: text,
          error: 'Translation failed, returning original text'
        })
      };
    }

  } catch (error) {
    console.error('Translation error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message
      })
    };
  }
};