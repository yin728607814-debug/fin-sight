/**
 * 纳斯达克基金数据Hook
 * 用于获取和管理纳斯达克QDII基金的实时数据
 */

import { useState, useEffect, useCallback } from 'react';
import { nasdaqFundService, NasdaqFundRealtimeData } from '../services/nasdaqFundService';

interface UseNasdaqFundDataResult {
  fundDataMap: Map<string, NasdaqFundRealtimeData>;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  lastUpdate: Date | null;
}

/**
 * 使用纳斯达克基金数据Hook（智能刷新版本）
 * @param fundNames 基金名称列表
 * @param enableSmartRefresh 是否启用智能刷新（默认false）
 * - 美股交易时间（北京时间）：
 *   夏令时：21:30-次日4:00
 *   冬令时：22:30-次日5:00
 * - 交易时间内：每5分钟刷新一次（QDII基金更新较慢）
 * - 收盘后1小时内：每10分钟刷新一次
 * - 其他时间：不刷新
 */
export function useNasdaqFundData(
  fundNames: string[],
  enableSmartRefresh: boolean = false,
  manualRefreshInterval?: number
): UseNasdaqFundDataResult {
  const [fundDataMap, setFundDataMap] = useState<Map<string, NasdaqFundRealtimeData>>(new Map());
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
      const data = await nasdaqFundService.getBatchFundData(names);
      setFundDataMap(data);
      setLastUpdate(new Date());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取纳斯达克基金数据失败';
      setError(errorMessage);
      console.error('获取纳斯达克基金数据失败:', err);
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
      const hour = now.getHours();
      const minute = now.getMinutes();
      const currentTime = hour * 60 + minute;

      // 判断是否是夏令时（3月第二个周日-11月第一个周日）
      const month = now.getMonth() + 1;
      const isDST = month >= 3 && month <= 11; // 简化判断

      // 美股交易时间（北京时间）
      let marketOpen, marketClose, afterMarketClose;
      
      if (isDST) {
        // 夏令时：21:30-次日4:00
        marketOpen = 21 * 60 + 30; // 21:30
        marketClose = 4 * 60; // 4:00（次日）
        afterMarketClose = 5 * 60; // 5:00（次日）
      } else {
        // 冬令时：22:30-次日5:00
        marketOpen = 22 * 60 + 30; // 22:30
        marketClose = 5 * 60; // 5:00（次日）
        afterMarketClose = 6 * 60; // 6:00（次日）
      }

      // 处理跨日情况
      if (currentTime >= marketOpen || currentTime < afterMarketClose) {
        // 交易时间或收盘后
        if (currentTime >= marketOpen) {
          // 交易时间内：5分钟刷新（QDII基金更新较慢）
          return 5 * 60 * 1000;
        } else if (currentTime < marketClose) {
          // 仍在交易中（跨日）
          return 5 * 60 * 1000;
        } else if (currentTime < afterMarketClose) {
          // 收盘后1小时内：10分钟刷新
          return 10 * 60 * 1000;
        }
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
 * 检查是否在美股交易时间内
 * 夏令时：21:30-次日4:00
 * 冬令时：22:30-次日5:00
 */
export function isUSMarketOpen(): boolean {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const currentTime = hour * 60 + minute;
  const month = now.getMonth() + 1;
  const isDST = month >= 3 && month <= 11;

  if (isDST) {
    // 夏令时
    return currentTime >= 21 * 60 + 30 || currentTime < 4 * 60;
  } else {
    // 冬令时
    return currentTime >= 22 * 60 + 30 || currentTime < 5 * 60;
  }
}
