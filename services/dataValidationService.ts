/**
 * 数据验证服务
 * 实现历史价格数据的验证和质量保证
 */

import { HistoricalPriceData } from '../types';
import { logInfo, logWarn, logError } from './logger';

/**
 * 数据验证结果接口
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  qualityScore: number; // 0-100的质量评分
  metadata: {
    totalDataPoints: number;
    validDataPoints: number;
    missingDataPoints: number;
    anomalousDataPoints: number;
    dateRange: {
      start: string;
      end: string;
    };
  };
}

/**
 * 价格异常检测结果
 */
export interface AnomalyDetectionResult {
  isAnomalous: boolean;
  anomalyType: 'price_spike' | 'price_drop' | 'volume_spike' | 'missing_data' | 'invalid_range';
  severity: 'low' | 'medium' | 'high';
  description: string;
  suggestedAction: string;
}

/**
 * 数据质量指标
 */
export interface DataQualityMetrics {
  completeness: number; // 数据完整性 (0-100)
  consistency: number; // 数据一致性 (0-100)
  accuracy: number; // 数据准确性 (0-100)
  timeliness: number; // 数据时效性 (0-100)
  overall: number; // 总体质量评分 (0-100)
}

/**
 * 数据验证服务类
 */
export class DataValidationService {
  private readonly priceRanges = {
    gold: { min: 1000, max: 3000 }, // 黄金价格合理范围 (USD/oz)
    nasdaq: { min: 10000, max: 20000 } // 纳斯达克指数合理范围
  };

  private readonly maxDailyChangePercent = 10; // 最大日变化百分比
  private readonly maxVolumeMultiplier = 5; // 最大成交量倍数

  /**
   * 验证历史价格数据
   */
  public validateHistoricalData(
    data: HistoricalPriceData[], 
    assetType: 'gold' | 'nasdaq' = 'gold'
  ): ValidationResult {
    logInfo('开始验证历史价格数据', { 
      dataPoints: data.length, 
      assetType 
    });

    const errors: string[] = [];
    const warnings: string[] = [];
    let validDataPoints = 0;
    let anomalousDataPoints = 0;

    if (!data || data.length === 0) {
      errors.push('数据集为空');
      return this.createValidationResult(false, errors, warnings, data, 0, 0, 0);
    }

    // 首先检查原始数据的日期顺序
    const originalOrderErrors = this.validateOriginalDateOrder(data);
    errors.push(...originalOrderErrors);

    // 按日期排序
    const sortedData = [...data].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // 验证每个数据点
    for (let i = 0; i < sortedData.length; i++) {
      const dataPoint = sortedData[i];
      const validationErrors = this.validateSingleDataPoint(dataPoint, assetType);
      
      if (validationErrors.length === 0) {
        validDataPoints++;
      } else {
        errors.push(...validationErrors);
      }

      // 检测异常
      const anomalies = this.detectAnomalies(dataPoint, sortedData, i, assetType);
      if (anomalies.length > 0) {
        anomalousDataPoints++;
        warnings.push(...anomalies.map(a => `${a.anomalyType}: ${a.description}`));
      }
    }

    // 验证数据连续性（使用排序后的数据）
    const continuityErrors = this.validateDataContinuity(sortedData);
    errors.push(...continuityErrors);

    // 计算质量评分
    const qualityScore = this.calculateQualityScore(
      data.length, 
      validDataPoints, 
      anomalousDataPoints, 
      errors.length, 
      warnings.length
    );

    const isValid = errors.length === 0 && validDataPoints > 0;

    logInfo('数据验证完成', {
      isValid,
      totalDataPoints: data.length,
      validDataPoints,
      anomalousDataPoints,
      errorsCount: errors.length,
      warningsCount: warnings.length,
      qualityScore
    });

    return this.createValidationResult(
      isValid, 
      errors, 
      warnings, 
      sortedData, 
      validDataPoints, 
      data.length - validDataPoints, 
      anomalousDataPoints,
      qualityScore
    );
  }

  /**
   * 验证原始数据的日期顺序
   */
  private validateOriginalDateOrder(data: HistoricalPriceData[]): string[] {
    const errors: string[] = [];

    if (data.length < 2) {
      return errors;
    }

    for (let i = 1; i < data.length; i++) {
      const currentDate = new Date(data[i].date);
      const previousDate = new Date(data[i - 1].date);
      
      // 检查日期是否有效
      if (isNaN(currentDate.getTime()) || isNaN(previousDate.getTime())) {
        continue; // 跳过无效日期，这些会在单个数据点验证中被捕获
      }
      
      // 检查日期顺序
      if (currentDate < previousDate) {
        errors.push(`日期顺序错误: ${data[i].date} 应该在 ${data[i - 1].date} 之后`);
      }
    }

    return errors;
  }

