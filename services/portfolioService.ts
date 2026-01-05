/**
 * 投资组合服务模块
 * 负责管理用户的投资组合和持仓信息
 */

import { AssetType, AutoInvestPlan, GoldStats, AssetStats, PositionStatistics } from '../types';

/**
 * 持仓接口
 */
export interface Position {
  id: string;
  assetType: AssetType;
  assetName: string;
  
  // 纳斯达克基金信息
  fundName?: string;           // 用户自定义基金名称
  
  // 黄金信息
  quantity?: number;           // 黄金克数（仅黄金）
  averageBuyPrice?: number;    // 黄金均价（仅黄金，人民币/克）
  
  // 通用信息
  investmentAmount: number;    // 持仓金额（元）
  profitLoss: number;          // 持仓收益（元）
  
  // 计算字段
  currentPrice?: number;       // 当前价格
  currentValue?: number;       // 当前市值
  profitLossPercent?: number;  // 收益率
  dailyProfitLoss?: number;    // 当日收益（元）
  dailyChange?: number;        // 当日涨跌幅（%）
  
  // 定投计划（仅纳斯达克）
  autoInvest?: AutoInvestPlan;
  
  // 元数据
  createdAt: Date;             // 创建时间
  updatedAt: Date;             // 更新时间
}

/**
 * 投资组合接口
 */
export interface Portfolio {
  positions: Position[];
  totalInvestment: number;
  currentValue: number;
  totalProfitLoss: number;
  totalProfitLossPercent: number;
  lastUpdated: Date;
}

/**
 * 组合历史接口
 */
export interface PortfolioHistory {
  date: string;
  value: number;
  profitLoss: number;
}

/**
 * 投资组合服务类
 */
export class PortfolioService {
  private static instance: PortfolioService;
  private readonly STORAGE_KEY = 'portfolio_positions';
  private readonly HISTORY_KEY = 'portfolio_history';
  private readonly MAX_HISTORY_DAYS = 30;

  /**
   * 获取单例实例
   */
  public static getInstance(): PortfolioService {
    if (!PortfolioService.instance) {
      PortfolioService.instance = new PortfolioService();
    }
    return PortfolioService.instance;
  }

  /**
   * 私有构造函数
   */
  private constructor() {}

  /**
   * 获取所有持仓
   */
  public getPositions(): Position[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        return [];
      }

