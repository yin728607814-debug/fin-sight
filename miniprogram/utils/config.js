module.exports = {
  // 你的 Cloudflare Pages/Functions 生产域名，例如：https://finsight.example.pages.dev
  apiBaseUrl: 'https://fin-sight.top',

  // Supabase 项目配置。anon key 是公开客户端密钥，仍建议只填自己的项目。
  supabaseUrl: 'https://bhedgcynaclprbztcmcl.supabase.co',
  supabaseAnonKey: 'sb_publishable_wQzNQgLEPJn7P4n46eiFyw_LhJnpwu3',

  // 界面开发期间保持 true，避免消耗新闻与 Gemini API 调用次数。
  useDemoMarketData: true,

  appName: '双衡观察'
};