  /**
   * 验证单个数据点
   */
  private validateSingleDataPoint(
    dataPoint: HistoricalPriceData, 
    assetType: 'gold' | 'nasdaq'
  ): string[] {
    const errors: string[] = [];

    // 验证必需字段
    if (!dataPoint.date) {
      errors.push('缺少日期字段');
    }

    if (typeof dataPoint.open !== 'number' || isNaN(dataPoint.open)) {
      errors.push('开盘价无效');
    }

    if (typeof dataPoint.high !== 'number' || isNaN(dataPoint.high)) {
      errors.push('最高价无效');
    }

    if (typeof dataPoint.low !== 'number' || isNaN(dataPoint.low)) {
      errors.push('最低价无效');
    }

    if (typeof dataPoint.close !== 'number' || isNaN(dataPoint.close)) {
      errors.push('收盘价无效');
    }

    if (typeof dataPoint.volume !== 'number' || isNaN(dataPoint.volume) || dataPoint.volume < 0) {
      errors.push('成交量无效');
    }

    // 验证OHLC逻辑关系
    if (dataPoint.high < dataPoint.low) {
      errors.push('最高价不能低于最低价');
    }

    if (dataPoint.high < dataPoint.open || dataPoint.high < dataPoint.close) {
      errors.push('最高价必须大于等于开盘价和收盘价');
    }

    if (dataPoint.low > dataPoint.open || dataPoint.low > dataPoint.close) {
      errors.push('最低价必须小于等于开盘价和收盘价');
    }

    // 验证价格范围合理性
    const priceRange = this.priceRanges[assetType];
    if (dataPoint.close < priceRange.min || dataPoint.close > priceRange.max) {
      errors.push(`价格超出合理范围 (${priceRange.min}-${priceRange.max})`);
    }

    // 验证日期格式
    const date = new Date(dataPoint.date);
    if (isNaN(date.getTime())) {
      errors.push('日期格式无效');
    }

    return errors;
  }

  /**
   * 检测数据异常
   */
  private detectAnomalies(
    dataPoint: HistoricalPriceData,
    allData: HistoricalPriceData[],
    index: number,
    _assetType: 'gold' | 'nasdaq'
  ): AnomalyDetectionResult[] {
    const anomalies: AnomalyDetectionResult[] = [];

    // 检测价格突变
    if (index > 0) {
      const previousPoint = allData[index - 1];
      const changePercent = Math.abs((dataPoint.close - previousPoint.close) / previousPoint.close * 100);
      
      if (changePercent > this.maxDailyChangePercent) {
        anomalies.push({
          isAnomalous: true,
          anomalyType: changePercent > 0 ? 'price_spike' : 'price_drop',
          severity: changePercent > 20 ? 'high' : changePercent > 15 ? 'medium' : 'low',
          description: `日变化幅度过大: ${changePercent.toFixed(2)}%`,
          suggestedAction: '检查数据来源，确认是否为真实市场波动'
        });
      }
    }

    // 检测成交量异常
    if (index > 2) {
      const recentVolumes = allData.slice(Math.max(0, index - 3), index)
        .map(d => d.volume)
        .filter((volume): volume is number => typeof volume === 'number');
      if (recentVolumes.length === 0 || typeof dataPoint.volume !== 'number') {
        return anomalies;
      }
      const avgVolume = recentVolumes.reduce((sum, vol) => sum + vol, 0) / recentVolumes.length;
      
      if (dataPoint.volume > avgVolume * this.maxVolumeMultiplier) {
        anomalies.push({
          isAnomalous: true,
          anomalyType: 'volume_spike',
          severity: dataPoint.volume > avgVolume * 10 ? 'high' : 'medium',
          description: `成交量异常增加: ${(dataPoint.volume / avgVolume).toFixed(2)}倍`,
          suggestedAction: '检查是否有重大市场事件或数据错误'
        });
      }
    }

    return anomalies;
  }

