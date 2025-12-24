import https from 'https';

const apiKey = 'AIzaSyCAdE2PtKhh7ZktZAywXMVR26-oFoKFZOo';
const url = `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`;

https.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('\n📋 可用的 Gemini 模型：\n');
      
      const flashModels = [];
      const proModels = [];
      const otherModels = [];
      
      json.models?.forEach(model => {
        const name = model.name.replace('models/', '');
        const supportedMethods = model.supportedGenerationMethods || [];
        
        if (supportedMethods.includes('generateContent')) {
          const info = {
            name,
            displayName: model.displayName || name,
            description: model.description || 'N/A'
          };
          
          if (name.includes('flash')) {
            flashModels.push(info);
          } else if (name.includes('pro')) {
            proModels.push(info);
          } else {
            otherModels.push(info);
          }
        }
      });
      
      console.log('🚀 Flash 模型（快速、经济）：');
      flashModels.forEach(m => {
        console.log(`   ✅ ${m.name}`);
      });
      
      console.log('\n💎 Pro 模型（强大、精准）：');
      proModels.forEach(m => {
        console.log(`   ✅ ${m.name}`);
      });
      
      if (otherModels.length > 0) {
        console.log('\n🔧 其他模型：');
        otherModels.forEach(m => {
          console.log(`   ✅ ${m.name}`);
        });
      }
      
      console.log(`\n📊 总计: ${flashModels.length + proModels.length + otherModels.length} 个可用模型\n`);
      
    } catch (e) {
      console.error('解析错误:', e.message);
    }
  });
}).on('error', (e) => {
  console.error('请求错误:', e.message);
});
