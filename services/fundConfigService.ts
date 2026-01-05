/**
 * 基金配置服务
 * 管理用户自定义的基金列表
 */

import { supabase } from './supabaseClient';
import { UserService } from './userService';

export interface FundConfig {
  id: string;
  user_id: string;
  name: string;
  fund_type: 'nasdaq' | 'astock';
  created_at: Date;
  updated_at: Date;
}

export interface CreateFundConfigInput {
  name: string;
  fund_type: 'nasdaq' | 'astock';
}

class FundConfigService {
  private static instance: FundConfigService;
  private userId: string;

  public static getInstance(): FundConfigService {
    if (!FundConfigService.instance) {
      FundConfigService.instance = new FundConfigService();
    }
    return FundConfigService.instance;
  }

  private constructor() {
    this.userId = UserService.getUserId();
  }

  /**
   * 检查 Supabase 是否可用
   */
  private checkAvailability(): void {
    if (!supabase) {
      throw new Error('Supabase 未初始化');
    }
  }

  /**
   * 获取所有基金配置
   */
  public async getFunds(fundType?: 'nasdaq' | 'astock'): Promise<FundConfig[]> {
    this.checkAvailability();

    try {
      let query = supabase!
        .from('fund_configs')
        .select('*')
        .eq('user_id', this.userId);

      if (fundType) {
        query = query.eq('fund_type', fundType);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return (data || []).map(item => ({
        ...item,
        created_at: new Date(item.created_at),
        updated_at: new Date(item.updated_at)
      }));
    } catch (error) {
      console.error('获取基金配置异常:', error);
      throw error;
    }
  }

  /**
   * 添加基金
   */
  public async addFund(name: string, fundType: 'nasdaq' | 'astock' = 'nasdaq'): Promise<FundConfig> {
    this.checkAvailability();

    try {
      // 检查是否已存在
      const existing = await this.getFunds();
      if (existing.some(f => f.name === name && f.fund_type === fundType)) {
        throw new Error('该基金名称已存在');
      }

      const { data, error } = await supabase!
        .from('fund_configs')
        .insert({
          user_id: this.userId,
          name: name.trim(),
          fund_type: fundType
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      const fund = {
        ...data,
        created_at: new Date(data.created_at),
        updated_at: new Date(data.updated_at)
      };

      return fund;
    } catch (error) {
      console.error('添加基金配置异常:', error);
      throw error;
    }
  }

  /**
   * 更新基金
   */
  public async updateFund(id: string, name: string): Promise<FundConfig> {
    this.checkAvailability();

    try {
      // 检查名称是否与其他基金重复
      const existing = await this.getFunds();
      if (existing.some(f => f.id !== id && f.name === name)) {
        throw new Error('该基金名称已存在');
      }

      const { data, error } = await supabase!
        .from('fund_configs')
        .update({ name: name.trim() })
        .eq('id', id)
        .eq('user_id', this.userId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error('基金配置不存在');
      }

      const fund = {
        ...data,
        created_at: new Date(data.created_at),
        updated_at: new Date(data.updated_at)
      };

      return fund;
    } catch (error) {
      console.error('更新基金配置异常:', error);
      throw error;
    }
  }

  /**
   * 删除基金
   */
  public async deleteFund(id: string): Promise<void> {
    this.checkAvailability();

    try {
      const { error } = await supabase!
        .from('fund_configs')
        .delete()
        .eq('id', id)
        .eq('user_id', this.userId);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('删除基金配置异常:', error);
      throw error;
    }
  }

  /**
   * 搜索基金
   */
  public async searchFunds(query: string, fundType?: 'nasdaq' | 'astock'): Promise<FundConfig[]> {
    this.checkAvailability();

    try {
      if (!query.trim()) {
        return await this.getFunds(fundType);
      }

      let dbQuery = supabase!
        .from('fund_configs')
        .select('*')
        .eq('user_id', this.userId)
        .ilike('name', `%${query}%`);

      if (fundType) {
        dbQuery = dbQuery.eq('fund_type', fundType);
      }

      const { data, error } = await dbQuery.order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      const funds = (data || []).map(item => ({
        ...item,
        created_at: new Date(item.created_at),
        updated_at: new Date(item.updated_at)
      }));

      return funds;
    } catch (error) {
      console.error('搜索基金配置异常:', error);
      throw error;
    }
  }
}

export const fundConfigService = FundConfigService.getInstance();
