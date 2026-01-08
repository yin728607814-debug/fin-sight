# GitHub Actions 定投配置指南

## 两种配置方案

### 方案一：自动获取 Netlify URL（推荐）

适合网站地址经常变更的情况，GitHub Actions 会自动从 Netlify API 获取最新的站点 URL。

#### 配置步骤

**1. 获取 Netlify 信息**

登录 Netlify Dashboard：

- **Site ID**: 
  - 进入你的站点设置
  - 在 "Site details" 中找到 "Site ID"
  - 例如：`abc123-def456-ghi789`

- **Personal Access Token**:
  - 点击右上角头像 → User settings
  - 进入 "Applications" → "Personal access tokens"
  - 点击 "New access token"
  - 输入名称（如 "GitHub Actions"）
  - 复制生成的 token（只显示一次！）

**2. 在 GitHub 添加 Secrets**

进入你的 GitHub 仓库：Settings → Secrets and variables → Actions → New repository secret

添加以下 Secrets：

| Name | Value | 说明 |
|------|-------|------|
| `NETLIFY_AUTH_TOKEN` | `your-netlify-token` | Netlify Personal Access Token |
| `NETLIFY_SITE_ID` | `your-site-id` | Netlify Site ID |
| `AUTO_INVEST_TOKEN` | `your-secret-token` | 自定义安全令牌（可选） |

**3. 完成！**

- GitHub Actions 会自动从 Netlify API 获取最新的站点 URL
- 即使你的站点 URL 变更，也不需要更新配置
- 每天凌晨 2:00 (北京时间) 自动执行

---

### 方案二：手动配置 URL（简单）

适合站点 URL 固定不变的情况。

#### 配置步骤

**1. 在 GitHub 添加 Secrets**

进入你的 GitHub 仓库：Settings → Secrets and variables → Actions → New repository secret

添加以下 Secrets：

| Name | Value | 说明 |
|------|-------|------|
| `NETLIFY_SITE_URL` | `https://your-site.netlify.app` | 你的 Netlify 站点完整 URL |
| `AUTO_INVEST_TOKEN` | `your-secret-token` | 自定义安全令牌（可选） |

**2. 完成！**

- 每天凌晨 2:00 (北京时间) 自动执行
- 如果站点 URL 变更，需要手动更新 `NETLIFY_SITE_URL`

---

## 关于 AUTO_INVEST_TOKEN（可选）

### 是否需要设置？

- **不设置**：任何人都可以访问 `/.netlify/functions/trigger-auto-invest` 触发定投
- **设置**：只有知道 token 的人才能触发定投（更安全）

### 如何设置？

**1. 生成一个随机 token**

```bash
# 在终端运行（macOS/Linux）
openssl rand -hex 32

# 或者使用在线工具
# https://www.random.org/strings/
```

**2. 在 GitHub 添加 Secret**

- Name: `AUTO_INVEST_TOKEN`
- Value: 你生成的 token

**3. 在 Netlify 添加环境变量**

- 进入 Netlify Dashboard → Site settings → Environment variables
- 添加：`AUTO_INVEST_TOKEN` = 你生成的 token
- 重新部署站点

---

## 测试配置

### 手动触发测试

1. 进入 GitHub 仓库
2. 点击 "Actions" 标签
3. 选择 "Auto Invest Daily"
4. 点击 "Run workflow" → "Run workflow"
5. 查看执行日志

### 查看执行日志

- 成功：显示 "✅ 定投执行成功"
- 失败：显示错误信息和 HTTP 状态码

---

## 常见问题

### Q: 如何知道我的 Netlify Site ID？

A: 登录 Netlify Dashboard → 选择你的站点 → Site settings → Site details → Site ID

### Q: 如何获取 Netlify Personal Access Token？

A: Netlify Dashboard → 右上角头像 → User settings → Applications → Personal access tokens → New access token

### Q: 站点 URL 变更后需要做什么？

A: 
- **方案一（推荐）**：什么都不用做，自动获取最新 URL
- **方案二**：需要更新 GitHub Secret 中的 `NETLIFY_SITE_URL`

### Q: 如何修改执行时间？

A: 编辑 `.github/workflows/auto-invest.yml` 文件中的 cron 表达式：

```yaml
schedule:
  - cron: '0 18 * * *'  # UTC 18:00 = 北京时间 02:00
```

常用时间：
- 每天凌晨 1:00 (北京): `0 17 * * *`
- 每天凌晨 2:00 (北京): `0 18 * * *`
- 每天凌晨 3:00 (北京): `0 19 * * *`
- 每天上午 9:00 (北京): `0 1 * * *`

### Q: 如何禁用自动执行？

A: 
1. 进入 GitHub 仓库 → Actions
2. 选择 "Auto Invest Daily"
3. 点击右上角 "..." → "Disable workflow"

### Q: 如何查看定投执行历史？

A: GitHub 仓库 → Actions → Auto Invest Daily → 查看历史运行记录

---

## 配置检查清单

### 方案一（自动获取 URL）

- [ ] 已获取 Netlify Site ID
- [ ] 已创建 Netlify Personal Access Token
- [ ] 已在 GitHub 添加 `NETLIFY_AUTH_TOKEN`
- [ ] 已在 GitHub 添加 `NETLIFY_SITE_ID`
- [ ] （可选）已在 GitHub 添加 `AUTO_INVEST_TOKEN`
- [ ] （可选）已在 Netlify 添加 `AUTO_INVEST_TOKEN` 环境变量
- [ ] 已手动测试 GitHub Actions 工作流
- [ ] 测试成功

### 方案二（手动配置 URL）

- [ ] 已获取 Netlify 站点 URL
- [ ] 已在 GitHub 添加 `NETLIFY_SITE_URL`
- [ ] （可选）已在 GitHub 添加 `AUTO_INVEST_TOKEN`
- [ ] （可选）已在 Netlify 添加 `AUTO_INVEST_TOKEN` 环境变量
- [ ] 已手动测试 GitHub Actions 工作流
- [ ] 测试成功

---

## 下一步

配置完成后：

1. ✅ 手动触发一次测试
2. ✅ 查看执行日志确认成功
3. ✅ 等待明天凌晨 2:00 自动执行
4. ✅ 在 Supabase 中验证定投是否执行

如有问题，查看 GitHub Actions 执行日志获取详细错误信息。
