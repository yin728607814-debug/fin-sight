/**
 * 数据迁移服务
 * 将本地存储的数据迁移到 Supabase 后端
 */

import { PositionService } from './positionService';
import { UserService } from './userService';
import { isSupabaseAvailable } from './supabaseClient';
import { logInfo, logError } from './logger';
import { EnhancedPosition } from '../types';
import { CreatePositionInput } from '../types/database';

const LOCAL_STORAGE_KEY = 'portfolio_positions';
const MIGRATION_STATUS_KEY = 'portfolio_migration_status';
const MIGRATION_TIMESTAMP_KEY = 'portfolio_migration_timestamp';

/**
 * 迁移状态
 */
export enum MigrationStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

/**
 * 迁移结果
 */
export interface MigrationResult {
  success: boolean;
  count: number;
  errors?: string[];
  timestamp?: string;
}

/**
 * 数据迁移服务类
 */
export class MigrationService {
  /**
   * 检查是否有本地数据需要迁移
   */
  static hasLocalData(): boolean {
    try {
      const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!localData) return false;

      const positions = JSON.parse(localData);
      return Array.isArray(positions) && positions.length > 0;
    } catch (error) {
      logError('检查本地数据失败', error);
      return false;
    }
  }

  /**
   * 获取本地数据数量
   */
  static getLocalDataCount(): number {
    try {
      const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!localData) return 0;

      const positions = JSON.parse(localData);
      return Array.isArray(positions) ? positions.length : 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * 获取迁移状态
   */
  static getMigrationStatus(): MigrationStatus {
    const status = localStorage.getItem(MIGRATION_STATUS_KEY);
    return (status as MigrationStatus) || MigrationStatus.NOT_STARTED;
  }

  /**
   * 设置迁移状态
   */
  private static setMigrationStatus(status: MigrationStatus): void {
    localStorage.setItem(MIGRATION_STATUS_KEY, status);
    if (status === MigrationStatus.COMPLETED) {
      localStorage.setItem(MIGRATION_TIMESTAMP_KEY, new Date().toISOString());
    }
  }

  /**
   * 检查是否需要迁移
   */
  static needsMigration(): boolean {
    // 如果 Supabase 不可用，不需要迁移
    if (!isSupabaseAvailable()) {
      return false;
    }

    // 如果已经迁移完成，不需要再次迁移
    if (this.getMigrationStatus() === MigrationStatus.COMPLETED) {
      return false;
    }

    // 如果有本地数据，需要迁移
    return this.hasLocalData();
  }

  /**
   * 将 EnhancedPosition 转换为 CreatePositionInput
   */
  private static convertToInput(position: EnhancedPosition): CreatePositionInput {
    return {
      asset_type: position.assetType,
      fund_name: position.fundName,
      quantity: position.quantity,
      average_buy_price: position.averageBuyPrice,
      investment_amount: position.investmentAmount,
      profit_loss: position.profitLoss
    };
  }

  /**
   * 执行数据迁移
   */
  static async migrateFromLocalStorage(): Promise<MigrationResult> {
    try {
      logInfo('开始数据迁移');

      // 检查 Supabase 是否可用
      if (!isSupabaseAvailable()) {
        throw new Error('Supabase 未配置，无法迁移数据');
      }

      // 设置迁移状态
      this.setMigrationStatus(MigrationStatus.IN_PROGRESS);

      // 读取本地数据
      const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!localData) {
        logInfo('没有本地数据需要迁移');
        this.setMigrationStatus(MigrationStatus.COMPLETED);
        return { success: true, count: 0 };
      }

      const positions: EnhancedPosition[] = JSON.parse(localData);
      if (positions.length === 0) {
        logInfo('本地数据为空');
        this.setMigrationStatus(MigrationStatus.COMPLETED);
        return { success: true, count: 0 };
      }

      logInfo('读取到本地数据', { count: positions.length });

      // 转换数据格式
      const inputs = positions.map(pos => this.convertToInput(pos));

      // 批量上传到后端
      const userId = await UserService.getUserId();
      if (!userId) {
        throw new Error('用户未登录，无法迁移数据');
      }
      const positionService = new PositionService(userId);
      const result = await positionService.batchCreatePositions(inputs);

      if (result.imported > 0) {
        // 迁移成功，清除本地数据
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        this.setMigrationStatus(MigrationStatus.COMPLETED);

        logInfo('数据迁移成功', { 
          imported: result.imported,
          failed: result.failed 
        });

        return {
          success: true,
          count: result.imported,
          errors: result.errors?.map(e => e.error),
          timestamp: new Date().toISOString()
        };
      } else {
        // 迁移失败
        this.setMigrationStatus(MigrationStatus.FAILED);
        
        logError('数据迁移失败', { 
          failed: result.failed,
          errors: result.errors 
        });

        return {
          success: false,
          count: 0,
          errors: result.errors?.map(e => e.error) || ['迁移失败']
        };
      }
    } catch (error) {
      this.setMigrationStatus(MigrationStatus.FAILED);
      
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      logError('数据迁移异常', error);

      return {
        success: false,
        count: 0,
        errors: [errorMessage]
      };
    }
  }

  /**
   * 重置迁移状态（用于重新迁移）
   */
  static resetMigrationStatus(): void {
    localStorage.removeItem(MIGRATION_STATUS_KEY);
    localStorage.removeItem(MIGRATION_TIMESTAMP_KEY);
    logInfo('迁移状态已重置');
  }

  /**
   * 导出数据为 JSON 文件
   */
  static async exportData(): Promise<void> {
    try {
      const userId = await UserService.getUserId();
      if (!userId) {
        throw new Error('用户未登录，无法导出数据');
      }
      const positionService = new PositionService(userId);
      const positions = await positionService.getPositions();

      const dataStr = JSON.stringify(positions, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `portfolio-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
      logInfo('数据导出成功', { count: positions.length });
    } catch (error) {
      logError('数据导出失败', error);
      throw error;
    }
  }

  /**
   * 从 JSON 文件导入数据
   */
  static async importData(file: File): Promise<MigrationResult> {
    try {
      const text = await file.text();
      const positions = JSON.parse(text);

      if (!Array.isArray(positions)) {
        throw new Error('无效的备份文件格式');
      }

      const inputs = positions.map(pos => this.convertToInput(pos));

      const userId = await UserService.getUserId();
      if (!userId) {
        throw new Error('用户未登录，无法导入数据');
      }
      const positionService = new PositionService(userId);
      const result = await positionService.batchCreatePositions(inputs);

      logInfo('数据导入完成', { 
        imported: result.imported,
        failed: result.failed 
      });

      return {
        success: result.imported > 0,
        count: result.imported,
        errors: result.errors?.map(e => e.error)
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '导入失败';
      logError('数据导入失败', error);
      
      return {
        success: false,
        count: 0,
        errors: [errorMessage]
      };
    }
  }
}
