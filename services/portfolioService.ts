/**
 * 投资组合服务模块
 * 负责管理用户的投资组合和持仓信息
 */

import { AssetType } from '../types';

/**
 * 持仓接口
 */
export interface Position {
  id: string;
  assetType: AssetType;
  assetName: string; // "现货黄金" | "纳斯达克100"
  quantity: number;
  buyPrice: number;
  buyDate: Date;
  currentPrice?: number;
  currentValue?: number;
  profitLoss?: number;
  profitLossPercent?: number;
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
        buyDate: new Date(pos.buyDate)
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
        buyDate: pos.buyDate.toISOString()
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
    prices: Map<AssetType, number>
  ): Portfolio {
    let totalInvestment = 0;
    let currentValue = 0;

    // 计算每个持仓的当前价值和盈亏
    const updatedPositions = positions.map(position => {
      const investment = position.quantity * position.buyPrice;
      totalInvestment += investment;

      const currentPrice = prices.get(position.assetType);
      if (currentPrice !== undefined) {
        const positionValue = position.quantity * currentPrice;
        const profitLoss = positionValue - investment;
        const profitLossPercent = (profitLoss / investment) * 100;

        currentValue += positionValue;

        return {
          ...position,
          currentPrice,
          currentValue: positionValue,
          profitLoss,
          profitLossPercent
        };
      }

      // 如果没有当前价格，使用买入价格
      currentValue += investment;
      return {
        ...position,
        currentPrice: position.buyPrice,
        currentValue: investment,
        profitLoss: 0,
        profitLossPercent: 0
      };
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
        buyDate: new Date(pos.buyDate)
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
}

/**
 * 导出单例实例
 */
export const portfolioService = PortfolioService.getInstance();
