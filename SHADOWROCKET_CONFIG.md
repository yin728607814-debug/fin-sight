# Shadowrocket 分流配置指南

## 📱 适用于投资组合管理系统

Shadowrocket 是 iOS 上最好的代理工具之一，支持强大的规则分流功能。

---

## 🎯 配置目标

- ✅ Gemini AI → 走代理
- ✅ Supabase → 直连
- ✅ GitHub → 直连
- ✅ 汇率 API → 直连
- ✅ Netlify → 直连
- ✅ 国内网站 → 直连

---

## 📋 方案 1: 使用配置文件（推荐）

### 1.1 创建配置文件

复制以下内容，保存为 `portfolio.conf`：

```ini
# Shadowrocket 配置文件
# 投资组合管理系统专用分流规则
# 更新时间: 2026-01-05

[General]
bypass-system = true
skip-proxy = 192.168.0.0/16, 10.0.0.0/8, 172.16.0.0/12, localhost, *.local, captive.apple.com
bypass-tun = 10.0.0.0/8, 100.64.0.0/10, 127.0.0.0/8, 169.254.0.0/16, 172.16.0.0/12, 192.0.0.0/24, 192.0.2.0/24, 192.88.99.0/24, 192.168.0.0/16, 198.18.0.0/15, 198.51.100.0/24, 203.0.113.0/24, 224.0.0.0/4, 255.255.255.255/32
dns-server = system, 223.5.5.5, 119.29.29.29, 114.114.114.114

[Rule]
# ========================================
# AI 服务 - 走代理
# ========================================
DOMAIN-SUFFIX,googleapis.com,PROXY
DOMAIN-SUFFIX,generativelanguage.googleapis.com,PROXY
DOMAIN-SUFFIX,google.com,PROXY
DOMAIN-SUFFIX,googleusercontent.com,PROXY
DOMAIN-KEYWORD,gemini,PROXY

# ========================================
# 开发服务 - 直连
# ========================================

# Supabase - 直连
DOMAIN-SUFFIX,supabase.co,DIRECT
DOMAIN-SUFFIX,supabase.io,DIRECT
DOMAIN-KEYWORD,supabase,DIRECT

# GitHub - 直连
DOMAIN-SUFFIX,github.com,DIRECT
DOMAIN-SUFFIX,githubusercontent.com,DIRECT
DOMAIN-SUFFIX,github.io,DIRECT
DOMAIN-SUFFIX,githubassets.com,DIRECT
DOMAIN-KEYWORD,github,DIRECT

# Netlify - 直连
DOMAIN-SUFFIX,netlify.app,DIRECT
DOMAIN-SUFFIX,netlify.com,DIRECT
DOMAIN-KEYWORD,netlify,DIRECT

# 汇率 API - 直连
DOMAIN-SUFFIX,exchangerate-api.com,DIRECT
DOMAIN-SUFFIX,frankfurter.app,DIRECT

# Yahoo Finance - 直连
DOMAIN-SUFFIX,yahoo.com,DIRECT
DOMAIN-SUFFIX,yahooapis.com,DIRECT
DOMAIN-KEYWORD,yahoo,DIRECT

# ========================================
# 国内服务 - 直连
# ========================================
DOMAIN-SUFFIX,cn,DIRECT
DOMAIN-KEYWORD,baidu,DIRECT
DOMAIN-KEYWORD,taobao,DIRECT
DOMAIN-KEYWORD,alipay,DIRECT
DOMAIN-KEYWORD,wechat,DIRECT
DOMAIN-KEYWORD,weixin,DIRECT
DOMAIN-KEYWORD,qq,DIRECT
DOMAIN-KEYWORD,aliyun,DIRECT
DOMAIN-KEYWORD,tencent,DIRECT

# Apple 服务 - 直连
DOMAIN-SUFFIX,apple.com,DIRECT
DOMAIN-SUFFIX,icloud.com,DIRECT
DOMAIN-SUFFIX,apple-cloudkit.com,DIRECT

# ========================================
# 地理位置规则
# ========================================
GEOIP,CN,DIRECT

# ========================================
# 默认规则
# ========================================
FINAL,PROXY

[Host]
localhost = 127.0.0.1

[URL Rewrite]
# 如果需要 URL 重写规则，在这里添加
```