  /**
   * 验证数据连续性
   */
  private validateDataContinuity(sortedData: HistoricalPriceData[]): string[] {
    const errors: string[] = [];

    if (sortedData.length < 2) {
      return errors;
    }

    for (let i = 1; i < sortedData.length; i++) {
      const currentDate = new Date(sortedData[i].date);
      const previousDate = new Date(sortedData[i - 1].date);
      
      // 检查日期是否有效
      if (isNaN(currentDate.getTime()) || isNaN(previousDate.getTime())) {
        continue; // 跳过无效日期，这些会在单个数据点验证中被捕获
      }
      
      // 检查日期顺序
      if (currentDate <= previousDate) {
        errors.push(`日期顺序错误: ${sortedData[i].date} 应该在 ${sortedData[i - 1].date} 之后`);
      }

      // 检查日期间隔（工作日）
      const daysDiff = Math.floor((currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff > 7) { // 超过一周的间隔可能表示缺失数据
        errors.push(`数据间隔过大: ${sortedData[i - 1].date} 到 ${sortedData[i].date} 相隔 ${daysDiff} 天`);
      }
    }

    return errors;
  }

  /**
   * 计算数据质量评分
   */
  private calculateQualityScore(
    totalPoints: number,
    validPoints: number,
    anomalousPoints: number,
    errorCount: number,
    warningCount: number
  ): number {
    if (totalPoints === 0) return 0;

    // 基础分数基于有效数据点比例
    const completenessScore = (validPoints / totalPoints) * 100;
    
    // 扣除异常数据点的分数
    const anomalyPenalty = (anomalousPoints / totalPoints) * 20;
    
    // 扣除错误的分数
    const errorPenalty = Math.min(errorCount * 5, 30);
    
    // 扣除警告的分数
    const warningPenalty = Math.min(warningCount * 2, 20);

    const finalScore = Math.max(0, completenessScore - anomalyPenalty - errorPenalty - warningPenalty);
    
    return Math.round(finalScore);
  }

  /**
   * 创建验证结果对象
   */
  private createValidationResult(
    isValid: boolean,
    errors: string[],
    warnings: string[],
    data: HistoricalPriceData[],
    validDataPoints: number,
    missingDataPoints: number,
    anomalousDataPoints: number,
    qualityScore: number = 0
  ): ValidationResult {
    const formatDate = (date: Date | string): string => {
      const parsed = new Date(date);
      return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString();
    };

    const dateRange = data.length > 0 ? {
      start: formatDate(data[0].date),
      end: formatDate(data[data.length - 1].date)
    } : { start: '', end: '' };

    return {
      isValid,
      errors,
      warnings,
      qualityScore,
      metadata: {
        totalDataPoints: data.length,
        validDataPoints,
        missingDataPoints,
        anomalousDataPoints,
        dateRange
      }
    };
  }

  /**
   * 获取数据质量指标
   */
  public getDataQualityMetrics(validationResult: ValidationResult): DataQualityMetrics {
    const { metadata, errors } = validationResult;
    
    // 完整性：基于有效数据点比例
    const completeness = metadata.totalDataPoints > 0 
      ? (metadata.validDataPoints / metadata.totalDataPoints) * 100 
      : 0;

    // 一致性：基于异常数据点比例
    const consistency = metadata.totalDataPoints > 0
      ? Math.max(0, 100 - (metadata.anomalousDataPoints / metadata.totalDataPoints) * 100)
      : 0;

    // 准确性：基于错误数量
    const accuracy = Math.max(0, 100 - errors.length * 10);

    // 时效性：基于数据的新鲜度（这里简化处理）
    const timeliness = 90; // 假设数据相对新鲜

    // 总体评分
    const overall = (completeness + consistency + accuracy + timeliness) / 4;

    return {
      completeness: Math.round(completeness),
      consistency: Math.round(consistency),
      accuracy: Math.round(accuracy),
      timeliness: Math.round(timeliness),
      overall: Math.round(overall)
    };
  }

  /**
   * 检查价格范围合理性
   */
  public validatePriceRange(
    price: number, 
    assetType: 'gold' | 'nasdaq'
  ): { isValid: boolean; message?: string } {
    // 检查价格是否为有效数字
    if (typeof price !== 'number' || isNaN(price) || !isFinite(price)) {
      return {
        isValid: false,
        message: `价格 ${price} 不是有效数字`
      };
    }

    const range = this.priceRanges[assetType];
    
    if (price < range.min) {
      return {
        isValid: false,
        message: `价格 ${price} 低于合理范围最小值 ${range.min}`
      };
    }
    
    if (price > range.max) {
      return {
        isValid: false,
        message: `价格 ${price} 超过合理范围最大值 ${range.max}`
      };
    }
    
    return { isValid: true };
  }

  /**
   * 检测异常波动
   */
  public detectAbnormalVolatility(
    currentPrice: number,
    previousPrice: number,
    threshold: number = 5
  ): { isAbnormal: boolean; changePercent: number; severity: string } {
    // 检查输入是否为有效数字
    if (typeof currentPrice !== 'number' || isNaN(currentPrice) || !isFinite(currentPrice) ||
        typeof previousPrice !== 'number' || isNaN(previousPrice) || !isFinite(previousPrice) ||
        previousPrice === 0) {
      return {
        isAbnormal: false,
        changePercent: NaN,
        severity: 'normal'
      };
    }

    const changePercent = Math.abs((currentPrice - previousPrice) / previousPrice * 100);
    
    let severity = 'normal';
    if (changePercent > threshold * 2) {
      severity = 'high';
    } else if (changePercent > threshold) {
      severity = 'medium';
    }
    
    return {
      isAbnormal: changePercent > threshold,
      changePercent,
      severity
    };
  }
}

// 导出单例实例
export const dataValidationService = new DataValidationService();
