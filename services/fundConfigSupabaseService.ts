/**
 * 基金配置 Supabase 服务
 * 管理基金配置的 CRUD 操作
 */

import { supabase } from './supabaseClient';
import { logInfo, logError } from './logger';
import { 
  FundConfigRecord, 
  CreateFundConfigInput, 
  UpdateFundConfigInput 
} from '../types/database';

export class FundConfigSupabaseService {
  private userId: string;
  private readonly TABLE_NAME = 'fund_configs';

  constructor(userId: string) {
    this.userId = userId;
    
    if (!supabase) {
      throw new Error('Supabase 客户端未初始化');
    }
  }

  /**
   * 获取所有基金配置
   */
  async getFundConfigs(): Promise<FundConfigRecord[]> {
    try {
      logInfo('获取基金配置列表', { userId: this.userId });

      const { data, error} = await supabase!
        .from(this.TABLE_NAME)
        .select('*')
        .eq('user_id', this.userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`获取基金配置失败: ${error.message}`);
      }

      logInfo('基金配置列表获取成功', { count: data?.length || 0 });
      return data || [];
    } catch (error) {
      logError('获取基金配置列表失败', error);
      throw error;
    }
  }

  /**
   * 创建基金配置
   */
  async createFundConfig(input: CreateFundConfigInput): Promise<FundConfigRecord> {
    try {
      logInfo('创建基金配置', { name: input.name });

      // 检查是否已存在同名基金
      const existing = await this.getFundConfigByName(input.name);
      if (existing) {
        throw new Error(`基金配置已存在: ${input.name}`);
      }

      const { data, error } = await supabase!
        .from(this.TABLE_NAME)
        .insert([
          {
            user_id: this.userId,
            name: input.name.trim()
          }
        ])
        .select()
        .single();

      if (error) {
        throw new Error(`创建基金配置失败: ${error.message}`);
      }

      if (!data) {
        throw new Error('创建基金配置失败: 未返回数据');
      }

      logInfo('基金配置创建成功', { id: data.id, name: data.name });
      return data;
    } catch (error) {
      logError('创建基金配置失败', error);
      throw error;
    }
  }

  /**
   * 更新基金配置
   */
  async updateFundConfig(id: string, input: UpdateFundConfigInput): Promise<FundConfigRecord> {
    try {
      logInfo('更新基金配置', { id, updates: Object.keys(input) });

      const { data, error } = await supabase!
        .from(this.TABLE_NAME)
        .update(input)
        .eq('id', id)
        .eq('user_id', this.userId)
        .select()
        .single();

      if (error) {
        throw new Error(`更新基金配置失败: ${error.message}`);
      }

      if (!data) {
        throw new Error('更新基金配置失败: 未找到记录');
      }

      logInfo('基金配置更新成功', { id: data.id });
      return data;
    } catch (error) {
      logError('更新基金配置失败', error);
      throw error;
    }
  }

  /**
   * 删除基金配置
   */
  async deleteFundConfig(id: string): Promise<void> {
    try {
      logInfo('删除基金配置', { id });

      const { error } = await supabase!
        .from(this.TABLE_NAME)
        .delete()
        .eq('id', id)
        .eq('user_id', this.userId);

      if (error) {
        throw new Error(`删除基金配置失败: ${error.message}`);
      }

      logInfo('基金配置删除成功', { id });
    } catch (error) {
      logError('删除基金配置失败', error);
      throw error;
    }
  }

  /**
   * 根据名称查找基金配置
   */
  async getFundConfigByName(name: string): Promise<FundConfigRecord | null> {
    try {
      const { data, error } = await supabase!
        .from(this.TABLE_NAME)
        .select('*')
        .eq('user_id', this.userId)
        .eq('name', name.trim())
        .maybeSingle();

      if (error) {
        throw new Error(`查找基金配置失败: ${error.message}`);
      }

      return data;
    } catch (error) {
      logError('查找基金配置失败', error);
      throw error;
    }
  }

  /**
   * 批量创建基金配置
   */
  async batchCreateFundConfigs(inputs: CreateFundConfigInput[]): Promise<FundConfigRecord[]> {
    try {
      logInfo('批量创建基金配置', { count: inputs.length });

      // 去重
      const uniqueNames = Array.from(new Set(inputs.map(i => i.name.trim())));
      
      // 检查已存在的基金
      const existingConfigs = await this.getFundConfigs();
      const existingNames = new Set(existingConfigs.map(c => c.name));
      
      // 过滤掉已存在的
      const newNames = uniqueNames.filter(name => !existingNames.has(name));
      
      if (newNames.length === 0) {
        logInfo('所有基金配置已存在，跳过创建');
        return [];
      }

      const { data, error } = await supabase!
        .from(this.TABLE_NAME)
        .insert(
          newNames.map(name => ({
            user_id: this.userId,
            name
          }))
        )
        .select();

      if (error) {
        throw new Error(`批量创建基金配置失败: ${error.message}`);
      }

      logInfo('批量创建基金配置成功', { created: data?.length || 0 });
      return data || [];
    } catch (error) {
      logError('批量创建基金配置失败', error);
      throw error;
    }
  }

  /**
   * 搜索基金配置
   */
  async searchFundConfigs(query: string): Promise<FundConfigRecord[]> {
    try {
      if (!query.trim()) {
        return this.getFundConfigs();
      }

      logInfo('搜索基金配置', { query });

      const { data, error } = await supabase!
        .from(this.TABLE_NAME)
        .select('*')
        .eq('user_id', this.userId)
        .ilike('name', `%${query.trim()}%`)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`搜索基金配置失败: ${error.message}`);
      }

      logInfo('基金配置搜索成功', { count: data?.length || 0 });
      return data || [];
    } catch (error) {
      logError('搜索基金配置失败', error);
      throw error;
    }
  }
}
