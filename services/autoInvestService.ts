/**
 * 定投服务模块
 * 负责管理定投计划和自动执行定投
 */

import { supabase } from '../services/supabaseClient';
import { logInfo, logError } from './logger';

/**
 * 定投频率类型
 */
export type InvestFrequency = 'daily' | 'weekly' | 'monthly';

/**
 * 定投计划接口
 */
export interface AutoInvestPlan {
  id: string;
  user_id: string;
  asset_type: 'nasdaq' | 'astock';
  fund_name: string;
  invest_amount: number;
  frequency: InvestFrequency;
  invest_day: number | null;
  is_enabled: boolean;
  next_execution_date: string | null;
  last_execution_date: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * 创建定投计划参数
 */
export interface CreateAutoInvestPlanParams {
  user_id: string;
  asset_type: 'nasdaq' | 'astock';
  fund_name: string;
  invest_amount: number;
  frequency: InvestFrequency;
  invest_day?: number | null;
}

/**
 * 定投服务类
 */
export class AutoInvestService {
  /**
   * 创建定投计划
   */
  async createPlan(params: CreateAutoInvestPlanParams): Promise<AutoInvestPlan> {
    try {
      if (!supabase) {
        throw new Error('Supabase 未初始化');
      }

      logInfo('创建定投计划', params);

      // 计算下次执行时间
      const nextExecutionDate = this.calculateNextExecutionDate(
        params.frequency,
        params.invest_day || null
      );

      const { data, error } = await supabase
        .from('auto_invest_plans')
        .insert({
          user_id: params.user_id,
          asset_type: params.asset_type,
          fund_name: params.fund_name,
          invest_amount: params.invest_amount,
          frequency: params.frequency,
          invest_day: params.invest_day || null,
          is_enabled: true,
          next_execution_date: nextExecutionDate,
          last_execution_date: null
        })
        .select()
        .single();

      if (error) throw error;

      logInfo('定投计划创建成功', { id: data.id });
      return data;
    } catch (error) {
      logError('创建定投计划失败', error);
      throw error;
    }
  }

  /**
   * 获取用户的所有定投计划
   */
  async getUserPlans(userId: string): Promise<AutoInvestPlan[]> {
    try {
      if (!supabase) {
        return [];
      }

      const { data, error } = await supabase
        .from('auto_invest_plans')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      logError('获取定投计划失败', error);
      return [];
    }
  }

  /**
   * 获取特定资产的定投计划
   */
  async getAssetPlans(userId: string, assetType: 'nasdaq' | 'astock'): Promise<AutoInvestPlan[]> {
    try {
      if (!supabase) {
        return [];
      }

      const { data, error} = await supabase
        .from('auto_invest_plans')
        .select('*')
        .eq('user_id', userId)
        .eq('asset_type', assetType)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      logError('获取资产定投计划失败', error);
      return [];
    }
  }

  /**
   * 更新定投计划
   */
  async updatePlan(planId: string, updates: Partial<AutoInvestPlan>): Promise<AutoInvestPlan> {
    try {
      if (!supabase) {
        throw new Error('Supabase 未初始化');
      }

      logInfo('更新定投计划', { planId, updates });

      // 如果更新了频率或日期，重新计算下次执行时间
      if (updates.frequency || updates.invest_day !== undefined) {
        const plan = await this.getPlanById(planId);
        if (plan) {
          updates.next_execution_date = this.calculateNextExecutionDate(
            updates.frequency || plan.frequency,
            updates.invest_day !== undefined ? updates.invest_day : plan.invest_day
          );
        }
      }

      const { data, error } = await supabase
        .from('auto_invest_plans')
        .update(updates)
        .eq('id', planId)
        .select()
        .single();

      if (error) throw error;

      logInfo('定投计划更新成功', { id: data.id });
      return data;
    } catch (error) {
      logError('更新定投计划失败', error);
      throw error;
    }
  }

  /**
   * 启用/禁用定投计划
   */
  async togglePlan(planId: string, enabled: boolean): Promise<void> {
    try {
      await this.updatePlan(planId, { is_enabled: enabled });
      logInfo(`定投计划${enabled ? '启用' : '禁用'}成功`, { planId });
    } catch (error) {
      logError(`${enabled ? '启用' : '禁用'}定投计划失败`, error);
      throw error;
    }
  }

  /**
   * 删除定投计划
   */
  async deletePlan(planId: string): Promise<void> {
    try {
      if (!supabase) {
        throw new Error('Supabase 未初始化');
      }

      const { error } = await supabase
        .from('auto_invest_plans')
        .delete()
        .eq('id', planId);

      if (error) throw error;

      logInfo('定投计划删除成功', { planId });
    } catch (error) {
      logError('删除定投计划失败', error);
      throw error;
    }
  }

  /**
   * 获取单个定投计划
   */
  async getPlanById(planId: string): Promise<AutoInvestPlan | null> {
    try {
      if (!supabase) {
        return null;
      }

      const { data, error } = await supabase
        .from('auto_invest_plans')
        .select('*')
        .eq('id', planId)
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      logError('获取定投计划失败', error);
      return null;
    }
  }

