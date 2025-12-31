# 新闻列表卡片类型错误修复

## 修复日期
2025-12-31

## 问题描述
`NewsListCard.tsx` 组件中使用了错误的属性名，导致 TypeScript 类型错误：
- 使用了 `headline`、`summary`、`datetime` 属性
- 但 `NewsItem` 类型定义的是 `title`、`content`、`publishedAt` 属性

## 根本原因
Finnhub API 返回的原始数据有 `headline`、`summary`、`datetime` 属性，但 `newsService.ts` 已经将这些转换为标准的 `NewsItem` 类型（`title`、`content`、`publishedAt`）。组件应该使用转换后的属性名。

## 修复内容

### 1. 修复 NewsListCard.tsx
- ✅ 将 `item.headline` 改为 `item.title`
- ✅ 将 `item.summary` 改为 `item.content`
- ✅ 将 `item.datetime` 改为 `item.publishedAt`
- ✅ 简化 `formatDate` 函数，直接接收 `Date` 类型
- ✅ 使用 `item.id` 作为 key（更好的 React 实践）

### 2. 修复 portfolioService.ts
- ✅ 移除未使用的 `EnhancedPosition` 导入
- ✅ 移除未使用的 `goldPriceConverter` 导入
- ✅ 修复 `position.quantity` 可能为 undefined 的错误（添加 `|| 0`）

## 测试结果
```bash
npm run build
✓ built in 3.67s
```

## 文件修改
- `components/dashboard/NewsListCard.tsx` - 修复属性名和类型
- `services/portfolioService.ts` - 清理未使用的导入和修复类型错误

## 验证
- ✅ TypeScript 编译通过
- ✅ 构建成功
- ✅ 无类型错误
- ✅ 无警告

## 影响范围
- 仅影响 Dashboard 页面的新闻列表卡片显示
- 不影响其他功能
- 向后兼容

---
**修复完成** ✅