      const parsed = JSON.parse(stored);
      return parsed.map((pos: any) => ({
        ...pos,
        createdAt: pos.createdAt ? new Date(pos.createdAt) : new Date(),
        updatedAt: pos.updatedAt ? new Date(pos.updatedAt) : new Date()
      }));
    } catch (error) {
      console.error('获取持仓失败:', error);
      return [];
    }
  }

  /**
   * 保存持仓列表
   */
  private savePositions(positions: Position[]): void {
    try {
      const toSave = positions.map(pos => ({
        ...pos,
        createdAt: pos.createdAt.toISOString(),
        updatedAt: pos.updatedAt.toISOString()
      }));
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(toSave));
    } catch (error) {
      console.error('保存持仓失败:', error);
      
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.warn('存储空间不足');
        throw new Error('存储空间不足，请删除一些持仓');
      }
    }
  }

  /**
   * 添加持仓
   */
  public addPosition(position: Omit<Position, 'id'>): Position {
    const positions = this.getPositions();
    
    const newPosition: Position = {
      ...position,
      id: this.generatePositionId()
    };

    positions.push(newPosition);
    this.savePositions(positions);
    
    return newPosition;
  }

  /**
   * 更新持仓
   */
  public updatePosition(id: string, updates: Partial<Position>): Position | null {
    const positions = this.getPositions();
    const index = positions.findIndex(p => p.id === id);
    
    if (index === -1) {
      return null;
    }

    positions[index] = {
      ...positions[index],
      ...updates,
      id // 确保ID不被修改
    };

    this.savePositions(positions);
    return positions[index];
  }

  /**
   * 删除持仓
   */
  public deletePosition(id: string): boolean {
    const positions = this.getPositions();
    const filteredPositions = positions.filter(p => p.id !== id);
    
    if (filteredPositions.length === positions.length) {
      return false; // 没有找到要删除的持仓
    }

    this.savePositions(filteredPositions);
    return true;
  }

  /**
   * 计算投资组合
   */
  public calculatePortfolio(
    positions: Position[],
    prices: Map<AssetType, number>,
    previousPrices?: Map<AssetType, number>
  ): Portfolio {
    let totalInvestment = 0;
    let currentValue = 0;

    // 计算每个持仓的当前价值和盈亏
    const updatedPositions = positions.map(position => {
      const investment = position.investmentAmount;
      totalInvestment += investment;

      const currentPrice = prices.get(position.assetType);
      const previousPrice = previousPrices?.get(position.assetType);

      if (position.assetType === 'nasdaq') {
        // 纳斯达克：持仓金额 + 持仓收益 = 当前市值
        const positionValue = investment + position.profitLoss;
        const profitLossPercent = investment > 0 ? (position.profitLoss / investment) * 100 : 0;

        // 计算当日收益（基于涨跌幅）
        let dailyProfitLoss: number | undefined;
        let dailyChange: number | undefined;
        
        if (currentPrice !== undefined && previousPrice !== undefined && previousPrice > 0) {
          dailyChange = ((currentPrice - previousPrice) / previousPrice) * 100;
          // 当日收益 = 持仓金额 × 当日涨跌幅
          dailyProfitLoss = investment * (dailyChange / 100);
        }

        currentValue += positionValue;

        return {
          ...position,
          currentPrice,
          currentValue: positionValue,
          profitLossPercent,
          dailyProfitLoss,
          dailyChange
        };
      } else {
        // 黄金：根据均价和当前价格计算收益
        if (currentPrice !== undefined && position.quantity && position.averageBuyPrice) {
          // 招商银行买卖价差：卖出价格比买入价格低3元/克
          const BANK_SPREAD = 3; // 元/克
          const effectivePrice = currentPrice - BANK_SPREAD;
          
          // 当前市值 = 克数 × 有效价格（扣除买卖价差后）
          const positionValue = position.quantity * effectivePrice;
          // 持仓收益 = 当前市值 - 持仓金额
          const profitLoss = positionValue - investment;
          const profitLossPercent = investment > 0 ? (profitLoss / investment) * 100 : 0;

          currentValue += positionValue;

          return {
            ...position,
            currentPrice,
            currentValue: positionValue,
            profitLoss,
            profitLossPercent
          };
        }

        // 如果没有当前价格，使用用户输入的持仓收益
        const positionValue = investment + (position.profitLoss || 0);
        currentValue += positionValue;
        return {
          ...position,
          currentValue: positionValue,
          profitLoss: position.profitLoss || 0,
          profitLossPercent: investment > 0 ? ((position.profitLoss || 0) / investment) * 100 : 0
        };
      }
    });

    const totalProfitLoss = currentValue - totalInvestment;
    const totalProfitLossPercent = totalInvestment > 0 
      ? (totalProfitLoss / totalInvestment) * 100 
      : 0;

    return {
      positions: updatedPositions,
      totalInvestment,
      currentValue,
      totalProfitLoss,
      totalProfitLossPercent,
      lastUpdated: new Date()
    };
  }

  /**
   * 获取投资组合历史
   */
  public getPortfolioHistory(days: number = 30): PortfolioHistory[] {
    try {
      const stored = localStorage.getItem(this.HISTORY_KEY);
      if (!stored) {
        return [];
      }

      const history: PortfolioHistory[] = JSON.parse(stored);
      
      // 只返回指定天数的历史
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      return history.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate >= cutoffDate;
      });
    } catch (error) {
      console.error('获取投资组合历史失败:', error);
      return [];
    }
  }

  /**
   * 保存投资组合快照到历史
   */
  public savePortfolioSnapshot(portfolio: Portfolio): void {
    try {
      const history = this.getPortfolioHistory(this.MAX_HISTORY_DAYS);
      
      const today = new Date().toISOString().split('T')[0];
      
      // 检查今天是否已有记录
      const existingIndex = history.findIndex(item => item.date === today);
      
      const snapshot: PortfolioHistory = {
        date: today,
        value: portfolio.currentValue,
        profitLoss: portfolio.totalProfitLoss
      };

      if (existingIndex >= 0) {
        // 更新今天的记录
        history[existingIndex] = snapshot;
      } else {
        // 添加新记录
        history.push(snapshot);
      }

      // 只保留最近30天
      const sortedHistory = history
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-this.MAX_HISTORY_DAYS);

      localStorage.setItem(this.HISTORY_KEY, JSON.stringify(sortedHistory));
    } catch (error) {
      console.error('保存投资组合快照失败:', error);
    }
  }

  /**
   * 导出投资组合为JSON
   */
  public exportPortfolio(): string {
    const positions = this.getPositions();
    const history = this.getPortfolioHistory();

    const exportData = {
      positions,
      history,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * 导入投资组合
   */
  public importPortfolio(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      
      if (!data.positions || !Array.isArray(data.positions)) {
        throw new Error('无效的投资组合数据');
      }

      // 验证并转换数据
      const positions: Position[] = data.positions.map((pos: any) => ({
        ...pos,
        createdAt: pos.createdAt ? new Date(pos.createdAt) : new Date(),
        updatedAt: pos.updatedAt ? new Date(pos.updatedAt) : new Date()
      }));

      this.savePositions(positions);
      
      // 如果有历史数据，也导入
      if (data.history && Array.isArray(data.history)) {
        localStorage.setItem(this.HISTORY_KEY, JSON.stringify(data.history));
      }

      return true;
    } catch (error) {
      console.error('导入投资组合失败:', error);
      return false;
    }
  }

  /**
   * 清空所有持仓
   */
  public clearAllPositions(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.HISTORY_KEY);
  }

  /**
   * 生成持仓ID
   */
  private generatePositionId(): string {
    return `pos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 获取资产分布
   */
  public getAssetAllocation(portfolio: Portfolio): Array<{
    assetType: AssetType;
    assetName: string;
    value: number;
    percentage: number;
  }> {
    const allocation = new Map<AssetType, { name: string; value: number }>();

    portfolio.positions.forEach(position => {
      const existing = allocation.get(position.assetType);
      const value = position.currentValue || 0;

      if (existing) {
        existing.value += value;
      } else {
        allocation.set(position.assetType, {
          name: position.assetName,
          value
        });
      }
    });

    const total = portfolio.currentValue;
    
    return Array.from(allocation.entries()).map(([assetType, data]) => ({
      assetType,
      assetName: data.name,
      value: data.value,
      percentage: total > 0 ? (data.value / total) * 100 : 0
    }));
  }

  /**
   * 获取统计信息
   */
  public getStatistics(portfolio: Portfolio): {
    totalPositions: number;
    profitablePositions: number;
    losingPositions: number;
    biggestGainer: Position | null;
    biggestLoser: Position | null;
  } {
    const positions = portfolio.positions;
    
    const profitablePositions = positions.filter(p => (p.profitLoss || 0) > 0);
    const losingPositions = positions.filter(p => (p.profitLoss || 0) < 0);

    let biggestGainer: Position | null = null;
    let biggestLoser: Position | null = null;

    positions.forEach(position => {
      const profitLossPercent = position.profitLossPercent || 0;
      
      if (!biggestGainer || profitLossPercent > (biggestGainer.profitLossPercent || 0)) {
        biggestGainer = position;
      }
      
      if (!biggestLoser || profitLossPercent < (biggestLoser.profitLossPercent || 0)) {
        biggestLoser = position;
      }
    });

    return {
      totalPositions: positions.length,
      profitablePositions: profitablePositions.length,
      losingPositions: losingPositions.length,
      biggestGainer,
      biggestLoser
    };
  }

  /**
   * 计算持有天数
   */
  public calculateHoldingDays(buyDate: Date): number {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - buyDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  /**
   * 计算年化收益率
   */
  public calculateAnnualizedReturn(profitLossPercent: number, holdingDays: number): number {
    if (holdingDays < 30) return 0; // 少于30天不计算年化
    const years = holdingDays / 365;
    return (Math.pow(1 + profitLossPercent / 100, 1 / years) - 1) * 100;
  }

  /**
   * 计算黄金均价
   */
  public calculateGoldAveragePrice(positions: Position[]): number {
    const goldPositions = positions.filter(p => p.assetType === 'gold');
    
    if (goldPositions.length === 0) return 0;
    
    let totalCost = 0;
    let totalQuantity = 0;
    
    goldPositions.forEach(position => {
      if (position.quantity && position.averageBuyPrice) {
        totalCost += position.quantity * position.averageBuyPrice;
        totalQuantity += position.quantity;
      }
    });
    
    return totalQuantity > 0 ? totalCost / totalQuantity : 0;
  }

  /**
   * 获取黄金统计信息
   */
  public getGoldStats(portfolio: Portfolio): GoldStats {
    const goldPositions = portfolio.positions.filter(p => p.assetType === 'gold');
    
    let investment = 0;
    let currentValue = 0;
    let totalGrams = 0;
    
    goldPositions.forEach(position => {
      investment += position.investmentAmount || 0;
      currentValue += position.currentValue || 0;
      totalGrams += position.quantity || 0;
    });
    
    const averagePrice = this.calculateGoldAveragePrice(portfolio.positions);
    const currentPrice = goldPositions.length > 0 && goldPositions[0].currentPrice 
      ? goldPositions[0].currentPrice 
      : 0;
    
    return {
      count: goldPositions.length,
      investment,
      currentValue,
      profitLoss: currentValue - investment,
      totalGrams,
      averagePrice,
      currentPrice
    };
  }

  /**
   * 获取纳斯达克统计信息
   */
  public getNasdaqStats(portfolio: Portfolio): AssetStats {
    const nasdaqPositions = portfolio.positions.filter(p => p.assetType === 'nasdaq');
    
    let investment = 0;
    let currentValue = 0;
    
    nasdaqPositions.forEach(position => {
      investment += position.investmentAmount || 0;
      currentValue += position.currentValue || 0;
    });
    
    return {
      count: nasdaqPositions.length,
      investment,
      currentValue,
      profitLoss: currentValue - investment
    };
  }

  /**
   * 获取完整的持仓统计
   */
  public getPositionStatistics(portfolio: Portfolio): PositionStatistics {
    const goldStats = this.getGoldStats(portfolio);
    const nasdaqStats = this.getNasdaqStats(portfolio);
    
    // 统计定投计划
    const autoInvestPositions = portfolio.positions.filter(p => p.autoInvest?.enabled);
    const autoInvestCount = autoInvestPositions.length;
    
    // 找到最近的下次扣款日期
    let nextAutoInvestDate: Date | undefined;
    autoInvestPositions.forEach(position => {
      if (position.autoInvest?.nextDate) {
        const nextDate = position.autoInvest.nextDate;
        if (!nextAutoInvestDate || nextDate < nextAutoInvestDate) {
          nextAutoInvestDate = nextDate;
        }
      }
    });
    
    return {
      totalPositions: portfolio.positions.length,
      totalInvestment: portfolio.totalInvestment,
      currentValue: portfolio.currentValue,
      totalProfitLoss: portfolio.totalProfitLoss,
      totalProfitLossPercent: portfolio.totalProfitLossPercent,
      nasdaqStats,
      goldStats,
      autoInvestCount,
      nextAutoInvestDate
    };
  }

  /**
   * 计算下次定投日期
   */
  public calculateNextAutoInvestDate(
    lastDate: Date,
    frequency: 'weekly' | 'monthly' | 'quarterly'
  ): Date {
    const next = new Date(lastDate);
    
    switch (frequency) {
      case 'weekly':
        next.setDate(next.getDate() + 7);
        break;
      case 'monthly':
        next.setMonth(next.getMonth() + 1);
        break;
      case 'quarterly':
        next.setMonth(next.getMonth() + 3);
        break;
    }
    
    return next;
  }

  /**
   * 更新定投计划的下次扣款日期
   */
  public updateAutoInvestDates(): void {
    const positions = this.getPositions();
    let updated = false;
    
    const now = new Date();
    
    positions.forEach(position => {
      if (position.autoInvest?.enabled && position.autoInvest.nextDate) {
        // 如果下次扣款日期已过，更新到下一个周期
        if (position.autoInvest.nextDate <= now) {
          position.autoInvest.lastExecutedDate = position.autoInvest.nextDate;
          position.autoInvest.nextDate = this.calculateNextAutoInvestDate(
            position.autoInvest.nextDate,
            position.autoInvest.frequency
          );
          updated = true;
        }
      }
    });
    
    if (updated) {
      this.savePositions(positions);
    }
  }
}

/**
 * 导出单例实例
 */
export const portfolioService = PortfolioService.getInstance();
