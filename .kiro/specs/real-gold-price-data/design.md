# 真实黄金历史价格数据获取与UI优化设计文档

## 概述

本设计文档解决当前系统的两个核心问题：
1. **历史价格数据问题**: 当前系统使用 `generateRealGoldData()` 函数基于当前价格生成模拟的历史数据，而非真实的市场历史数据
2. **UI数字显示问题**: 价格数字被CSS的 `truncate` 类截断，用户无法看到完整的价格信息

## 架构

### 当前架构问题
```
Investing.com API → 获取当前价格 → generateRealGoldData() → 生成假历史数据 → 前端显示
```

### 新架构设计
```
多个历史数据API → 真实历史数据获取服务 → 数据验证与缓存 → 响应式UI显示
```

## 组件和接口

### 1. 历史数据获取服务 (HistoricalPriceService)
```typescript
interface HistoricalPriceService {
  fetchRealHistoricalData(symbol: string, days: number): Promise<HistoricalPriceData[]>
  validateHistoricalData(data: HistoricalPriceData[]): ValidationResult
  switchDataSource(source: DataSource): void
}
```

### 2. 数据源适配器 (DataSourceAdapter)
```typescript
interface DataSourceAdapter {
  fetchHistoricalPrices(symbol: string, range: string): Promise<RawPriceData>
  transformToStandardFormat(rawData: RawPriceData): HistoricalPriceData[]
  isAvailable(): Promise<boolean>
}
```

### 3. 响应式UI组件 (ResponsivePriceDisplay)
```typescript
interface ResponsivePriceDisplayProps {
  priceData: PriceData[]
  displayMode: 'compact' | 'full' | 'adaptive'
  allowTruncation: false // 强制完整显示
}
```

## 数据模型

### HistoricalPriceData
```typescript
interface HistoricalPriceData {
  date: string // ISO date string
  open: number
  high: number
  low: number
  close: number
  volume: number
  source: DataSource
  isReal: true // 标识为真实数据
  lastUpdated: string
}
```

### DataSource
```typescript
interface DataSource {
  name: string
  type: 'primary' | 'backup'
  endpoint: string
  rateLimit: number
  isHistoricalSupported: boolean
}
```

## 正确性属性

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. 
Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: 真实历史数据获取
*For any* 黄金价格历史数据请求，返回的数据应该是来自真实市场交易的历史价格，而不是基于当前价格生成的模拟数据
**Validates: Requirements 1.1, 1.2**

### Property 2: 数据完整性验证
*For any* 历史价格数据集，所有数据点应该包含完整的OHLC信息，且日期序列应该是连续的交易日
**Validates: Requirements 1.4, 5.3**

### Property 3: 完整数字显示
*For any* 价格数字显示，所有数字字符应该完全可见，不应该被省略号或CSS截断
**Validates: Requirements 2.1, 2.4**

### Property 4: 响应式布局适应
*For any* 屏幕尺寸变化，UI布局应该调整以确保所有价格信息完整显示，而不是截断内容
**Validates: Requirements 2.2, 4.2**

### Property 5: 数据源故障转移
*For any* 主要数据源不可用的情况，系统应该自动切换到可用的备用数据源
**Validates: Requirements 3.1**

### Property 6: 数据质量验证
*For any* 接收到的历史价格数据，系统应该验证价格范围的合理性和数据的完整性
**Validates: Requirements 5.1, 5.2**

## 错误处理

### 1. API不可用处理
- 显示明确的错误信息，而不是显示模拟数据
- 提供重试机制
- 记录错误日志用于监控

### 2. 数据验证失败处理
- 拒绝异常数据
- 标记数据质量问题
- 提供数据来源透明度

### 3. UI显示错误处理
- 确保在任何情况下数字都不被截断
- 提供降级显示方案
- 保持响应式设计的一致性

## 测试策略

### 单元测试
- 历史数据获取函数测试
- 数据验证逻辑测试
- UI组件渲染测试
- 响应式布局测试

### 属性测试
- 使用快速检查库验证正确性属性
- 生成随机价格数据进行测试
- 测试不同屏幕尺寸下的显示
- 验证数据源切换逻辑

### 集成测试
- 端到端的数据获取流程测试
- 多数据源集成测试
- 响应式设计在真实设备上的测试