/**
 * Netlify Function: 基金数据代理
 * 用于绕过CORS限制，代理天天基金网的API请求
 */

import type { Handler, HandlerEvent } from '@netlify/functions';

const handler: Handler = async (event: HandlerEvent) => {
  // 只允许GET请求
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // 获取基金代码
  const fundCode = event.queryStringParameters?.code;
  
  if (!fundCode) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing fund code parameter' })
    };
  }

  try {
    // 请求天天基金网API
    const apiUrl = `http://fundgz.1234567.com.cn/js/${fundCode}.js`;
    console.log(`Fetching fund data for ${fundCode} from ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) {
      console.error(`HTTP error from fund API: ${response.status}`);
      return {
        statusCode: 502,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ 
          error: 'Fund API returned error',
          fundCode,
          httpStatus: response.status
        })
      };
    }
    
    const text = await response.text();
    console.log(`Received response for ${fundCode}:`, text.substring(0, 200));

    // 解析JSONP响应
    const jsonMatch = text.match(/jsonpgz\((.*)\)/);
    if (!jsonMatch) {
      console.error(`Failed to parse JSONP for ${fundCode}. Response:`, text);
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ 
          error: 'Failed to parse fund data - invalid JSONP format',
          fundCode,
          responsePreview: text.substring(0, 100)
        })
      };
    }

    const data = JSON.parse(jsonMatch[1]);
    
    // 验证必要字段
    if (!data.fundcode || !data.name) {
      console.error(`Missing required fields for ${fundCode}:`, data);
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ 
          error: 'Invalid fund data - missing required fields',
          fundCode
        })
      };
    }

    // 返回JSON数据
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300', // 缓存5分钟
        'Access-Control-Allow-Origin': '*', // 允许跨域
      },
      body: JSON.stringify({
        fundCode: data.fundcode,
        fundName: data.name,
        netValue: parseFloat(data.dwjz) || 0,
        estimatedValue: parseFloat(data.gsz) || 0,
        dailyReturn: parseFloat(data.gszzl) || 0,
        updateTime: data.gztime || '',
        netValueDate: data.jzrq || ''
      })
    };
  } catch (error) {
    console.error(`Fund proxy error for ${fundCode}:`, error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ 
        error: 'Failed to fetch fund data',
        fundCode,
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      })
    };
  }
};

export { handler };
