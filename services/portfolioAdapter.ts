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
  return {
    id: record.id,
    assetType: record.asset_type as AssetType,
    assetName: record.asset_type === 'nasdaq' ? '纳斯达克100' : '现货黄金',
    
    // 纳斯达克基金信息
    fundName: record.fund_name || undefined,
    
    // 黄金信息
    quantity: record.quantity ? Number(record.quantity) : undefined,
    averageBuyPrice: record.average_buy_price ? Number(record.average_buy_price) : undefined,
    
    // 通用信息
    investmentAmount: Number(record.investment_amount),
    profitLoss: Number(record.profit_loss),
    
    // 元数据
    createdAt: new Date(record.created_at),
    updatedAt: new Date(record.updated_at)
  };
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
  
  // 纳斯达克特定字段
  if (position.assetType === 'nasdaq' && position.fundName) {
    input.fund_name = position.fundName;
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
  
  return input;
}

/**
 * 批量转换 PositionRecord 数组为 Position 数组
 */
export function positionRecordsToPositions(records: PositionRecord[]): Position[] {
  return records.map(positionRecordToPosition);
}
