/**
 * 投资组合适配器
 * 将 Supabase 数据格式转换为应用内部格式
 */

import { Position } from './portfolioService';
import { PositionRecord, CreatePositionInput, UpdatePositionInput } from '../types/database';
import { AssetType } from '../types';

/**
 * 将 PositionRecord 转换为 Position
 */
export function positionRecordToPosition(record: PositionRecord): Position {
  // 调试日志：查看原始数据
  if (record.asset_type === 'nasdaq' && record.fund_name?.includes('景顺')) {
    console.log('[DEBUG] 纳斯达克基金原始数据:', {
      fundName: record.fund_name,
      daily_profit_loss: record.daily_profit_loss,
      daily_profit_loss_type: typeof record.daily_profit_loss,
      daily_change: record.daily_change,
      daily_change_type: typeof record.daily_change
    });
  }
  
  const position: Position = {
    id: record.id,
    assetType: record.asset_type as AssetType,
    assetName: record.asset_type === 'nasdaq' ? '纳斯达克100' : record.asset_type === 'astock' ? 'A股基金' : '现货黄金',
    
    // 纳斯达克和A股基金信息
    fundName: record.fund_name || undefined,
    fundCode: record.fund_code || undefined,  // 基金代码
    
    // 黄金信息
    quantity: record.quantity ? parseFloat(Number(record.quantity).toFixed(2)) : undefined,
    averageBuyPrice: record.average_buy_price ? parseFloat(Number(record.average_buy_price).toFixed(2)) : undefined,
    
    // 通用信息 - 使用 toFixed(2) 避免浮点数精度问题
    investmentAmount: parseFloat(Number(record.investment_amount).toFixed(2)),
    profitLoss: parseFloat(Number(record.profit_loss).toFixed(2)),
    dailyProfitLoss: record.daily_profit_loss != null ? parseFloat(Number(record.daily_profit_loss).toFixed(2)) : undefined,
    dailyChange: record.daily_change != null ? parseFloat(Number(record.daily_change).toFixed(2)) : undefined,
    // 手动收益率保留更高精度（4位小数）
    manualDailyReturn: record.manual_daily_return ? parseFloat(Number(record.manual_daily_return).toFixed(4)) : undefined,
    
    // 元数据
    createdAt: new Date(record.created_at),
    updatedAt: new Date(record.updated_at)
  };
  
  // 调试日志：查看转换后的数据
  if (record.asset_type === 'nasdaq' && record.fund_name?.includes('景顺')) {
    console.log('[DEBUG] 纳斯达克基金转换后数据:', {
      fundName: position.fundName,
      dailyProfitLoss: position.dailyProfitLoss,
      dailyChange: position.dailyChange
    });
  }
  
  return position;
  
  // 定投信息
  if (record.auto_invest_enabled && record.auto_invest_amount && record.auto_invest_frequency) {
    position.autoInvest = {
      enabled: true,
      amount: parseFloat(Number(record.auto_invest_amount).toFixed(2)),
      frequency: record.auto_invest_frequency,
      startDate: record.auto_invest_start_date ? new Date(record.auto_invest_start_date) : new Date(),
      nextDate: record.auto_invest_next_date ? new Date(record.auto_invest_next_date) : new Date(),
      lastExecutedDate: record.auto_invest_last_executed_date ? new Date(record.auto_invest_last_executed_date) : undefined
    };
  }
  
  return position;
}

/**
 * 将 Position 转换为 CreatePositionInput
 */
export function positionToCreateInput(position: Omit<Position, 'id' | 'createdAt' | 'updatedAt'>): CreatePositionInput {
  const input: CreatePositionInput = {
    asset_type: position.assetType,
    investment_amount: position.investmentAmount,
    profit_loss: position.profitLoss
  };
  
  // 纳斯达克和A股特定字段
  if ((position.assetType === 'nasdaq' || position.assetType === 'astock') && position.fundName) {
    input.fund_name = position.fundName;
    if (position.fundCode) {
      input.fund_code = position.fundCode;  // 添加基金代码
    }
  }
  
  // 黄金特定字段
  if (position.assetType === 'gold') {
    if (position.quantity !== undefined) {
      input.quantity = position.quantity;
    }
    if (position.averageBuyPrice !== undefined) {
      input.average_buy_price = position.averageBuyPrice;
    }
  }
  
  // 定投信息
  if (position.autoInvest) {
    input.auto_invest_enabled = position.autoInvest.enabled;
    if (position.autoInvest.enabled) {
      input.auto_invest_amount = position.autoInvest.amount;
      input.auto_invest_frequency = position.autoInvest.frequency;
      input.auto_invest_start_date = position.autoInvest.startDate.toISOString();
      input.auto_invest_next_date = position.autoInvest.nextDate.toISOString();
      if (position.autoInvest.lastExecutedDate) {
        input.auto_invest_last_executed_date = position.autoInvest.lastExecutedDate.toISOString();
      }
    }
  }
  
  return input;
}

/**
 * 将 Position 部分更新转换为 UpdatePositionInput
 */
export function positionToUpdateInput(updates: Partial<Position>): UpdatePositionInput {
  const input: UpdatePositionInput = {};
  
  if (updates.fundName !== undefined) {
    input.fund_name = updates.fundName;
  }
  
  if (updates.fundCode !== undefined) {
    input.fund_code = updates.fundCode;  // 添加基金代码
  }
  
  if (updates.quantity !== undefined) {
    input.quantity = updates.quantity;
  }
  
  if (updates.averageBuyPrice !== undefined) {
    input.average_buy_price = updates.averageBuyPrice;
  }
  
  if (updates.investmentAmount !== undefined) {
    input.investment_amount = updates.investmentAmount;
  }
  
  if (updates.profitLoss !== undefined) {
    input.profit_loss = updates.profitLoss;
  }
  
  if (updates.dailyProfitLoss !== undefined) {
    input.daily_profit_loss = updates.dailyProfitLoss;
  }
  
  if (updates.dailyChange !== undefined) {
    input.daily_change = updates.dailyChange;
  }
  
  if (updates.manualDailyReturn !== undefined) {
    input.manual_daily_return = updates.manualDailyReturn;
  }
  
  // 定投信息
  if (updates.autoInvest !== undefined) {
    if (updates.autoInvest) {
      input.auto_invest_enabled = updates.autoInvest.enabled;
      if (updates.autoInvest.enabled) {
        input.auto_invest_amount = updates.autoInvest.amount;
        input.auto_invest_frequency = updates.autoInvest.frequency;
        input.auto_invest_start_date = updates.autoInvest.startDate.toISOString();
        input.auto_invest_next_date = updates.autoInvest.nextDate.toISOString();
        if (updates.autoInvest.lastExecutedDate) {
          input.auto_invest_last_executed_date = updates.autoInvest.lastExecutedDate.toISOString();
        }
      }
    } else {
      // 如果 autoInvest 为 undefined，表示禁用定投
      input.auto_invest_enabled = false;
      input.auto_invest_amount = null as any;
      input.auto_invest_frequency = null as any;
      input.auto_invest_start_date = null as any;
      input.auto_invest_next_date = null as any;
      input.auto_invest_last_executed_date = null as any;
    }
  }
  
  return input;
}

/**
 * 批量转换 PositionRecord 数组为 Position 数组
 */
export function positionRecordsToPositions(records: PositionRecord[]): Position[] {
  return records.map(positionRecordToPosition);
}
