/**
 * 数据库类型定义
 * 用于 Supabase 后端存储
 */

import { AssetType } from '../types';

/**
 * 持仓记录（数据库表结构）
 */
export interface PositionRecord {
  id: string;
  user_id: string;
  asset_type: AssetType;
  
  // 基金信息（纳斯达克）
  fund_name?: string;
  
  // 黄金信息
  quantity?: number;  // 黄金克数
  average_buy_price?: number;  // 黄金均价（元/克）
  
  // 通用信息
  investment_amount: number;  // 持仓金额（元）
  profit_loss: number;  // 持仓收益（元）
  
  // 元数据
  created_at: string;  // ISO 时间戳
  updated_at: string;  // ISO 时间戳
}

/**
 * 创建持仓输入
 */
export interface CreatePositionInput {
  asset_type: AssetType;
  fund_name?: string;
  quantity?: number;
  average_buy_price?: number;
  investment_amount: number;
  profit_loss: number;
}

/**
 * 更新持仓输入
 */
export interface UpdatePositionInput {
  fund_name?: string;
  quantity?: number;
  average_buy_price?: number;
  investment_amount?: number;
  profit_loss?: number;
}

/**
 * API 响应格式
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    type: string;
    message: string;
    details?: unknown;
  };
}

/**
 * 批量导入结果
 */
export interface BatchImportResult {
  imported: number;
  failed: number;
  errors?: Array<{
    index: number;
    error: string;
  }>;
}

/**
 * 基金配置记录（数据库表结构）
 */
export interface FundConfigRecord {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

/**
 * 创建基金配置输入
 */
export interface CreateFundConfigInput {
  name: string;
}

/**
 * 更新基金配置输入
 */
export interface UpdateFundConfigInput {
  name?: string;
}
