# 基金代码功能实现总结

## 完成的修改

### 1. 数据模型更新

#### `services/fundConfigService.ts`
- ✅ 在 `FundConfig` 接口中添加 `fund_code?: string` 字段
- ✅ 在 `CreateFundConfigInput` 接口中添加 `fund_code?: string` 字段
- ✅ 更新 `addFund()` 方法，支持传入基金代码参数
- ✅ 更新 `updateFund()` 方法，支持更新基金代码

#### `services/portfolioService.ts`
- ✅ 在 `Position` 接口中添加 `fundCode?: string` 字段（用于获取收益率）

#### `types/database.ts`
- ✅ 在 `PositionRecord` 接口中添加 `fund_code?: string` 字段
- ✅ 在 `CreatePositionInput` 接口中添加 `fund_code?: string` 字段
- ✅ 在 `UpdatePositionInput` 接口中添加 `fund_code?: string` 字段
- ✅ 在 `FundConfigRecord` 接口中添加 `fund_code?: string` 字段

#### `services/portfolioAdapter.ts`
- ✅ 更新 `positionRecordToPosition()` 函数，转换 `fund_code` 字段
- ✅ 更新 `positionToCreateInput()` 函数，包含 `fund_code` 字段
- ✅ 更新 `positionToUpdateInput()` 函数，支持更新 `fund_code` 字段

### 2. UI 组件更新

#### `components/AddPositionModal.tsx`
- ✅ 添加持仓时自动从选择的基金配置中获取基金代码
- ✅ 将基金代码保存到新建的持仓记录中

#### `components/EditPositionModal.tsx`
- ✅ 添加基金代码输入框（可选）
- ✅ 编辑时显示现有的基金代码
- ✅ 支持修改基金代码
- ✅ 保存时更新基金代码到数据库

#### `components/EnhancedPositionCard.tsx`
- ✅ 在持仓卡片上显示基金代码（如果有）
- ✅ 基金代码显示为灰色标签，位于资产类型标签旁边

#### `pages/FundConfigPage.tsx`
- ✅ 添加基金代码输入框（添加/编辑基金时）
- ✅ 在基金列表中显示基金代码
- ✅ 基金代码显示为灰色标签

### 3. 数据库迁移

#### `database/migrations/add_fund_code.sql`
- ✅ 创建 SQL 迁移脚本
- ✅ 为 `fund_configs` 表添加 `fund_code` 列
- ✅ 为 `positions` 表添加 `fund_code` 列
- ✅ 添加列注释说明

#### `database/migrations/README_FUND_CODE_MIGRATION.md`
- ✅ 创建详细的迁移指南
- ✅ 包含数据库迁移步骤
- ✅ 包含现有数据导入方法
- ✅ 包含功能说明和注意事项
- ✅ 包含回滚方案

## 功能特点

1. **可选字段**：基金代码是可选的，不影响现有功能
2. **自动关联**：添加持仓时自动从基金配置获取代码
3. **灵活编辑**：可以在编辑持仓时修改基金代码
4. **清晰显示**：在两个列表（持仓列表和基金配置列表）中都显示基金代码
5. **向后兼容**：现有数据不受影响，可以逐步添加基金代码

## 使用流程

### 1. 数据库迁移
```bash
# 在 Supabase 控制台执行 SQL
# 文件：database/migrations/add_fund_code.sql
```

### 2. 配置基金代码
1. 访问 `/fund-config` 页面
2. 编辑现有基金或添加新基金
3. 输入基金代码（例如：161125）
4. 保存

### 3. 添加持仓
1. 在投资组合页面点击"添加持仓"
2. 选择已配置的基金
3. 系统自动获取该基金的代码
4. 基金代码会保存到持仓记录中

### 4. 查看基金代码
- **持仓列表**：基金代码显示在基金名称下方，灰色标签
- **基金配置列表**：基金代码显示在基金类型标签旁边

### 5. 编辑基金代码
- 在编辑持仓弹窗中可以修改基金代码
- 在基金配置页面可以修改基金的默认代码

## 后续优化建议

1. **自动获取收益率**：使用基金代码从 API 获取更准确的收益率数据
2. **代码验证**：添加基金代码格式验证（通常是6位数字）
3. **代码查询**：提供基金代码查询功能，帮助用户找到正确的代码
4. **批量导入**：支持批量导入基金代码
5. **代码同步**：从持仓同步基金代码到基金配置

## 测试清单

- [ ] 执行数据库迁移
- [ ] 添加新基金时输入基金代码
- [ ] 编辑现有基金添加基金代码
- [ ] 添加持仓时验证基金代码自动关联
- [ ] 编辑持仓时修改基金代码
- [ ] 在持仓列表中查看基金代码显示
- [ ] 在基金配置列表中查看基金代码显示
- [ ] 验证基金代码保存到数据库
- [ ] 验证基金代码可以为空（可选字段）

## 注意事项

1. **必须先执行数据库迁移**才能使用此功能
2. 基金代码是可选的，不填写不影响现有功能
3. 建议为所有基金配置添加代码，以便将来获取准确的收益率
4. 基金代码通常可以从天天基金网、支付宝等平台查询
