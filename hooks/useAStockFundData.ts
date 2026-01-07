/**
 * A股基金数据Hook
 * 用于获取和管理A股基金的实时数据
 */

import { useState, useEffect, useCallback } from 'react';
import { aStockFundService, FundRealtimeData } from '../services/aStockFundService';

interface UseAStockFundDataResult {
  fundDataMap: Map<string, FundRealtimeData>;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  lastUpdate: Date | null;
}

/**
 * 使用A股基金数据Hook
 * @param fundNames 基金名称列表
 * @param autoRefresh 是否自动刷新（默认false）
 * @param refreshInterval 刷新间隔（毫秒，默认60000 = 1分钟）
 */
export function useAStockFundData(
  fundNames: string[],
  autoRefresh: boolean = false,
  refreshInterval: number = 60000
): UseAStockFundDataResult {
  const [fundDataMap, setFundDataMap] = useState<Map<string, FundRealtimeData>>(new Map());
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // 将fundNames转换为字符串，避免引用比较问题
  const fundNamesKey = fundNames.sort().join(',');

  /**
   * 获取基金数据
   */
  const fetchData = useCallback(async () => {
    const names = fundNamesKey.split(',').filter(n => n.length > 0);
    
    if (names.length === 0) {
      setFundDataMap(new Map());
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await aStockFundService.getBatchFundData(names);
      setFundDataMap(data);
      setLastUpdate(new Date());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取A股基金数据失败';
      setError(errorMessage);
      console.error('获取A股基金数据失败:', err);
    } finally {
      setLoading(false);
    }
  }, [fundNamesKey]);

  /**
   * 手动刷新
   */
  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  /**
   * 初始加载
   */
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /**
   * 自动刷新
   */
  useEffect(() => {
    if (!autoRefresh || fundNamesKey.length === 0) {
      return;
    }

    const intervalId = setInterval(() => {
      fetchData();
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [autoRefresh, refreshInterval, fetchData, fundNamesKey]);

  return {
    fundDataMap,
    loading,
    error,
    refetch,
    lastUpdate
  };
}

/**
 * 检查是否在交易时间内
 * 交易时间：工作日 9:30-15:00
 */
export function isMarketOpen(): boolean {
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();
  const minute = now.getMinutes();

  // 周末不交易
  if (day === 0 || day === 6) {
    return false;
  }

  // 9:30-15:00
  const currentTime = hour * 60 + minute;
  const marketOpen = 9 * 60 + 30; // 9:30
  const marketClose = 15 * 60; // 15:00

  return currentTime >= marketOpen && currentTime < marketClose;
}
