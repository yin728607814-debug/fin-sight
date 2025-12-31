# Timestamp Bug 修复记录

## 问题描述
应用在生产环境中报错：`TypeError: u.getTime is not a function`

## 根本原因
1. **NewsListCard.tsx** 和 **NewsList.tsx** 中的日期格式化函数假设输入是 `Date` 对象
2. 但从 API 或 localStorage 反序列化后，`publishedAt` 实际上是**字符串**
3. JSON.parse() 不会自动将字符串转换为 Date 对象

## 修复方案
修改了以下文件的日期格式化函数，使其能够处理 `Date | string` 类型：
- `components/dashboard/NewsListCard.tsx` - formatDate 函数
- `components/NewsList.tsx` - formatTime 函数
- `components/SentimentTrend.tsx` - formatDate 函数（加强防护）

## 修复日期
2025-12-31

## 状态
✅ 已修复并部署
