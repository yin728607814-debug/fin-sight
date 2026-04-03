/**
 * Prompt 配置服务
 * 管理用户自定义的分析策略 Prompt
 * 使用 Supabase 存储
 */

import { supabase } from './supabaseClient';
import { AssetType } from '../types';

interface UserPrompt {
  id?: number;
  user_id: string;
  asset_type: AssetType;
  prompt_content: string;
  created_at?: string;
  updated_at?: string;
}

class PromptConfigService {
  /**
   * 获取用户的自定义 Prompt
   */
  async getUserPrompt(userId: string, assetType: AssetType): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('user_prompts')
        .select('prompt_content')
        .eq('user_id', userId)
        .eq('asset_type', assetType)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // 没有找到记录，返回 null
          return null;
        }
        throw error;
      }

      return data?.prompt_content || null;
    } catch (error) {
      console.error('获取用户 Prompt 失败:', error);
      return null;
    }
  }

  /**
   * 保存或更新用户的自定义 Prompt
   */
  async saveUserPrompt(userId: string, assetType: AssetType, promptContent: string): Promise<void> {
    try {
      console.log('🔍 保存 Prompt - userId:', userId);
      console.log('🔍 保存 Prompt - assetType:', assetType);
      console.log('🔍 保存 Prompt - promptContent length:', promptContent.length);
      
      // 检查用户是否已登录
      const { data: { user } } = await supabase.auth.getUser();
      console.log('🔍 当前登录用户:', user?.id);
      
      // 使用 upsert 来插入或更新
      const { data, error } = await supabase
        .from('user_prompts')
        .upsert(
          {
            user_id: userId,
            asset_type: assetType,
            prompt_content: promptContent,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id, asset_type',  // 修复：逗号后加空格
          }
        )
        .select();

      if (error) {
        console.error('❌ Supabase 错误详情:', error);
        throw error;
      }

      console.log(`✅ 保存用户 Prompt 成功:`, data);
    } catch (error) {
      console.error('保存用户 Prompt 失败:', error);
      throw error;
    }
  }

  /**
   * 删除用户的自定义 Prompt（恢复默认）
   */
  async deleteUserPrompt(userId: string, assetType: AssetType): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_prompts')
        .delete()
        .eq('user_id', userId)
        .eq('asset_type', assetType);

      if (error) {
        throw error;
      }

      console.log(`✅ 删除用户 Prompt 成功: ${userId} - ${assetType}`);
    } catch (error) {
      console.error('删除用户 Prompt 失败:', error);
      throw error;
    }
  }

  /**
   * 获取所有资产类型的用户 Prompt
   */
  async getAllUserPrompts(userId: string): Promise<Record<AssetType, string | null>> {
    const gold = await this.getUserPrompt(userId, 'gold');
    const nasdaq = await this.getUserPrompt(userId, 'nasdaq');
    const astock = await this.getUserPrompt(userId, 'astock');
    
    return {
      gold,
      nasdaq,
      astock,
    };
  }
}

export const promptConfigService = new PromptConfigService();
