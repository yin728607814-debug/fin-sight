/**
 * 测试环境变量是否正确配置
 */

exports.handler = async (event, _context) => {
  // 处理CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const keys = {
      NEWS_API_KEY: process.env.NEWS_API_KEY,
      ALPHA_VANTAGE_API_KEY: process.env.ALPHA_VANTAGE_API_KEY,
      GEMINI_API_KEY: process.env.GEMINI_API_KEY
    };

    const result = {};
    for (const [key, value] of Object.entries(keys)) {
      if (value) {
        result[key] = {
          exists: true,
          length: value.length,
          first8: value.substring(0, 8),
          last4: value.substring(value.length - 4)
        };
      } else {
        result[key] = { exists: false };
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Environment variables check',
        keys: result,
        allEnvKeys: Object.keys(process.env).filter(k => 
          k.includes('API') || k.includes('KEY') || k.includes('NEWS') || 
          k.includes('ALPHA') || k.includes('GEMINI')
        )
      }, null, 2)
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
