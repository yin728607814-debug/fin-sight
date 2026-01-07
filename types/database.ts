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
  
  // 基金信息（纳斯达克和A股）
  fund_name?: string;
  fund_code?: string;  // 基金代码
  
  // 黄金信息
  quantity?: number;  // 黄金克数
  average_buy_price?: number;  // 黄金均价（元/克）
  
  // 通用信息
  investment_amount: number;  // 持仓金额（元）
  profit_loss: number;  // 持仓收益（元）
  daily_profit_loss?: number;  // 当日收益（元）
  daily_change?: number;  // 当日涨跌幅（%）
  manual_daily_return?: number;  // 手动输入的当日收益率（%）
  
  // 定投信息
  auto_invest_enabled?: boolean;  // 是否启用定投
  auto_invest_amount?: number;  // 定投金额（元）
  auto_invest_frequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly';  // 定投周期
  auto_invest_start_date?: string;  // 首次扣款日期（ISO时间戳）
  auto_invest_next_date?: string;  // 下次扣款日期（ISO时间戳）
  auto_invest_last_executed_date?: string;  // 上次执行日期（ISO时间戳）
  
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
  fund_code?: string;  // 基金代码
  quantity?: number;
  average_buy_price?: number;
  investment_amount: number;
  profit_loss: number;
  daily_profit_loss?: number;
  daily_change?: number;
  manual_daily_return?: number;
  
  // 定投信息
  auto_invest_enabled?: boolean;
  auto_invest_amount?: number;
  auto_invest_frequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  auto_invest_start_date?: string;
  auto_invest_next_date?: string;
  auto_invest_last_executed_date?: string;
}

/**
 * 更新持仓输入
 */
export interface UpdatePositionInput {
  fund_name?: string;
  fund_code?: string;  // 基金代码
  quantity?: number;
  average_buy_price?: number;
  investment_amount?: number;
  profit_loss?: number;
  daily_profit_loss?: number;
  daily_change?: number;
  manual_daily_return?: number;
  
  // 定投信息
  auto_invest_enabled?: boolean;
  auto_invest_amount?: number;
  auto_invest_frequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  auto_invest_start_date?: string;
  auto_invest_next_date?: string;
  auto_invest_last_executed_date?: string;
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
  fund_code?: string;  // 基金代码
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
