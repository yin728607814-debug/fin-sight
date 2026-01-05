# VPN 分流配置指南

## 问题说明

在开发投资组合管理系统时，你可能遇到以下问题：
- **挂 VPN**：可以访问 Gemini AI，但 Supabase 和 GitHub 会超时
- **不挂 VPN**：Supabase 和 GitHub 正常，但无法访问 Gemini AI

**解决方案**：配置 VPN 分流，让不同的服务走不同的路由。

---

## 方案 1: Clash 分流配置（推荐）

### 1.1 安装 Clash

**Windows/Mac**:
- 下载 [Clash for Windows](https://github.com/Fndroid/clash_for_windows_pkg/releases)
- 或使用 [ClashX](https://github.com/yichengchen/clashX/releases) (Mac)

**配置文件位置**:
- Windows: `C:\Users\你的用户名\.config\clash\config.yaml`
- Mac: `~/.config/clash/config.yaml`

### 1.2 完整配置文件

创建或编辑 `config.yaml`：

```yaml
# Clash 配置文件 - 投资组合系统专用分流规则

# 代理服务器配置（替换为你的实际配置）
proxies:
  - name: "你的代理服务器"
    type: ss  # 或 vmess, trojan 等
    server: your-server.com
    port: 443
    # ... 其他配置

# 代理组
proxy-groups:
  - name: "PROXY"
    type: select
    proxies:
      - "你的代理服务器"
      - DIRECT

  - name: "AI-Services"
    type: select
    proxies:
      - "你的代理服务器"

  - name: "Development"
    type: select
    proxies:
      - DIRECT
      - "你的代理服务器"

# 分流规则（重点！）
rules:
  # ========================================
  # AI 服务 - 必须走代理
  # ========================================
  - DOMAIN-SUFFIX,googleapis.com,AI-Services
  - DOMAIN-SUFFIX,generativelanguage.googleapis.com,AI-Services
  - DOMAIN-SUFFIX,google.com,AI-Services
  - DOMAIN-SUFFIX,googleusercontent.com,AI-Services
  
  # ========================================
  # 开发服务 - 直连（不走代理）
  # ========================================
  
  # Supabase - 直连
  - DOMAIN-SUFFIX,supabase.co,Development
  - DOMAIN-SUFFIX,supabase.io,Development
  - DOMAIN-KEYWORD,supabase,Development
  
  # GitHub - 直连（如果速度慢可以改为 PROXY）
  - DOMAIN-SUFFIX,github.com,Development
  - DOMAIN-SUFFIX,githubusercontent.com,Development
  - DOMAIN-SUFFIX,github.io,Development
  - DOMAIN-SUFFIX,githubassets.com,Development
  
  # Netlify - 直连
  - DOMAIN-SUFFIX,netlify.app,Development
  - DOMAIN-SUFFIX,netlify.com,Development
  
  # 汇率 API - 直连
  - DOMAIN-SUFFIX,exchangerate-api.com,Development
  - DOMAIN-SUFFIX,frankfurter.app,Development
  
  # Yahoo Finance - 直连
  - DOMAIN-SUFFIX,yahoo.com,Development
  - DOMAIN-KEYWORD,yahoo,Development
  
  # ========================================
  # 国内网站 - 直连
  # ========================================
  - DOMAIN-SUFFIX,cn,DIRECT
  - DOMAIN-KEYWORD,baidu,DIRECT
  - DOMAIN-KEYWORD,taobao,DIRECT
  - DOMAIN-KEYWORD,alipay,DIRECT
  - DOMAIN-KEYWORD,wechat,DIRECT
  - DOMAIN-KEYWORD,qq,DIRECT
  
  # 局域网 - 直连
  - IP-CIDR,192.168.0.0/16,DIRECT
  - IP-CIDR,10.0.0.0/8,DIRECT
  - IP-CIDR,172.16.0.0/12,DIRECT
  - IP-CIDR,127.0.0.0/8,DIRECT
  
  # 默认规则
  - GEOIP,CN,DIRECT
  - MATCH,PROXY
```

### 1.3 使用步骤

1. **导入配置**
   - 打开 Clash
   - 点击 "Profiles"
   - 导入上面的配置文件

2. **启用规则模式**
   - 在 Clash 主界面选择 "Rule" 模式
   - 不要选择 "Global" 或 "Direct"

3. **测试配置**
   ```bash
   # 测试 Gemini（应该走代理）
   curl -I https://generativelanguage.googleapis.com
   
   # 测试 Supabase（应该直连）
   curl -I https://你的项目.supabase.co
   
   # 测试 GitHub（应该直连）
   curl -I https://github.com
   ```

---

## 方案 2: 系统 PAC 配置

如果你使用的是简单的 VPN 客户端，可以配置 PAC 文件：

### 2.1 创建 PAC 文件

创建 `proxy.pac` 文件：

```javascript
function FindProxyForURL(url, host) {
    // AI 服务 - 走代理
    if (shExpMatch(host, "*.googleapis.com") ||
        shExpMatch(host, "*.google.com") ||
        shExpMatch(host, "*generativelanguage*")) {
        return "PROXY 127.0.0.1:7890"; // 替换为你的代理地址
    }
    
    // 开发服务 - 直连
    if (shExpMatch(host, "*.supabase.co") ||
        shExpMatch(host, "*.supabase.io") ||
        shExpMatch(host, "*.github.com") ||
        shExpMatch(host, "*.netlify.app") ||
        shExpMatch(host, "*.exchangerate-api.com") ||
        shExpMatch(host, "*.frankfurter.app") ||
        shExpMatch(host, "*.yahoo.com")) {
        return "DIRECT";
    }
    
    // 国内网站 - 直连
    if (shExpMatch(host, "*.cn") ||
        shExpMatch(host, "*baidu*") ||
        shExpMatch(host, "*taobao*") ||
        shExpMatch(host, "*alipay*")) {
        return "DIRECT";
    }
    
    // 局域网 - 直连
    if (isInNet(host, "192.168.0.0", "255.255.0.0") ||
        isInNet(host, "10.0.0.0", "255.0.0.0") ||
        isInNet(host, "127.0.0.0", "255.0.0.0")) {
        return "DIRECT";
    }
    
    // 默认 - 走代理
    return "PROXY 127.0.0.1:7890"; // 替换为你的代理地址
}
```

### 2.2 使用 PAC 文件

**Windows**:
1. 打开 "设置" → "网络和 Internet" → "代理"
2. 启用 "使用设置脚本"
3. 输入 PAC 文件路径：`file:///C:/path/to/proxy.pac`

**Mac**:
1. 打开 "系统偏好设置" → "网络"
2. 选择当前网络 → "高级" → "代理"
3. 勾选 "自动代理配置"
4. 输入 PAC 文件路径：`file:///Users/你的用户名/proxy.pac`

---

## 方案 3: Git 单独配置代理

如果只是 Git 推送有问题，可以单独配置：

### 3.1 GitHub 走代理

```bash
# 只对 GitHub 使用代理
git config --global http.https://github.com.proxy socks5://127.0.0.1:7890

# 或使用 HTTP 代理
git config --global http.https://github.com.proxy http://127.0.0.1:7890
```

### 3.2 取消代理

```bash
# 取消 GitHub 代理
git config --global --unset http.https://github.com.proxy
```

### 3.3 临时使用代理

```bash
# 单次推送使用代理
git -c http.proxy=socks5://127.0.0.1:7890 push

# 单次推送不使用代理
git -c http.proxy= push
```

---

## 方案 4: 浏览器扩展（开发时使用）

### 4.1 SwitchyOmega (Chrome/Edge)

1. 安装 [SwitchyOmega](https://chrome.google.com/webstore/detail/proxy-switchyomega/padekgcemlokbadohgkifijomclgjgif)

2. 配置规则：

**情景模式 - AI Services**:
- 代理协议：SOCKS5
- 代理服务器：127.0.0.1
- 代理端口：7890

**情景模式 - Direct**:
- 直接连接

**自动切换规则**:
```
*.googleapis.com          → AI Services
*.google.com              → AI Services
*.supabase.co             → Direct
*.supabase.io             → Direct
*.github.com              → Direct
*.netlify.app             → Direct
*.exchangerate-api.com    → Direct
*.frankfurter.app         → Direct
```

---

## 验证配置

### 测试脚本

创建 `test-network.sh`：

```bash
#!/bin/bash

echo "🧪 测试网络配置..."
echo ""

echo "1️⃣ 测试 Gemini API (应该可访问):"
curl -I -s https://generativelanguage.googleapis.com | head -n 1

echo ""
echo "2️⃣ 测试 Supabase (应该可访问):"
curl -I -s https://bhedgcynaclprbztcmcl.supabase.co | head -n 1

echo ""
echo "3️⃣ 测试 GitHub (应该可访问):"
curl -I -s https://github.com | head -n 1

echo ""
echo "4️⃣ 测试汇率 API (应该可访问):"
curl -I -s https://api.exchangerate-api.com | head -n 1

echo ""
echo "✅ 测试完成！"
```

运行测试：
```bash
chmod +x test-network.sh
./test-network.sh
```

---

## 推荐配置

根据你的情况，我推荐：

1. **首选**：使用 Clash + 规则模式
   - 最灵活
   - 自动分流
   - 性能好

2. **备选**：浏览器使用 SwitchyOmega + Git 单独配置
   - 开发时浏览器自动分流
   - Git 推送时手动切换

3. **临时**：需要时手动开关 VPN
   - 最简单
   - 但需要频繁切换

---

## 常见问题

### Q1: 配置后还是超时？
**A**: 检查代理端口是否正确，通常是 7890 或 1080

### Q2: GitHub 速度慢？
**A**: 可以将 GitHub 改为走代理：
```yaml
- DOMAIN-SUFFIX,github.com,PROXY
```

### Q3: 如何查看当前代理端口？
**A**: 
- Clash: 查看 "General" → "Port"
- 其他 VPN: 查看设置中的本地端口

### Q4: 配置后需要重启吗？
**A**: 
- Clash: 不需要，切换配置即可
- 系统代理: 需要重新连接网络
- Git: 不需要

---

## 下一步

配置完成后：

1. **测试网络**：运行上面的测试脚本
2. **推送代码**：`git push`
3. **访问应用**：测试 Supabase 和 Gemini 是否都正常

如果还有问题，可以查看 Clash 的日志来诊断。

---

**创建时间**: 2026-01-05
**适用项目**: 投资组合管理系统
**维护者**: Kiro AI Assistant
