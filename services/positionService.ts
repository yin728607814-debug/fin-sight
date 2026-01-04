/**
 * 持仓服务
 * 管理投资组合持仓数据的 CRUD 操作
 */

import { supabase, isSupabaseAvailable } from './supabaseClient';
import { UserService } from './userService';
import { logInfo, logError } from './logger';
import { 
  PositionRecord, 
  CreatePositionInput, 
  UpdatePositionInput,
  BatchImportResult 
} from '../types/database';

/**
 * 持仓服务类
 */
export class PositionService {
  private userId: string;

  constructor(userId?: string) {
    this.userId = userId || UserService.getUserId();
  }

  /**
   * 检查 Supabase 是否可用
   */
  private checkAvailability(): void {
    if (!isSupabaseAvailable()) {
      throw new Error('Supabase 未配置或不可用，请检查环境变量配置');
    }
  }

  /**
   * 获取所有持仓
   */
  async getPositions(): Promise<PositionRecord[]> {
    this.checkAvailability();

    try {
      logInfo('获取持仓列表', { userId: this.userId.substring(0, 8) + '...' });

      const { data, error } = await supabase!
        .from('positions')
        .select('*')
        .eq('user_id', this.userId)
        .order('created_at', { ascending: false });

      if (error) {
        logError('获取持仓列表失败', error);
        throw error;
      }

      logInfo('获取持仓列表成功', { count: data?.length || 0 });
      return data || [];
    } catch (error) {
      logError('获取持仓列表异常', error);
      throw error;
    }
  }

  /**
   * 根据资产类型获取持仓
   */
  async getPositionsByAssetType(assetType: 'nasdaq' | 'gold'): Promise<PositionRecord[]> {
    this.checkAvailability();

    try {
      const { data, error } = await supabase!
        .from('positions')
        .select('*')
        .eq('user_id', this.userId)
        .eq('asset_type', assetType)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logError(`获取${assetType}持仓失败`, error);
      throw error;
    }
  }

  /**
   * 创建新持仓
   */
  async createPosition(input: CreatePositionInput): Promise<PositionRecord> {
    this.checkAvailability();

    try {
      logInfo('创建新持仓', { 
        assetType: input.asset_type,
        amount: input.investment_amount 
      });

      const { data, error } = await supabase!
        .from('positions')
        .insert({
          user_id: this.userId,
          ...input
        })
        .select()
        .single();

      if (error) {
        logError('创建持仓失败', error);
        throw error;
      }

      logInfo('创建持仓成功', { id: data.id });
      return data;
    } catch (error) {
      logError('创建持仓异常', error);
      throw error;
    }
  }

  /**
   * 更新持仓
   */
  async updatePosition(id: string, input: UpdatePositionInput): Promise<PositionRecord> {
    this.checkAvailability();

    try {
      logInfo('更新持仓', { id, updates: Object.keys(input) });

      const { data, error } = await supabase!
        .from('positions')
        .update(input)
        .eq('id', id)
        .eq('user_id', this.userId)  // 确保只能更新自己的数据
        .select()
        .single();

      if (error) {
        logError('更新持仓失败', error);
        throw error;
      }

      if (!data) {
        throw new Error('持仓不存在或无权限更新');
      }

      logInfo('更新持仓成功', { id });
      return data;
    } catch (error) {
      logError('更新持仓异常', error);
      throw error;
    }
  }

  /**
   * 删除持仓
   */
  async deletePosition(id: string): Promise<void> {
    this.checkAvailability();

    try {
      logInfo('删除持仓', { id });

      const { error } = await supabase!
        .from('positions')
        .delete()
        .eq('id', id)
        .eq('user_id', this.userId);  // 确保只能删除自己的数据

      if (error) {
        logError('删除持仓失败', error);
        throw error;
      }

      logInfo('删除持仓成功', { id });
    } catch (error) {
      logError('删除持仓异常', error);
      throw error;
    }
  }

  /**
   * 批量创建持仓
   */
  async batchCreatePositions(inputs: CreatePositionInput[]): Promise<BatchImportResult> {
    this.checkAvailability();

    try {
      logInfo('批量创建持仓', { count: inputs.length });

      const records = inputs.map(input => ({
        user_id: this.userId,
        ...input
      }));

      const { data, error } = await supabase!
        .from('positions')
        .insert(records)
        .select();

      if (error) {
        logError('批量创建持仓失败', error);
        return {
          imported: 0,
          failed: inputs.length,
          errors: [{ index: 0, error: error.message }]
        };
      }

      const imported = data?.length || 0;
      logInfo('批量创建持仓成功', { imported });

      return {
        imported,
        failed: inputs.length - imported
      };
    } catch (error) {
      logError('批量创建持仓异常', error);
      return {
        imported: 0,
        failed: inputs.length,
        errors: [{ index: 0, error: error instanceof Error ? error.message : '未知错误' }]
      };
    }
  }

  /**
   * 获取持仓统计
   */
  async getPositionStats(): Promise<{
    total: number;
    nasdaq: number;
    gold: number;
    totalInvestment: number;
    totalProfitLoss: number;
  }> {
    this.checkAvailability();

    try {
      const positions = await this.getPositions();

      const stats = {
        total: positions.length,
        nasdaq: positions.filter(p => p.asset_type === 'nasdaq').length,
        gold: positions.filter(p => p.asset_type === 'gold').length,
        totalInvestment: positions.reduce((sum, p) => sum + p.investment_amount, 0),
        totalProfitLoss: positions.reduce((sum, p) => sum + p.profit_loss, 0)
      };

      return stats;
    } catch (error) {
      logError('获取持仓统计失败', error);
      throw error;
    }
  }
}
