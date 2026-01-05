# macOS 小火箭 + Kiro 配置指南

## 🎯 目标
- ✅ Kiro 响应快（直连）
- ✅ Anthropic/Claude 快（直连）
- ✅ Supabase 稳定（直连）
- ✅ GitHub 推送快（直连）
- ✅ Google/Gemini 可访问（走代理）

---

## 🚀 快速配置（3 分钟搞定）

### 步骤 1: 打开小火箭配置

1. 点击菜单栏的小火箭图标
2. 点击 "配置" → "编辑配置"
3. 或者直接点击 "配置" → "从文件导入"

### 步骤 2: 导入配置文件

**方法 A: 直接导入（推荐）**

你的项目里已经有 `portfolio.conf` 文件了，我已经更新过了：

1. 在小火箭中点击 "配置" → "从文件导入"
2. 选择项目根目录的 `portfolio.conf`
3. 完成！

**方法 B: 手动编辑**

如果导入不成功，可以手动编辑：

1. 点击 "配置" → "编辑配置"
2. 找到 `[Rule]` 部分
3. 在最前面添加以下规则：

```ini
# Kiro - 直连（重要！）
DOMAIN-SUFFIX,kiro.ai,DIRECT
DOMAIN-SUFFIX,kiroai.com,DIRECT
DOMAIN-KEYWORD,kiro,DIRECT

# Anthropic Claude - 直连
DOMAIN-SUFFIX,anthropic.com,DIRECT
DOMAIN-SUFFIX,claude.ai,DIRECT

# Supabase - 直连
DOMAIN-SUFFIX,supabase.co,DIRECT
DOMAIN-SUFFIX,supabase.io,DIRECT

# GitHub - 直连
DOMAIN-SUFFIX,github.com,DIRECT
DOMAIN-SUFFIX,githubusercontent.com,DIRECT

# Google/Gemini - 走代理
DOMAIN-SUFFIX,googleapis.com,PROXY
DOMAIN-SUFFIX,google.com,PROXY
```

### 步骤 3: 选择正确的模式

**重要！** 在小火箭主界面：

1. 点击顶部的模式选择
2. 选择 **"配置"** 模式（不是"全局"或"直连"）
3. 确保小火箭是开启状态

---

## 📋 完整配置文件

如果你想完全重新配置，这是完整版本：

```ini
# Shadowrocket 配置文件 - macOS + Kiro 专用
# 更新时间: 2026-01-05

[General]
bypass-system = true
skip-proxy = 192.168.0.0/16, 10.0.0.0/8, 172.16.0.0/12, localhost, *.local
bypass-tun = 10.0.0.0/8, 100.64.0.0/10, 127.0.0.0/8, 169.254.0.0/16, 172.16.0.0/12, 192.0.0.0/24, 192.168.0.0/16, 198.18.0.0/15, 224.0.0.0/4, 255.255.255.255/32
dns-server = system, 223.5.5.5, 119.29.29.29

[Rule]
# ========================================
# 开发工具 - 直连（最重要！）
# ========================================

# Kiro IDE - 直连
DOMAIN-SUFFIX,kiro.ai,DIRECT
DOMAIN-SUFFIX,kiroai.com,DIRECT
DOMAIN-KEYWORD,kiro,DIRECT

# Anthropic Claude - 直连
DOMAIN-SUFFIX,anthropic.com,DIRECT
DOMAIN-SUFFIX,claude.ai,DIRECT
DOMAIN-KEYWORD,anthropic,DIRECT

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

# 汇率 API - 直连
DOMAIN-SUFFIX,exchangerate-api.com,DIRECT
DOMAIN-SUFFIX,frankfurter.app,DIRECT

# Yahoo Finance - 直连
DOMAIN-SUFFIX,yahoo.com,DIRECT
DOMAIN-SUFFIX,yahooapis.com,DIRECT

# ========================================
# 国内服务 - 直连
# ========================================
DOMAIN-SUFFIX,cn,DIRECT
DOMAIN-KEYWORD,baidu,DIRECT
DOMAIN-KEYWORD,taobao,DIRECT
DOMAIN-KEYWORD,alipay,DIRECT
DOMAIN-KEYWORD,wechat,DIRECT
DOMAIN-KEYWORD,qq,DIRECT

# Apple 服务 - 直连
DOMAIN-SUFFIX,apple.com,DIRECT
DOMAIN-SUFFIX,icloud.com,DIRECT

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
```

---

## 🧪 测试配置

### 方法 1: 使用终端测试

打开终端，运行：

```bash
# 测试 Kiro（应该很快，不走代理）
time curl -I https://kiro.ai

# 测试 Anthropic（应该很快，不走代理）
time curl -I https://anthropic.com

# 测试 Supabase（应该很快，不走代理）
time curl -I https://bhedgcynaclprbztcmcl.supabase.co

# 测试 Google（走代理）
time curl -I https://google.com
```

**预期结果**：
- Kiro、Anthropic、Supabase 响应时间 < 1 秒
- Google 可以访问（可能稍慢）

### 方法 2: 查看小火箭日志

1. 点击小火箭图标
2. 点击 "日志"
3. 访问 Kiro 或其他网站
4. 查看日志中显示的是 `DIRECT` 还是 `PROXY`

