# 双衡观察微信小程序版

这是从当前 React Web 项目拆出来的微信小程序适配版，保留：

- Supabase 邮箱登录 / 注册
- 黄金分析页
- 纳斯达克100分析页
- 新闻列表、近 5 日价格、整体 AI 分析、情绪分

## 目录

```text
miniprogram/
├── app.js / app.json / app.wxss
├── pages/
│   ├── login/       # 登录和注册
│   ├── home/        # 黄金 / 纳指入口
│   └── analysis/    # 复用页面，通过 asset=gold|nasdaq 区分
└── utils/
    ├── auth.js      # Supabase Auth REST 适配
    ├── market.js    # 新闻、价格、AI 分析适配
    ├── request.js   # wx.request Promise 封装
    └── config.js    # 小程序运行配置
```

## 配置

编辑 `miniprogram/utils/config.js`：

```js
module.exports = {
  apiBaseUrl: 'https://你的-cloudflare-pages-域名',
  supabaseUrl: 'https://你的项目.supabase.co',
  supabaseAnonKey: '你的 Supabase anon key',
  useDemoMarketData: true,
  appName: '双衡观察'
};
```

`apiBaseUrl` 需要指向已经部署了本项目 `functions/` 的域名。小程序会调用：

- `/eastmoney-news-proxy`
- `/eastmoney-gold-proxy`
- `/sina-news-proxy`
- `/alpha-vantage-proxy`
- `/yahoo-finance-proxy`
- `/gemini-analysis`

在界面开发和联调阶段，请保持 `useDemoMarketData: true`。此时新闻、近 5 日价格和完整分析均使用本地演示数据，页面会显示 `PREVIEW DATA`，不会调用 Gemini 或市场数据接口。

等样式和交互全部确认完毕，需要进行一次真实数据验收时，再将 `useDemoMarketData` 改为 `false`。如果 `apiBaseUrl` 留空，页面仍会显示本地降级数据。

不要把微信小程序 `AppSecret` 写入小程序前端文件；需要使用时应只保存在服务端环境变量中。

## 微信开发者工具

1. 打开微信开发者工具。
2. 导入项目，目录选择 `miniprogram/`。
3. `AppID` 可以先用测试号或游客模式，正式发布时替换为你的小程序 AppID。
4. 在「开发管理 / 开发设置 / 服务器域名」里加入：
   - 你的 Cloudflare Pages 域名
   - 你的 Supabase 域名
5. 真机预览前确认所有请求域名都已备案并配置到 request 合法域名。

## 说明

这个版本没有直接复用 React 组件，而是按微信小程序原生语法重写了一层轻量 UI。这样体积更小，也避开浏览器 API、React Router、Tailwind、Supabase JS SDK 在小程序环境里的兼容问题。
