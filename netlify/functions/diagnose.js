/**
 * Netlify函数 - 诊断环境变量和API连接
 */

const https = require('https');

exports.handler = async (event, _context) => {
  const results = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    envVars: {},
    apiTests: {}
  };

  // 检查环境变量
  const keys = ['NEWS_API_KEY', 'ALPHA_VANTAGE_API_KEY', 'GEMINI_API_KEY'];
  
  keys.forEach(key => {
    const value = process.env[key];
    results.envVars[key] = {
      exists: !!value,
      length: value ? value.length : 0,
      prefix: value ? value.substring(0, 10) + '...' : 'none'
    };
  });

  // 测试Gemini API
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const requestData = JSON.stringify({
        contents: [{
          parts: [{
            text: '测试'
          }]
        }]
      });

      const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;

      const response = await new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const options = {
          hostname: urlObj.hostname,
          path: urlObj.pathname + urlObj.search,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(requestData)
          },
          timeout: 10000
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
              reject(new Error(`JSON解析失败: ${error.message}`));
            }
          });
        });

        req.on('error', (error) => {
          reject(error);
        });

        req.on('timeout', () => {
          req.destroy();
          reject(new Error('Request timeout'));
        });

        req.write(requestData);
        req.end();
      });

      results.apiTests.gemini = {
        success: response.statusCode === 200,
        statusCode: response.statusCode,
        hasError: !!response.data.error,
        errorMessage: response.data.error?.message || null,
        hasCandidates: !!response.data.candidates
      };

    } catch (error) {
      results.apiTests.gemini = {
        success: false,
        error: error.message
      };
    }
  } else {
    results.apiTests.gemini = {
      success: false,
      error: 'GEMINI_API_KEY not configured'
    };
  }

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(results, null, 2)
  };
};
