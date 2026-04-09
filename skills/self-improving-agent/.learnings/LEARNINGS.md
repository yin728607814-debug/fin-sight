# Learnings Log

Captured learnings, corrections, and discoveries. Review before major tasks.

---


## 2026-04-09: Yahoo Finance API 数据过滤问题

### 问题
用户报告纳斯达克数据只更新到 4月7日，但今天是 4月9日，应该显示到 4月8日。

### 根本原因
Yahoo Finance API 会返回未来日期的数据点，但这些数据点的 `close` 值为 `null`。原有的过滤逻辑只检查了 `!== null` 和 `!== undefined` 和 `!isNaN()`，但没有过滤掉值为 `0` 或其他无效值的情况。

### 解决方案
在 `functions/yahoo-finance-proxy.ts` 的数据过滤逻辑中添加 `close > 0` 的检查：

```typescript
.filter(item => {
  return item.close !== null && 
         item.close !== undefined && 
         !isNaN(item.close) && 
         item.close > 0;  // 新增：过滤掉价格为 0 的无效数据
});
```

### 学到的经验
1. **金融数据 API 的特性**：某些金融数据 API（如 Yahoo Finance）会预先返回未来日期的时间戳，但数据值为 `null`，需要在客户端过滤
2. **数据验证的完整性**：除了检查 `null`/`undefined`/`NaN`，还需要检查业务逻辑上的有效性（如价格 > 0）
3. **调试方法**：直接调用原始 API 查看返回数据，可以快速定位问题根源

### 适用场景
- 处理任何金融数据 API 时，都应该验证数据的业务有效性
- 过滤时间序列数据时，要考虑 API 可能返回未来的占位符数据点
