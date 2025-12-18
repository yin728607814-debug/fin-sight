/**
 * 调试Netlify函数
 */

const https = require('https');

async function debugNetlifyFunction() {
  console.log('🔍 调试Netlify函数...\n');
  
  const url = 'https://incomparable-twilight-fa3852.netlify.app/.netlify/functions/sina-news-proxy?category=nasdaq&num=10';
  
  try {
    const response = await new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const options = {
        hostname: urlObj.hostname,
        path: urlObj.pathname + urlObj.search,
        method: 'GET',
        timeout: 15000
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          resolve({ statusCode: res.statusCode, data: data, headers: res.headers });
        });
      });

      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('超时')); });
      req.end();
    });

    console.log(`HTTP状态码: ${response.statusCode}`);
    console.log(`Content-Type: ${response.headers['content-type']}`);
    console.log(`\n原始响应:\n${response.data.substring(0, 500)}\n`);
    
    // 尝试解析JSON
    try {
      const json = JSON.parse(response.data);
      console.log('✅ JSON解析成功');
      console.log(JSON.stringify(json, null, 2));
    } catch (error) {
      console.log('❌ JSON解析失败');
      console.log(`完整响应:\n${response.data}`);
    }
    
  } catch (error) {
    console.error(`❌ 请求失败: ${error.message}`);
  }
}

debugNetlifyFunction().catch(console.error);
