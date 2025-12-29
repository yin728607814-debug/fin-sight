# 投资组合增强功能设计文档

## 概述

本文档描述投资组合追踪器增强功能的技术设计，包括基金产品管理、定投计划、黄金价格转换等核心功能的实现方案。

## 架构

### 系统架构图

```
┌─────────────────────────────────────────────────────────────┐
│                     Portfolio Page                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Add Position │  │ Position List│  │  Portfolio   │     │
│  │    Modal     │  │              │  │   Summary    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Portfolio Service                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Position   │  │  Auto-Invest │  │    Price     │     │
│  │  Management  │  │  Management  │  │  Conversion  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ localStorage │  │  Fund Data   │  │ Price Service│     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

## 组件和接口

### 1. 基金产品数据结构

```typescript
interface FundProduct {
  code: string;           // 基金代码
  name: string;           // 基金全称
  shortName: string;      // 基金简称
  type: 'nasdaq' | 'gold'; // 基金类型
  company: string;        // 基金公司
  trackingIndex: string;  // 跟踪指数
}
```

### 2. 增强的持仓数据结构

```typescript
interface EnhancedPosition {
  id: string;
  assetType: AssetType;
  
  // 基金信息（纳斯达克）
  fundCode?: string;
  fundName?: string;
  
  // 基本信息
  quantity: number;
  buyPrice: number;
  buyDate: Date;
  
  // 计算字段
  investmentAmount: number;    // 持仓金额
  currentPrice?: number;
  currentValue?: number;       // 当前市值
  profitLoss?: number;         // 持有收益
  profitLossPercent?: number;  // 收益率
  holdingDays: number;         // 持有天数
  dailyProfitLoss?: number;    // 日收益
  annualizedReturn?: number;   // 年化收益率
  
  // 定投计划
  autoInvest?: AutoInvestPlan;
}

interface AutoInvestPlan {
  enabled: boolean;
  amount: number;              // 定投金额
  frequency: 'weekly' | 'monthly' | 'quarterly'; // 周期
  startDate: Date;             // 首次扣款日期
  nextDate: Date;              // 下次扣款日期
  lastExecutedDate?: Date;     // 上次执行日期
}
```

### 3. 黄金价格转换服务

```typescript
interface GoldPriceConverter {
  // 美元/盎司 转 人民币/克
  convertUsdPerOzToCnyPerGram(usdPerOz: number): number;
  
  // 人民币/克 转 美元/盎司
  convertCnyPerGramToUsdPerOz(cnyPerGram: number): number;
  
  // 获取当前汇率
  getCurrentExchangeRate(): number;
}
```

### 4. 持仓统计接口

```typescript
interface PositionStatistics {
  // 基本统计
  totalPositions: number;
  totalInvestment: number;
  currentValue: number;
  totalProfitLoss: number;
  totalProfitLossPercent: number;
  
  // 分类统计
  nasdaqStats: AssetStats;
  goldStats: GoldStats;
  
  // 定投统计
  autoInvestCount: number;
  nextAutoInvestDate?: Date;
}

interface AssetStats {
  count: number;
  investment: number;
  currentValue: number;
  profitLoss: number;
}