### 1.2 导入配置

**方法 1: 通过 iCloud/AirDrop**
1. 将 `portfolio.conf` 文件传到 iPhone
2. 打开 Shadowrocket
3. 点击右上角 `+` → `从文件导入`
4. 选择 `portfolio.conf`

**方法 2: 通过 URL**
1. 将配置文件上传到 GitHub Gist 或其他地方
2. 在 Shadowrocket 中点击 `+` → `从 URL 导入`
3. 输入配置文件的 URL

**方法 3: 手动复制**
1. 打开 Shadowrocket
2. 点击 "配置" → "添加配置"
3. 粘贴上面的配置内容

---

## 📋 方案 2: 手动添加规则

如果不想导入配置文件，可以手动添加规则：

### 2.1 进入规则设置

1. 打开 Shadowrocket
2. 点击底部 "配置"
3. 点击当前使用的配置
4. 点击 "规则"

### 2.2 添加规则（按顺序）

**AI 服务 - 走代理**:
```
类型: DOMAIN-SUFFIX
值: googleapis.com
策略: PROXY
```

```
类型: DOMAIN-SUFFIX
值: generativelanguage.googleapis.com
策略: PROXY
```

```
类型: DOMAIN-SUFFIX
值: google.com
策略: PROXY
```

**Supabase - 直连**:
```
类型: DOMAIN-SUFFIX
值: supabase.co
策略: DIRECT
```

```
类型: DOMAIN-SUFFIX
值: supabase.io
策略: DIRECT
```

**GitHub - 直连**:
```
类型: DOMAIN-SUFFIX
值: github.com
策略: DIRECT
```

```
类型: DOMAIN-SUFFIX
值: githubusercontent.com
策略: DIRECT
```

**汇率 API - 直连**:
```
类型: DOMAIN-SUFFIX
值: exchangerate-api.com
策略: DIRECT
```

```
类型: DOMAIN-SUFFIX
值: frankfurter.app
策略: DIRECT
```

**Netlify - 直连**:
```
类型: DOMAIN-SUFFIX
值: netlify.app
策略: DIRECT
```

**Yahoo Finance - 直连**:
```
类型: DOMAIN-SUFFIX
值: yahoo.com
策略: DIRECT
```

**国内网站 - 直连**:
```
类型: DOMAIN-SUFFIX
值: cn
策略: DIRECT
```

```
类型: GEOIP
值: CN
策略: DIRECT
```

**默认规则**:
```
类型: FINAL
策略: PROXY
```

---

## 🔧 配置步骤（详细图文）

### 步骤 1: 打开 Shadowrocket

<img src="shadowrocket-icon.png" width="100">

### 步骤 2: 进入配置页面

1. 点击底部 "配置" 标签
2. 你会看到当前使用的配置（通常是 "default.conf"）

### 步骤 3: 选择配置模式

在主页面顶部，确保选择了 "配置" 模式（不是 "全局路由" 或 "直连"）

**重要**：
- ✅ 配置模式：根据规则自动分流
- ❌ 全局路由：所有流量都走代理
- ❌ 直连：所有流量都不走代理

### 步骤 4: 导入或添加规则

选择上面的方案 1 或方案 2

### 步骤 5: 启用配置

1. 返回主页面
2. 打开 Shadowrocket 开关
3. 允许添加 VPN 配置（首次使用需要）

---

## 🧪 测试配置

### 在 iPhone 上测试

**方法 1: 使用 Safari**

1. 打开 Safari
2. 访问以下网址，看是否能正常访问：