  /**
   * 检查并执行到期的定投计划
   */
  async checkAndExecutePlans(userId: string): Promise<void> {
    try {
      if (!supabase) {
        logInfo('Supabase 未初始化，跳过定投计划检查');
        return;
      }

      const today = new Date().toISOString().split('T')[0];

      // 获取所有启用的、到期的定投计划
      const { data: plans, error } = await supabase
        .from('auto_invest_plans')
        .select('*')
        .eq('user_id', userId)
        .eq('is_enabled', true)
        .lte('next_execution_date', today);

      if (error) throw error;

      if (!plans || plans.length === 0) {
        logInfo('没有需要执行的定投计划');
        return;
      }

      logInfo(`找到${plans.length}个需要执行的定投计划`);

      // 执行每个定投计划
      for (const plan of plans) {
        await this.executePlan(plan);
      }
    } catch (error) {
      logError('检查定投计划失败', error);
    }
  }

  /**
   * 执行单个定投计划
   */
  private async executePlan(plan: AutoInvestPlan): Promise<void> {
    try {
      if (!supabase) {
        throw new Error('Supabase 未初始化');
      }

      logInfo('执行定投计划', { planId: plan.id, fundName: plan.fund_name, amount: plan.invest_amount });

      // 获取当前持仓
      const { data: positions, error: fetchError } = await supabase
        .from('positions')
        .select('*')
        .eq('user_id', plan.user_id)
        .eq('asset_type', plan.asset_type)
        .eq('fund_name', plan.fund_name);

      if (fetchError) throw fetchError;

      if (positions && positions.length > 0) {
        // 更新现有持仓（只更新持仓金额，保持收益不变）
        const position = positions[0];
        const newInvestmentAmount = parseFloat(position.investment_amount) + plan.invest_amount;

        const { error: updateError } = await supabase
          .from('positions')
          .update({
            investment_amount: newInvestmentAmount,
            updated_at: new Date().toISOString()
          })
          .eq('id', position.id);

        if (updateError) throw updateError;

        logInfo('定投执行成功：更新持仓', { 
          fundName: plan.fund_name, 
          oldInvestmentAmount: position.investment_amount,
          newInvestmentAmount
        });
      } else {
        // 创建新持仓
        const { error: insertError } = await supabase
          .from('positions')
          .insert({
            user_id: plan.user_id,
            asset_type: plan.asset_type,
            fund_name: plan.fund_name,
            investment_amount: plan.invest_amount,
            profit_loss: 0
          });

        if (insertError) throw insertError;

        logInfo('定投执行成功：创建新持仓', { 
          fundName: plan.fund_name, 
          amount: plan.invest_amount 
        });
      }

      // 更新定投计划的执行时间
      const nextExecutionDate = this.calculateNextExecutionDate(
        plan.frequency,
        plan.invest_day
      );

      await supabase
        .from('auto_invest_plans')
        .update({
          last_execution_date: new Date().toISOString().split('T')[0],
          next_execution_date: nextExecutionDate
        })
        .eq('id', plan.id);

      logInfo('定投计划执行完成', { planId: plan.id, nextExecutionDate });
    } catch (error) {
      logError('执行定投计划失败', { planId: plan.id, error });
    }
  }

  /**
   * 计算下次执行日期
   */
  private calculateNextExecutionDate(
    frequency: InvestFrequency,
    investDay: number | null
  ): string {
    const today = new Date();
    const nextDate = new Date(today);

    switch (frequency) {
      case 'daily': {
        // 每天执行，下次执行时间是明天
        nextDate.setDate(today.getDate() + 1);
        break;
      }

      case 'weekly': {
        // 每周执行
        const targetDay = investDay || 1; // 默认周一
        const currentDay = today.getDay() || 7; // 周日为7
        let daysUntilTarget = targetDay - currentDay;
        if (daysUntilTarget <= 0) {
          daysUntilTarget += 7;
        }
        nextDate.setDate(today.getDate() + daysUntilTarget);
        break;
      }

      case 'monthly': {
        // 每月执行
        const targetDate = investDay || 1; // 默认每月1号
        nextDate.setMonth(today.getMonth() + 1);
        nextDate.setDate(targetDate);
        
        // 如果目标日期超过了该月的天数，设置为该月最后一天
        if (nextDate.getDate() !== targetDate) {
          nextDate.setDate(0); // 设置为上个月最后一天
        }
        break;
      }
    }

    return nextDate.toISOString().split('T')[0];
  }

  /**
   * 获取定投频率的中文描述
   */
  getFrequencyLabel(frequency: InvestFrequency, investDay: number | null): string {
    switch (frequency) {
      case 'daily':
        return '每天';
      case 'weekly': {
        const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        return `每周${weekDays[investDay || 1]}`;
      }
      case 'monthly':
        return `每月${investDay || 1}号`;
      default:
        return '未知';
    }
  }
}

// 导出单例
export const autoInvestService = new AutoInvestService();