interface GoldStats extends AssetStats {
  totalGrams: number;        // 总克数
  averagePrice: number;      // 均价（人民币/克）
  currentPrice: number;      // 当前价格（人民币/克）
}
```

## 数据模型

### 基金产品列表

预置常见纳斯达克100基金产品：

```typescript
const NASDAQ_FUNDS: FundProduct[] = [
  {
    code: '270042',
    name: '广发纳斯达克100ETF联接(QDII)A人民币',
    shortName: '广发纳指ETF联接A',
    type: 'nasdaq',
    company: '广发基金',
    trackingIndex: '纳斯达克100指数'
  },
  {
    code: '006479',
    name: '广发纳斯达克100ETF联接(QDII)C人民币',
    shortName: '广发纳指ETF联接C',
    type: 'nasdaq',
    company: '广发基金',
    trackingIndex: '纳斯达克100指数'
  },
  {
    code: '040046',
    name: '华安纳斯达克100指数(QDII)',
    shortName: '华安纳指',
    type: 'nasdaq',
    company: '华安基金',
    trackingIndex: '纳斯达克100指数'
  },
  {
    code: '513300',
    name: '纳斯达克100ETF',
    shortName: '纳指ETF',
    type: 'nasdaq',
    company: '国泰基金',
    trackingIndex: '纳斯达克100指数'
  },
  {
    code: '160213',
    name: '国泰纳斯达克100指数(QDII)',
    shortName: '国泰纳指',
    type: 'nasdaq',
    company: '国泰基金',
    trackingIndex: '纳斯达克100指数'
  },
  {
    code: '000834',
    name: '大成纳斯达克100指数(QDII)',
    shortName: '大成纳指',
    type: 'nasdaq',
    company: '大成基金',
    trackingIndex: '纳斯达克100指数'
  },
  {
    code: '050025',
    name: '博时标普500ETF联接A',
    shortName: '博时标普500',
    type: 'nasdaq',
    company: '博时基金',
    trackingIndex: '标普500指数'
  },
  {
    code: '161130',
    name: '易方达纳斯达克100指数(QDII-LOF)A人民币',
    shortName: '易方达纳指',
    type: 'nasdaq',
    company: '易方达基金',
    trackingIndex: '纳斯达克100指数'
  },
  {
    code: '012861',
    name: '易方达纳斯达克100指数(QDII-LOF)C',
    shortName: '易方达纳指C',
    type: 'nasdaq',
    company: '易方达基金',
    trackingIndex: '纳斯达克100指数'
  },
  {
    code: '110032',
    name: '易方达恒生科技ETF联接(QDII)A人民币',
    shortName: '易方达恒生科技',
    type: 'nasdaq',
    company: '易方达基金',
    trackingIndex: '恒生科技指数'
  }
];
```

### 黄金价格转换常量

```typescript
const GOLD_CONVERSION = {
  OZ_TO_GRAM: 31.1035,        // 1盎司 = 31.1035克
  USD_TO_CNY: 7.2,            // 美元兑人民币汇率（动态获取）
};
```

## 核心算法

### 1. 持有天数计算

```typescript
function calculateHoldingDays(buyDate: Date): number {
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - buyDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}
```

### 2. 年化收益率计算

```typescript
function calculateAnnualizedReturn(
  profitLossPercent: number,
  holdingDays: number
): number {
  if (holdingDays < 30) return 0; // 少于30天不计算年化
  const years = holdingDays / 365;
  return (Math.pow(1 + profitLossPercent / 100, 1 / years) - 1) * 100;
}
```

### 3. 黄金均价计算

```typescript
function calculateGoldAveragePrice(positions: EnhancedPosition[]): number {
  const goldPositions = positions.filter(p => p.assetType === 'gold');
  
  if (goldPositions.length === 0) return 0;
  
  let totalCost = 0;
  let totalQuantity = 0;
  
  goldPositions.forEach(position => {
    totalCost += position.quantity * position.buyPrice;
    totalQuantity += position.quantity;
  });
  
  return totalQuantity > 0 ? totalCost / totalQuantity : 0;
}
```

### 4. 下次定投日期计算

```typescript
function calculateNextAutoInvestDate(
  lastDate: Date,
  frequency: 'weekly' | 'monthly' | 'quarterly'
): Date {
  const next = new Date(lastDate);
  
  switch (frequency) {
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'quarterly':
      next.setMonth(next.getMonth() + 3);
      break;
  }
  
  return next;
}
```

### 5. 日收益计算

```typescript
function calculateDailyProfitLoss(
  position: EnhancedPosition,
  previousPrice: number
): number {
  if (!position.currentPrice) return 0;
  
  const priceDiff = position.currentPrice - previousPrice;
  return priceDiff * position.quantity;
}
```

## 错误处理

### 错误类型

```typescript
enum PortfolioErrorType {
  INVALID_FUND_CODE = 'invalid_fund_code',
  INVALID_AUTO_INVEST = 'invalid_auto_invest',
  PRICE_CONVERSION_FAILED = 'price_conversion_failed',
  STORAGE_QUOTA_EXCEEDED = 'storage_quota_exceeded',
  DATA_VALIDATION_FAILED = 'data_validation_failed'
}
```

### 错误处理策略

1. **基金代码验证失败**: 提示用户选择有效的基金产品
2. **定投参数无效**: 显示具体的验证错误信息
3. **价格转换失败**: 使用默认汇率并显示警告
4. **存储空间不足**: 提示用户导出数据并清理历史记录
5. **数据验证失败**: 阻止操作并显示详细错误信息

## 测试策略

### 单元测试

1. **基金搜索功能**: 测试按名称和代码搜索
2. **持有天数计算**: 测试各种日期场景
3. **年化收益率计算**: 测试不同持有期限
4. **黄金价格转换**: 测试美元/盎司到人民币/克的转换
5. **均价计算**: 测试多笔持仓的加权平均
6. **定投日期计算**: 测试各种周期的下次扣款日期

### 集成测试

1. **添加基金持仓**: 测试完整的添加流程
2. **启用定投计划**: 测试定投设置和保存
3. **黄金持仓管理**: 测试黄金添加和均价计算
4. **收益计算**: 测试实时价格更新后的收益计算
5. **数据持久化**: 测试刷新后数据恢复

### 用户体验测试

1. **响应式布局**: 测试移动端和桌面端显示
2. **加载性能**: 测试大量持仓时的性能
3. **错误提示**: 测试各种错误场景的用户提示
4. **操作流畅性**: 测试添加、编辑、删除的流畅度

## 性能优化

### 1. 数据缓存

- 基金列表缓存在内存中，避免重复加载
- 价格数据缓存5分钟，减少API调用

### 2. 计算优化

- 使用memo缓存计算结果
- 批量更新持仓数据，避免多次渲染

### 3. 存储优化

- 压缩历史数据，只保留必要字段
- 定期清理过期的定投记录

## 安全性考虑

### 1. 数据验证

- 所有用户输入必须经过验证
- 数量和价格必须为正数
- 日期必须在合理范围内

### 2. 数据完整性

- 使用事务性操作保证数据一致性
- 定期备份数据到localStorage
- 提供数据导出功能防止数据丢失

### 3. 隐私保护

- 所有数据仅存储在本地
- 不向服务器发送用户持仓信息
- 导出数据时提醒用户注意隐私

## 可扩展性

### 未来扩展方向

1. **更多资产类型**: 支持股票、债券、加密货币等
2. **实时价格推送**: 使用WebSocket获取实时价格
3. **智能提醒**: 定投日期提醒、止盈止损提醒
4. **数据分析**: 收益分析、风险评估、资产配置建议
5. **云端同步**: 支持多设备数据同步
