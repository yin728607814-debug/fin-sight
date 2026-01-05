/**
 * 增强的价格数据Hook
 * 自动处理黄金价格转换和缓存
 */

import { useMemo, useEffect, useState } from 'react';
import { usePriceData } from '../utils/context';
import { goldPriceConverter } from '../services/goldPriceConverter';

/**
 * 转换后的价格数据
 */
export interface ConvertedPriceData {
  /** 原始价格（美元/盎司） */
  originalPrice: number;
  /** 转换后的价格（人民币/克） */
  convertedPrice: number;
  /** 转换时间戳 */
  timestamp: number;
}

/**
 * 价格缓存
 */
interface PriceCache {
  [key: string]: ConvertedPriceData;
}

// 全局价格缓存
const priceCache: PriceCache = {};

/**
 * 使用带转换的价格数据Hook
 * 
 * @param assetType - 资产类型
 * @returns 价格数据和转换后的价格
 */
export function usePriceDataWithConversion(assetType: 'nasdaq' | 'gold') {
  const { priceData, loading, error } = usePriceData(assetType);
  const [conversionError, setConversionError] = useState<string | null>(null);
  const [rateUpdated, setRateUpdated] = useState(false);

  /**
   * 黄金价格：先更新汇率
   */
  useEffect(() => {
    if (assetType === 'gold' && !rateUpdated) {
      goldPriceConverter.updateExchangeRate().then(() => {
        setRateUpdated(true);
      });
    }
  }, [assetType, rateUpdated]);

  /**
   * 获取当前价格（自动转换黄金价格）
   */
  const currentPrice = useMemo(() => {
    if (priceData.length === 0) return null;

    const latestPrice = priceData[priceData.length - 1].close;

    if (assetType === 'gold') {
      try {
        // 检查缓存
        const cacheKey = `gold_${latestPrice}`;
        const cached = priceCache[cacheKey];
        
        // 如果缓存存在且未过期（5分钟内）
        if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
          return cached.convertedPrice;
        }

        // 转换价格：美元/盎司 -> 人民币/克
        const convertedPrice = goldPriceConverter.convertUsdPerOzToCnyPerGram(latestPrice);
        
        // 更新缓存
        priceCache[cacheKey] = {
          originalPrice: latestPrice,
          convertedPrice,
          timestamp: Date.now()
        };

        setConversionError(null);
        return convertedPrice;
      } catch (err) {
        console.error('黄金价格转换失败:', err);
        setConversionError('价格转换失败，请稍后重试');
        return null;
      }
    }

    return latestPrice;
  }, [priceData, assetType]);

  /**
   * 获取历史价格（自动转换黄金价格）
   */
  const historicalPrices = useMemo(() => {
    if (assetType !== 'gold') {
      return priceData;
    }

    try {
      return priceData.map(item => {
        const cacheKey = `gold_${item.close}`;
        const cached = priceCache[cacheKey];

        if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
          return {
            ...item,
            close: cached.convertedPrice,
            high: goldPriceConverter.convertUsdPerOzToCnyPerGram(item.high),
            low: goldPriceConverter.convertUsdPerOzToCnyPerGram(item.low),
            open: goldPriceConverter.convertUsdPerOzToCnyPerGram(item.open)
          };
        }

        const convertedClose = goldPriceConverter.convertUsdPerOzToCnyPerGram(item.close);
        
        priceCache[cacheKey] = {
          originalPrice: item.close,
          convertedPrice: convertedClose,
          timestamp: Date.now()
        };

        return {
          ...item,
          close: convertedClose,
          high: goldPriceConverter.convertUsdPerOzToCnyPerGram(item.high),
          low: goldPriceConverter.convertUsdPerOzToCnyPerGram(item.low),
          open: goldPriceConverter.convertUsdPerOzToCnyPerGram(item.open)
        };
      });
    } catch (err) {
      console.error('历史价格转换失败:', err);
      setConversionError('历史价格转换失败');
      return priceData;
    }
  }, [priceData, assetType]);

  /**
   * 获取价格单位
   */
  const priceUnit = assetType === 'gold' ? '人民币/克' : '美元';

  /**
   * 清理过期缓存
   */
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      Object.keys(priceCache).forEach(key => {
        if (now - priceCache[key].timestamp > 5 * 60 * 1000) {
          delete priceCache[key];
        }
      });
    }, 60 * 1000); // 每分钟清理一次

    return () => clearInterval(cleanupInterval);
  }, []);

  return {
    /** 原始价格数据 */
    priceData,
    /** 转换后的历史价格 */
    historicalPrices,
    /** 当前价格（已转换） */
    currentPrice,
    /** 价格单位 */
    priceUnit,
    /** 加载状态 */
    loading,
    /** 原始错误 */
    error,
    /** 转换错误 */
    conversionError,
    /** 是否有错误 */
    hasError: !!error || !!conversionError
  };
}

/**
 * 清除价格缓存
 */
export function clearPriceCache() {
  Object.keys(priceCache).forEach(key => delete priceCache[key]);
}

/**
 * 获取缓存统计
 */
export function getPriceCacheStats() {
  const keys = Object.keys(priceCache);
  const now = Date.now();
  const validCache = keys.filter(key => now - priceCache[key].timestamp < 5 * 60 * 1000);
  
  return {
    total: keys.length,
    valid: validCache.length,
    expired: keys.length - validCache.length
  };
}