```
✅ https://generativelanguage.googleapis.com （应该可以访问）
✅ https://bhedgcynaclprbztcmcl.supabase.co （应该可以访问）
✅ https://github.com （应该可以访问）
✅ https://api.exchangerate-api.com （应该可以访问）
```

**方法 2: 查看 Shadowrocket 日志**

1. 在 Shadowrocket 主页面
2. 点击底部 "日志"
3. 访问上面的网址
4. 查看日志中显示的是 "PROXY" 还是 "DIRECT"

**预期结果**:
```
googleapis.com → PROXY
supabase.co → DIRECT
github.com → DIRECT
exchangerate-api.com → DIRECT
```

---

## 💡 高级技巧

### 技巧 1: 按需切换

如果某个网站访问有问题，可以临时切换：

1. 在 Shadowrocket 主页面
2. 向左滑动服务器
3. 选择 "编辑"
4. 临时修改规则

### 技巧 2: 使用场景模式

Shadowrocket 支持多个配置文件：

1. **开发配置** (`portfolio.conf`)：用于开发时
2. **全局配置** (`global.conf`)：需要全部走代理时
3. **直连配置** (`direct.conf`)：不需要代理时

在 "配置" 页面可以快速切换。

### 技巧 3: 订阅更新

如果你的配置文件托管在网上：

1. 点击配置右侧的 `ℹ️`
2. 点击 "更新配置"
3. 自动获取最新规则

---

## 🔍 故障排查

### 问题 1: Gemini 还是无法访问

**解决方案**:
1. 检查是否选择了 "配置" 模式（不是 "直连"）
2. 检查代理服务器是否正常
3. 在规则中确认 `googleapis.com` 是 `PROXY`

### 问题 2: Supabase 还是超时

**解决方案**:
1. 检查规则顺序，确保 `supabase.co` 在前面
2. 在日志中确认是 `DIRECT` 连接
3. 尝试临时关闭 Shadowrocket 测试

### 问题 3: GitHub 推送失败

**解决方案**:
1. 确认 `github.com` 规则是 `DIRECT`
2. 或者改为 `PROXY` 试试（有些地区 GitHub 需要代理）
3. 使用 Working Copy 等 Git 客户端

### 问题 4: 规则不生效

**解决方案**:
1. 重启 Shadowrocket
2. 关闭再打开 VPN 开关
3. 清除 DNS 缓存：设置 → Safari → 清除历史记录

---

## 📱 推荐配置

根据你的使用场景：

### 场景 1: 日常开发（推荐）

```
模式: 配置
规则: 使用上面的 portfolio.conf
效果: AI 走代理，开发服务直连
```

### 场景 2: 纯开发（不用 AI）

```
模式: 直连
效果: 所有流量直连，速度最快
```

### 场景 3: 需要全局代理

```
模式: 全局路由
效果: 所有流量走代理
```

---

## 🎁 额外资源

### 配置文件下载

我已经为你准备好了配置文件，你可以：

1. 在项目根目录找到 `portfolio.conf`
2. 通过 AirDrop 发送到 iPhone
3. 在 Shadowrocket 中导入

### 快速导入链接

如果你把配置文件上传到了 GitHub：

```
shadowrocket://install?config=https://raw.githubusercontent.com/你的用户名/krio-test/main/portfolio.conf
```

点击这个链接可以直接在 Shadowrocket 中打开。

---

## ✅ 配置完成检查清单

- [ ] 已导入或添加分流规则
- [ ] 已选择 "配置" 模式
- [ ] 已启用 Shadowrocket
- [ ] 测试 Gemini 可以访问
- [ ] 测试 Supabase 可以访问
- [ ] 测试 GitHub 可以访问
- [ ] 查看日志确认规则生效

---

## 🆘 需要帮助？

如果配置后还有问题：

1. 截图 Shadowrocket 的日志
2. 告诉我具体哪个服务无法访问
3. 我会帮你调整规则

---

**创建时间**: 2026-01-05  
**适用设备**: iPhone/iPad  
**适用应用**: Shadowrocket  
**项目**: 投资组合管理系统
