/**
 * Netlify函数 - Gemini翻译API代理
 * 将英文新闻翻译成中文
 */

const https = require('https');

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

    // 调用Gemini API
    const requestData = JSON.stringify({
      contents: [{
        parts: [{
          text: `请将以下英文翻译成中文，保持原意和专业性，只返回翻译结果，不要添加任何解释：\n\n${text}`
        }]
      }]
    });

    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-3-flash:generateContent?key=${apiKey}`;

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
            console.log('📡 Gemini API响应:', {
              statusCode: res.statusCode,
              hasCandidates: !!jsonData.candidates,
              candidatesLength: jsonData.candidates?.length || 0
            });
            
            resolve({
              statusCode: res.statusCode,
              data: jsonData
            });
          } catch (error) {
            console.error('❌ JSON解析失败:', error.message);
            reject(new Error(`Failed to parse JSON: ${error.message}`));
          }
        });
      });

      req.on('error', (error) => {
        console.error('❌ 请求失败:', error);
        reject(error);
      });

      req.write(requestData);
      req.end();
    });

    // 记录完整响应用于调试
    console.log('📦 Gemini完整响应:', JSON.stringify(response.data, null, 2));
    
    // 提取翻译结果
    const translatedText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    console.log('📝 提取的翻译文本:', translatedText);
    
    if (!translatedText) {
      console.warn('⚠️ 翻译结果为空');
      
      // 检查是否有错误信息
      if (response.data?.error) {
        console.error('❌ Gemini API错误:', response.data.error);
        return {
          statusCode: 500,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            error: 'Gemini API error',
            details: response.data.error.message || 'Unknown error',
            translatedText: text // 返回原文作为后备
          })
        };
      }
      
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          translatedText: text // 返回原文
        })
      };
    }

    console.log('✅ 翻译成功，长度:', translatedText.length);

    // 返回结果
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        translatedText: translatedText.trim()
      })
    };

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