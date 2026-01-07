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
    const response = await fetch(apiUrl);
    const text = await response.text();

    // 解析JSONP响应
    const jsonMatch = text.match(/jsonpgz\((.*)\)/);
    if (!jsonMatch) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to parse fund data' })
      };
    }

    const data = JSON.parse(jsonMatch[1]);

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
        netValue: parseFloat(data.dwjz),
        estimatedValue: parseFloat(data.gsz),
        dailyReturn: parseFloat(data.gszzl),
        updateTime: data.gztime,
        netValueDate: data.jzrq
      })
    };
  } catch (error) {
    console.error('Fund proxy error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ 
        error: 'Failed to fetch fund data',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};

export { handler };
