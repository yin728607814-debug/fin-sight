/**
 * 基金配置服务
 * 管理用户自定义的基金列表
 */

export interface FundConfig {
  id: string;
  name: string;
  createdAt: Date;
}

class FundConfigService {
  private static instance: FundConfigService;
  private readonly STORAGE_KEY = 'user_fund_configs';

  public static getInstance(): FundConfigService {
    if (!FundConfigService.instance) {
      FundConfigService.instance = new FundConfigService();
    }
    return FundConfigService.instance;
  }

  private constructor() {}

  /**
   * 获取所有基金配置
   */
  public getFunds(): FundConfig[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        return [];
      }
      const parsed = JSON.parse(stored);
      return parsed.map((fund: FundConfig) => ({
        ...fund,
        createdAt: new Date(fund.createdAt)
      }));
    } catch (error) {
      console.error('获取基金配置失败:', error);
      return [];
    }
  }

  /**
   * 添加基金
   */
  public addFund(name: string): FundConfig {
    const funds = this.getFunds();
    
    // 检查是否已存在
    if (funds.some(f => f.name === name)) {
      throw new Error('该基金名称已存在');
    }

    const newFund: FundConfig = {
      id: Date.now().toString(),
      name: name.trim(),
      createdAt: new Date()
    };

    funds.push(newFund);
    this.saveFunds(funds);
    return newFund;
  }

  /**
   * 更新基金
   */
  public updateFund(id: string, name: string): void {
    const funds = this.getFunds();
    const index = funds.findIndex(f => f.id === id);
    
    if (index === -1) {
      throw new Error('基金不存在');
    }

    // 检查名称是否与其他基金重复
    if (funds.some(f => f.id !== id && f.name === name)) {
      throw new Error('该基金名称已存在');
    }

    funds[index].name = name.trim();
    this.saveFunds(funds);
  }

  /**
   * 删除基金
   */
  public deleteFund(id: string): void {
    const funds = this.getFunds();
    const filtered = funds.filter(f => f.id !== id);
    this.saveFunds(filtered);
  }

  /**
   * 搜索基金
   */
  public searchFunds(query: string): FundConfig[] {
    const funds = this.getFunds();
    if (!query.trim()) {
      return funds;
    }
    
    const lowerQuery = query.toLowerCase();
    return funds.filter(fund => 
      fund.name.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * 保存基金列表
   */
  private saveFunds(funds: FundConfig[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(funds));
    } catch (error) {
      console.error('保存基金配置失败:', error);
      throw new Error('保存失败');
    }
  }
}

export const fundConfigService = FundConfigService.getInstance();