**预期日志**：
```
kiro.ai → DIRECT
anthropic.com → DIRECT
supabase.co → DIRECT
github.com → DIRECT
google.com → PROXY
```

---

## 💡 使用技巧

### 技巧 1: 快速切换模式

在小火箭菜单中：
- **配置模式**：按规则自动分流（推荐日常使用）
- **全局模式**：所有流量走代理（需要全部翻墙时）
- **直连模式**：所有流量不走代理（不需要代理时）

### 技巧 2: 临时禁用某个规则

如果某个网站访问有问题：
1. 点击 "配置" → "编辑配置"
2. 在对应规则前加 `#` 注释掉
3. 保存并重新加载配置

### 技巧 3: 查看实时连接

点击小火箭图标 → "活动连接"，可以看到：
- 哪些域名正在连接
- 是走代理还是直连
- 连接速度如何

---

## 🔧 常见问题

### Q1: 配置后 Kiro 还是慢？

**检查步骤**：

1. **确认模式**
   ```
   小火箭图标 → 查看当前模式
   应该是 "配置" 而不是 "全局"
   ```

2. **查看日志**
   ```
   小火箭 → 日志 → 访问 kiro.ai
   应该显示 "DIRECT"
   ```

3. **清除 DNS 缓存**
   ```bash
   sudo dscacheutil -flushcache
   sudo killall -HUP mDNSResponder
   ```

4. **重启小火箭**
   ```
   关闭小火箭 → 等待 5 秒 → 重新打开
   ```

### Q2: GitHub 推送还是失败？

**解决方案**：

```bash
# 方法 1: 临时不用代理推送
git -c http.proxy= push

# 方法 2: 永久设置 GitHub 不走代理
git config --global http.https://github.com.proxy ""

# 方法 3: 检查 Git 代理设置
git config --global --get http.proxy
# 如果有输出，说明 Git 配置了代理，清除它：
git config --global --unset http.proxy
```

### Q3: 某些网站无法访问？

**诊断**：

1. **查看是否被规则匹配**
   ```
   小火箭 → 日志 → 访问该网站
   查看走的是 DIRECT 还是 PROXY
   ```

2. **临时测试**
   ```bash
   # 测试直连
   curl -I https://网站地址
   
   # 测试走代理
   curl -x socks5://127.0.0.1:1080 -I https://网站地址
   ```

3. **调整规则**
   - 如果应该直连但走了代理：在规则前面添加 `DOMAIN-SUFFIX,网站域名,DIRECT`
   - 如果应该走代理但直连了：在规则前面添加 `DOMAIN-SUFFIX,网站域名,PROXY`

### Q4: 如何知道小火箭的代理端口？

```bash
# 查看小火箭配置
小火箭 → 设置 → 本地代理

# 通常是：
# SOCKS5: 127.0.0.1:1080
# HTTP: 127.0.0.1:1087
```

---

## 🎯 推荐配置

根据你的使用场景：

### 日常开发（推荐）
```
模式: 配置
规则: 使用上面的完整配置
效果: 
  - Kiro 快速响应 ✅
  - 开发服务稳定 ✅
  - AI 服务可访问 ✅
```

### 纯开发（不用 AI）
```
模式: 直连
效果: 所有流量直连，最快
```

### 需要全局翻墙
```
模式: 全局
效果: 所有流量走代理
```

---

## 📱 快速操作

### 一键切换脚本

创建 `~/switch-proxy.sh`：

```bash
#!/bin/bash

case "$1" in
  "dev")
    echo "🔧 切换到开发模式（配置分流）"
    # 小火箭会自动应用配置文件
    ;;
  "off")
    echo "🔌 关闭代理"
    # 在小火箭中选择"直连"模式
    ;;
  "on")
    echo "🌐 开启全局代理"
    # 在小火箭中选择"全局"模式
    ;;
  *)
    echo "用法: $0 {dev|off|on}"
    echo "  dev  - 开发模式（智能分流）"
    echo "  off  - 关闭代理"
    echo "  on   - 全局代理"
    ;;
esac
```

使用：
```bash
chmod +x ~/switch-proxy.sh
~/switch-proxy.sh dev   # 开发模式
~/switch-proxy.sh off   # 关闭代理
~/switch-proxy.sh on    # 全局代理
```

---

## ✅ 配置完成检查清单

- [ ] 已导入或更新 `portfolio.conf`
- [ ] 小火箭选择了 "配置" 模式
- [ ] 测试 Kiro 响应快速（< 1 秒）
- [ ] 测试 Anthropic 响应快速
- [ ] 测试 Supabase 连接正常
- [ ] 测试 GitHub 推送正常
- [ ] 测试 Google/Gemini 可访问
- [ ] 查看日志确认规则生效

---

## 🆘 还是有问题？

如果按照上面的步骤配置后还有问题：

1. **截图小火箭的日志**（访问 kiro.ai 时的日志）
2. **告诉我具体哪个服务有问题**
3. **运行测试命令并告诉我结果**：
   ```bash
   curl -v https://kiro.ai 2>&1 | grep -E "(Connected|Host)"
   ```

我会帮你进一步诊断！

---

**创建时间**: 2026-01-05  
**适用系统**: macOS  
**适用工具**: Shadowrocket (小火箭)  
**项目**: 投资组合管理系统
