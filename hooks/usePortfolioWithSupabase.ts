/**
 * usePortfolioWithSupabase Hook
 * 使用 Supabase 后端存储的投资组合 Hook
 * 保持与原有 portfolioService 兼容的接口
 */

import { useState, useEffect, useCallback } from 'react';
import { Position } from '../services/portfolioService';
import { positionService } from '../services/positionService';
import { isSupabaseAvailable } from '../services/supabaseClient';
import { logInfo, logError } from '../services/logger';
import { useAuth } from '../utils/AuthContext';
import { 
  positionRecordToPosition,
  positionToCreateInput,
  positionToUpdateInput
} from '../services/portfolioAdapter';

interface UsePortfolioWithSupabaseResult {
  positions: Position[];
  loading: boolean;
  error: string | null;
  isSupabaseEnabled: boolean;
  
  // CRUD 操作
  addPosition: (position: Omit<Position, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updatePosition: (id: string, updates: Partial<Position>) => Promise<void>;
  deletePosition: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
  
  // 导出功能
  exportPositions: () => string;
}

/**
 * 使用 Supabase 后端存储的投资组合 Hook
 */
export function usePortfolioWithSupabase(): UsePortfolioWithSupabaseResult {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSupabaseEnabled] = useState(isSupabaseAvailable());
  const { user } = useAuth();

  // 当用户登录后，更新 positionService 的 userId
  useEffect(() => {
    if (user?.id) {
      positionService.setUserId(user.id);
    }
  }, [user?.id]);

  /**
   * 获取持仓列表
   */
  const fetchPositions = useCallback(async () => {
    if (!isSupabaseEnabled) {
      setLoading(false);
      setError('Supabase 未配置，请配置后使用');
      return;
    }

    if (!user?.id) {
      setLoading(false);
      setError('用户未登录');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      logInfo('开始获取持仓列表');
      const records = await positionService.getPositions();
      
      // 转换为 Position 格式
      const convertedPositions = records.map(positionRecordToPosition);
      
      setPositions(convertedPositions);
      logInfo('持仓列表获取成功', { count: convertedPositions.length });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取持仓列表失败';
      setError(errorMessage);
      logError('获取持仓列表失败', err);
    } finally {
      setLoading(false);
    }
  }, [isSupabaseEnabled, user?.id]);

  /**
   * 添加新持仓
   */
  const addPosition = useCallback(async (position: Omit<Position, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> => {
    if (!isSupabaseEnabled) {
      throw new Error('Supabase 未配置');
    }

    try {
      logInfo('创建新持仓', { assetType: position.assetType });
      
      // 转换为 CreatePositionInput
      const input = positionToCreateInput(position);
      
      // 乐观更新：先创建临时记录
      const tempPosition: Position = {
        ...position,
        id: `temp-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      setPositions(prev => [tempPosition, ...prev]);

      // 实际创建
      const newRecord = await positionService.createPosition(input);
      const newPosition = positionRecordToPosition(newRecord);
      
      // 替换临时记录
      setPositions(prev => prev.map(p => p.id === tempPosition.id ? newPosition : p));
      
      logInfo('持仓创建成功', { id: newPosition.id });
    } catch (err) {
      // 回滚乐观更新
      setPositions(prev => prev.filter(p => !p.id.startsWith('temp-')));
      
      const errorMessage = err instanceof Error ? err.message : '创建持仓失败';
      setError(errorMessage);
      logError('创建持仓失败', err);
      throw err;
    }
  }, [isSupabaseEnabled]);

  /**
   * 更新持仓
   */
  const updatePosition = useCallback(async (id: string, updates: Partial<Position>): Promise<void> => {
    if (!isSupabaseEnabled) {
      throw new Error('Supabase 未配置');
    }

    try {
      logInfo('更新持仓', { id, updates: Object.keys(updates) });
      
      // 乐观更新
      const oldPosition = positions.find(p => p.id === id);
      if (oldPosition) {
        setPositions(prev => prev.map(p => 
          p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p
        ));
      }

      // 转换为 UpdatePositionInput
      const input = positionToUpdateInput(updates);
      
      // 实际更新
      const updatedRecord = await positionService.updatePosition(id, input);
      const updatedPosition = positionRecordToPosition(updatedRecord);
      
      // 使用服务器返回的数据
      setPositions(prev => prev.map(p => p.id === id ? updatedPosition : p));
      
      logInfo('持仓更新成功', { id });
    } catch (err) {
      // 回滚乐观更新
      await fetchPositions();
      
      const errorMessage = err instanceof Error ? err.message : '更新持仓失败';
      setError(errorMessage);
      logError('更新持仓失败', err);
      throw err;
    }
  }, [isSupabaseEnabled, positions, fetchPositions]);

  /**
   * 删除持仓
   */
  const deletePosition = useCallback(async (id: string): Promise<void> => {
    if (!isSupabaseEnabled) {
      throw new Error('Supabase 未配置');
    }

    try {
      logInfo('删除持仓', { id });
      
      // 乐观更新
      setPositions(prev => prev.filter(p => p.id !== id));

      // 实际删除
      await positionService.deletePosition(id);
      
      logInfo('持仓删除成功', { id });
    } catch (err) {
      // 回滚乐观更新
      await fetchPositions();
      
      const errorMessage = err instanceof Error ? err.message : '删除持仓失败';
      setError(errorMessage);
      logError('删除持仓失败', err);
      throw err;
    }
  }, [isSupabaseEnabled, fetchPositions]);

  /**
   * 导出持仓数据
   */
  const exportPositions = useCallback((): string => {
    const exportData = {
      positions: positions.map(p => ({
        id: p.id,
        assetType: p.assetType,
        assetName: p.assetName,
        fundName: p.fundName,
        quantity: p.quantity,
        averageBuyPrice: p.averageBuyPrice,
        investmentAmount: p.investmentAmount,
        profitLoss: p.profitLoss,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString()
      })),
      exportedAt: new Date().toISOString(),
      version: '2.0'
    };
    
    return JSON.stringify(exportData, null, 2);
  }, [positions]);

  // 初始加载
  useEffect(() => {
    fetchPositions();
  }, [fetchPositions]);

  return {
    positions,
    loading,
    error,
    isSupabaseEnabled,
    addPosition,
    updatePosition,
    deletePosition,
    refetch: fetchPositions,
    exportPositions
  };
}
