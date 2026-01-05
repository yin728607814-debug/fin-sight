# Kiro + VPN 网络问题快速修复指南

## 问题描述
- 不开 VPN：Kiro 响应快，但无法访问某些服务
- 开 VPN：某些服务可访问，但 Kiro 响应慢或超时

## 🚀 快速解决方案（推荐）

### 方案 1: 使用 Clash 分流（最佳）

1. **下载 Clash**
   - Mac: [ClashX](https://github.com/yichengchen/clashX/releases)
   - 下载 ClashX.dmg，安装后打开

2. **导入配置**
   - 点击菜单栏的 ClashX 图标
   - 配置 → 打开配置文件夹
   - 将下面的配置保存为 `config.yaml`

3. **配置内容**（复制到 `~/.config/clash/config.yaml`）:

```yaml
# 最小化 Clash 配置 - Kiro 专用

# 你的代理服务器（替换为实际配置）
proxies:
  - name: "你的代理"
    type: ss  # 或 vmess, trojan 等
    server: your-server.com
    port: 443
    # ... 其他配置

proxy-groups:
  - name: "PROXY"
    type: select
    proxies:
      - "你的代理"
      - DIRECT

# 分流规则
rules:
  # Kiro - 直连（重要！）
  - DOMAIN-SUFFIX,kiro.ai,DIRECT
  - DOMAIN-SUFFIX,kiroai.com,DIRECT
  - DOMAIN-KEYWORD,kiro,DIRECT
  
  # Anthropic Claude - 直连
  - DOMAIN-SUFFIX,anthropic.com,DIRECT
  - DOMAIN-SUFFIX,claude.ai,DIRECT
  
  # AI 服务 - 走代理
  - DOMAIN-SUFFIX,googleapis.com,PROXY
  - DOMAIN-SUFFIX,google.com,PROXY
  
  # Supabase - 直连
  - DOMAIN-SUFFIX,supabase.co,DIRECT
  - DOMAIN-SUFFIX,supabase.io,DIRECT
  
  # GitHub - 走代理（如果慢可以改 DIRECT）
  - DOMAIN-SUFFIX,github.com,PROXY
  
  # 国内 - 直连
  - GEOIP,CN,DIRECT
  
  # 默认 - 走代理
  - MATCH,PROXY
```

4. **启用规则模式**
   - 点击 ClashX 图标
   - 选择 "规则" 模式（不要选全局或直连）
   - 设置为系统代理

5. **测试**
   ```bash
   # 测试 Kiro（应该直连）
   curl -I https://kiro.ai
   
   # 测试 Google（应该走代理）
   curl -I https://google.com
   ```

---

### 方案 2: 临时关闭 VPN（最简单）

如果你主要是和 Kiro 交互，可以：

1. **关闭 VPN**
   - Kiro 会很快
   - Supabase、GitHub 都正常

2. **需要访问被墙服务时**
   - 临时打开 VPN
   - 访问完后关闭

3. **Git 推送时**
   ```bash
   # 关闭 VPN 后推送
   git push
   ```

---

### 方案 3: 只给浏览器设置代理

如果你只是浏览器需要访问某些网站：

1. **安装 SwitchyOmega**
   - Chrome/Edge: [SwitchyOmega](https://chrome.google.com/webstore/detail/proxy-switchyomega/padekgcemlokbadohgkifijomclgjgif)

2. **配置代理**
   - 新建情景模式 "Proxy"
   - 代理协议: SOCKS5
   - 代理服务器: 127.0.0.1
   - 代理端口: 7890（或你的 VPN 端口）

3. **添加规则**
   ```
   *.google.com     → Proxy
   *.googleapis.com → Proxy
   *.kiro.ai        → 直接连接
   *.anthropic.com  → 直接连接
   *.supabase.co    → 直接连接
   *.github.com     → 直接连接
   ```

4. **使用**
   - 浏览器走代理
   - Kiro、终端、Git 都直连

---

### 方案 4: 系统级 PAC 配置

如果你想要系统级别的分流：

1. **创建 PAC 文件** (`~/proxy.pac`):

```javascript
function FindProxyForURL(url, host) {
    // Kiro - 直连
    if (shExpMatch(host, "*.kiro.ai") ||
        shExpMatch(host, "*.kiroai.com") ||
        shExpMatch(host, "*kiro*")) {
        return "DIRECT";
    }
    
    // Anthropic - 直连
    if (shExpMatch(host, "*.anthropic.com") ||
        shExpMatch(host, "*.claude.ai")) {
        return "DIRECT";
    }
    
    // Supabase - 直连
    if (shExpMatch(host, "*.supabase.co") ||
        shExpMatch(host, "*.supabase.io")) {
        return "DIRECT";
    }
    
    // GitHub - 直连
    if (shExpMatch(host, "*.github.com") ||
        shExpMatch(host, "*.githubusercontent.com")) {
        return "DIRECT";
    }
    
    // Google - 走代理
    if (shExpMatch(host, "*.google.com") ||
        shExpMatch(host, "*.googleapis.com")) {
        return "PROXY 127.0.0.1:7890"; // 替换为你的代理端口
    }
    
    // 国内 - 直连
    if (shExpMatch(host, "*.cn")) {
        return "DIRECT";
    }
    
    // 局域网 - 直连
    if (isInNet(host, "192.168.0.0", "255.255.0.0") ||
        isInNet(host, "10.0.0.0", "255.0.0.0") ||
        isInNet(host, "127.0.0.0", "255.0.0.0")) {
        return "DIRECT";
    }
    
    // 默认 - 走代理
    return "PROXY 127.0.0.1:7890"; // 替换为你的代理端口
}
```

2. **应用 PAC 文件**
   - 打开 "系统偏好设置" → "网络"
   - 选择当前网络 → "高级" → "代理"
   - 勾选 "自动代理配置"
   - URL: `file:///Users/你的用户名/proxy.pac`
   - 点击 "好"

---

## 🎯 我的推荐

根据你的情况，我建议：

### 开发时（推荐）
```
使用 Clash + 规则模式
- Kiro: 直连（快速响应）
- Supabase: 直连（稳定）
- GitHub: 直连（推送快）
- Google/Gemini: 走代理（可访问）
```

### 临时方案
```
关闭 VPN
- 和 Kiro 交互时关闭
- 需要访问被墙服务时打开
```

---

## 🧪 验证配置

运行这个测试脚本：

```bash
#!/bin/bash

echo "🧪 测试网络配置..."
echo ""

echo "1️⃣ Kiro (应该快速响应):"
time curl -I -s https://kiro.ai | head -n 1

echo ""
echo "2️⃣ Anthropic (应该快速响应):"
time curl -I -s https://anthropic.com | head -n 1

echo ""
echo "3️⃣ Supabase (应该快速响应):"
time curl -I -s https://bhedgcynaclprbztcmcl.supabase.co | head -n 1

echo ""
echo "4️⃣ Google (可能需要代理):"
time curl -I -s https://google.com | head -n 1

echo ""
echo "✅ 测试完成！"
```

保存为 `test-kiro-network.sh`，运行：
```bash
chmod +x test-kiro-network.sh
./test-kiro-network.sh
```

---

## 💡 快速切换技巧

### 使用 Shell 别名

在 `~/.zshrc` 中添加：

```bash
# VPN 快速切换
alias vpn-on='networksetup -setsocksfirewallproxystate Wi-Fi on'
alias vpn-off='networksetup -setsocksfirewallproxystate Wi-Fi off'
alias vpn-status='networksetup -getsocksfirewallproxy Wi-Fi'

# Git 代理切换
alias git-proxy='git config --global http.proxy socks5://127.0.0.1:7890'
alias git-direct='git config --global --unset http.proxy'
```

使用：
```bash
vpn-off      # 关闭代理（和 Kiro 交互时）
vpn-on       # 打开代理（需要访问被墙服务时）
git-direct   # Git 直连（推送代码时）
```

---

## 🔧 故障排查

### 问题：配置后 Kiro 还是慢

**检查**:
```bash
# 查看 Kiro 是否走了代理
curl -v https://kiro.ai 2>&1 | grep -i proxy
```

**解决**:
- 确保 `kiro.ai` 在规则中是 `DIRECT`
- 重启 Clash 或代理工具
- 清除 DNS 缓存: `sudo dscacheutil -flushcache`

### 问题：GitHub 推送还是慢

**解决**:
```bash
# 临时不使用代理推送
git -c http.proxy= push

# 或永久设置 GitHub 直连
git config --global http.https://github.com.proxy ""
```

### 问题：不确定当前是否在用代理

**检查**:
```bash
# 查看当前 IP
curl https://api.ipify.org

# 查看代理设置
env | grep -i proxy
```

---

## ✅ 最终检查清单

- [ ] 已配置分流规则（Clash 或 PAC）
- [ ] Kiro 设置为直连
- [ ] Anthropic/Claude 设置为直连
- [ ] Supabase 设置为直连
- [ ] 测试 Kiro 响应速度正常
- [ ] 测试 Git 推送正常
- [ ] 测试需要代理的服务可访问

---

**创建时间**: 2026-01-05  
**更新时间**: 2026-01-05  
**适用系统**: macOS  
**项目**: 投资组合管理系统
