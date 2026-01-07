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
   * 使用A股基金数据Hook（智能刷新版本）
   * @param fundNames 基金名称列表
   * @param enableSmartRefresh 是否启用智能刷新（默认false）
   * - 交易时间内（工作日 9:30-15:00）：每1分钟刷新一次
   * - 收盘后（15:00-15:30）：每5分钟刷新一次，获取最终数据
   * - 其他时间：不刷新
   */
  export function useAStockFundData(
    fundNames: string[],
    enableSmartRefresh: boolean = false,
    manualRefreshInterval?: number
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
     * 智能自动刷新
     */
    useEffect(() => {
      if (!enableSmartRefresh || fundNamesKey.length === 0) {
        return;
      }
  
      const checkAndRefresh = () => {
        const now = new Date();
        const day = now.getDay();
        const hour = now.getHours();
        const minute = now.getMinutes();
        const currentTime = hour * 60 + minute;
  
        // 周末不刷新
        if (day === 0 || day === 6) {
          return null;
        }
  
        // 交易时间内（9:30-15:00）：每1分钟刷新
        const marketOpen = 9 * 60 + 30; // 9:30
        const marketClose = 15 * 60; // 15:00
        const afterMarketClose = 15 * 60 + 30; // 15:30
  
        if (currentTime >= marketOpen && currentTime < marketClose) {
          // 交易时间内：1分钟刷新
          return 60 * 1000;
        } else if (currentTime >= marketClose && currentTime < afterMarketClose) {
          // 收盘后30分钟内：5分钟刷新一次，获取最终数据
          return 5 * 60 * 1000;
        }
  
        // 其他时间不刷新
        return null;
      };
  
      // 如果有手动指定的刷新间隔，使用手动间隔
      if (manualRefreshInterval) {
        const intervalId = setInterval(() => {
          fetchData();
        }, manualRefreshInterval);
        return () => clearInterval(intervalId);
      }
  
      // 使用智能刷新
      const setupNextRefresh = () => {
        const interval = checkAndRefresh();
        if (interval) {
          const intervalId = setInterval(() => {
            fetchData();
          }, interval);
          return intervalId;
        }
        return null;
      };
  
      let intervalId = setupNextRefresh();
  
      // 每分钟检查一次是否需要调整刷新间隔
      const checkIntervalId = setInterval(() => {
        if (intervalId) {
          clearInterval(intervalId);
        }
        intervalId = setupNextRefresh();
      }, 60 * 1000);
  
      return () => {
        if (intervalId) {
          clearInterval(intervalId);
        }
        clearInterval(checkIntervalId);
      };
    }, [enableSmartRefresh, manualRefreshInterval, fetchData, fundNamesKey]);
  
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
  