/**
 * usePositions Hook
 * 管理投资组合持仓数据的 React Hook
 */

import { useState, useEffect, useCallback } from 'react';
import { PositionService } from '../services/positionService';
import { UserService } from '../services/userService';
import { isSupabaseAvailable } from '../services/supabaseClient';
import { logInfo, logError } from '../services/logger';
import { 
  PositionRecord, 
  CreatePositionInput, 
  UpdatePositionInput 
} from '../types/database';

interface UsePositionsResult {
  positions: PositionRecord[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createPosition: (input: CreatePositionInput) => Promise<PositionRecord>;
  updatePosition: (id: string, input: UpdatePositionInput) => Promise<PositionRecord>;
  deletePosition: (id: string) => Promise<void>;
  isSupabaseEnabled: boolean;
}

/**
 * 使用 Supabase 后端存储的持仓数据 Hook
 */
export function usePositions(): UsePositionsResult {
  const [positions, setPositions] = useState<PositionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSupabaseEnabled] = useState(isSupabaseAvailable());

  // 创建稳定的 positionService 实例；登录用户 ID 在请求前异步刷新。
  const [positionService] = useState(() => new PositionService(UserService.getUserIdSync()));

  /**
   * 获取持仓列表
   */
  const fetchPositions = useCallback(async () => {
    if (!isSupabaseEnabled) {
      setLoading(false);
      setError('Supabase 未配置');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const userId = await UserService.getUserId();
      if (!userId) {
        throw new Error('用户未登录');
      }
      positionService.setUserId(userId);

      logInfo('开始获取持仓列表');
      const data = await positionService.getPositions();
      
      setPositions(data);
      logInfo('持仓列表获取成功', { count: data.length });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取持仓列表失败';
      setError(errorMessage);
      logError('获取持仓列表失败', err);
    } finally {
      setLoading(false);
    }
  }, [isSupabaseEnabled, positionService]);

  /**
   * 创建新持仓
   */
  const createPosition = useCallback(async (input: CreatePositionInput): Promise<PositionRecord> => {
    if (!isSupabaseEnabled) {
      throw new Error('Supabase 未配置');
    }

    try {
      logInfo('创建新持仓', { assetType: input.asset_type });
      const userId = await UserService.getUserId();
      if (!userId) {
        throw new Error('用户未登录');
      }
      positionService.setUserId(userId);
      
      // 乐观更新：先创建临时记录
      const tempId = `temp-${Date.now()}`;
      const tempPosition: PositionRecord = {
        id: tempId,
        user_id: userId,
        ...input,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      setPositions(prev => [tempPosition, ...prev]);

      // 实际创建
      const newPosition = await positionService.createPosition(input);
      
      // 替换临时记录
      setPositions(prev => prev.map(p => p.id === tempId ? newPosition : p));
      
      logInfo('持仓创建成功', { id: newPosition.id });
      return newPosition;
    } catch (err) {
      // 回滚乐观更新
      setPositions(prev => prev.filter(p => !p.id.startsWith('temp-')));
      
      const errorMessage = err instanceof Error ? err.message : '创建持仓失败';
      setError(errorMessage);
      logError('创建持仓失败', err);
      throw err;
    }
  }, [isSupabaseEnabled, positionService]);

  /**
   * 更新持仓
   */
  const updatePosition = useCallback(async (id: string, input: UpdatePositionInput): Promise<PositionRecord> => {
    if (!isSupabaseEnabled) {
      throw new Error('Supabase 未配置');
    }

    try {
      logInfo('更新持仓', { id, updates: Object.keys(input) });
      
      // 乐观更新
      const oldPosition = positions.find(p => p.id === id);
      if (oldPosition) {
        setPositions(prev => prev.map(p => 
          p.id === id ? { ...p, ...input, updated_at: new Date().toISOString() } : p
        ));
      }

      // 实际更新
      const updated = await positionService.updatePosition(id, input);
      
      // 使用服务器返回的数据
      setPositions(prev => prev.map(p => p.id === id ? updated : p));
      
      logInfo('持仓更新成功', { id });
      return updated;
    } catch (err) {
      // 回滚乐观更新
      await fetchPositions();
      
      const errorMessage = err instanceof Error ? err.message : '更新持仓失败';
      setError(errorMessage);
      logError('更新持仓失败', err);
      throw err;
    }
  }, [isSupabaseEnabled, positions, fetchPositions, positionService]);

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
  }, [isSupabaseEnabled, fetchPositions, positionService]);

  // 初始加载
  useEffect(() => {
    fetchPositions();
  }, [fetchPositions]);

  return {
    positions,
    loading,
    error,
    refetch: fetchPositions,
    createPosition,
    updatePosition,
    deletePosition,
    isSupabaseEnabled
  };
}
