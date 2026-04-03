/**
 * Prompt 配置服务
 * 管理用户自定义的分析策略 Prompt
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { AssetType } from '../types';

interface UserPrompt {
  id?: number;
  userId: string;
  assetType: AssetType;
  promptContent: string;
  createdAt: Date;
  updatedAt: Date;
}

interface PromptDB extends DBSchema {
  userPrompts: {
    key: number;
    value: UserPrompt;
    indexes: { 'by-user-asset': [string, AssetType] };
  };
}

class PromptConfigService {
  private dbPromise: Promise<IDBPDatabase<PromptDB>> | null = null;

  /**
   * 初始化数据库
   */
  private async initDB(): Promise<IDBPDatabase<PromptDB>> {
    if (!this.dbPromise) {
      this.dbPromise = openDB<PromptDB>('prompt-config-db', 1, {
        upgrade(db) {
          if (!db.objectStoreNames.contains('userPrompts')) {
            const store = db.createObjectStore('userPrompts', {
              keyPath: 'id',
              autoIncrement: true,
            });
            store.createIndex('by-user-asset', ['userId', 'assetType'], { unique: true });
          }
        },
      });
    }
    return this.dbPromise;
  }

  /**
   * 获取用户的自定义 Prompt
   */
  async getUserPrompt(userId: string, assetType: AssetType): Promise<string | null> {
    try {
      const db = await this.initDB();
      const index = db.transaction('userPrompts').store.index('by-user-asset');
      const prompt = await index.get([userId, assetType]);
      return prompt?.promptContent || null;
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
      const db = await this.initDB();
      const tx = db.transaction('userPrompts', 'readwrite');
      const index = tx.store.index('by-user-asset');
      
      // 检查是否已存在
      const existing = await index.get([userId, assetType]);
      
      if (existing) {
        // 更新
        await tx.store.put({
          ...existing,
          promptContent,
          updatedAt: new Date(),
        });
      } else {
        // 新增
        await tx.store.add({
          userId,
          assetType,
          promptContent,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
      
      await tx.done;
      console.log(`✅ 保存用户 Prompt 成功: ${userId} - ${assetType}`);
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
      const db = await this.initDB();
      const tx = db.transaction('userPrompts', 'readwrite');
      const index = tx.store.index('by-user-asset');
      
      const existing = await index.get([userId, assetType]);
      if (existing && existing.id) {
        await tx.store.delete(existing.id);
      }
      
      await tx.done;
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
