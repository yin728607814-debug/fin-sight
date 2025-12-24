const https = require('https');

const apiKey = process.env.GEMINI_API_KEY || 'AIzaSyCAdE2PtKhh7ZktZAywXMVR26-oFoKFZOo';
const url = `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`;

https.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('\n📋 可用的 Gemini 模型：\n');
      json.models?.forEach(model => {
        const name = model.name.replace('models/', '');
        const displayName = model.displayName || name;
        const supportedMethods = model.supportedGenerationMethods || [];
        
        if (supportedMethods.includes('generateContent')) {
          console.log(`✅ ${name}`);
          console.log(`   名称: ${displayName}`);
          console.log(`   描述: ${model.description || 'N/A'}`);
          console.log('');
        }
      });
    } catch (e) {
      console.error('解析错误:', e.message);
      console.log('原始响应:', data.substring(0, 500));
    }
  });
}).on('error', (e) => {
  console.error('请求错误:', e.message);
});
