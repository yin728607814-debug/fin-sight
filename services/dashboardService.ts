/**
 * 仪表盘服务
 * 管理仪表盘布局和卡片配置
 */

import { logInfo, logError } from './logger';
import { safeLocalStorage } from '../utils/performance';

/**
 * 卡片类型
 */
export type CardType = 
  | 'news-list'
  | 'price-chart'
  | 'sentiment'
  | 'portfolio'
  | 'ai-chat'
  | 'market-overview';

/**
 * 卡片配置
 */
export interface CardConfig {
  id: string;
  type: CardType;
  title: string;
  description: string;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
}

/**
 * 布局项
 */
export interface LayoutItem {
  i: string; // 卡片ID
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
}

/**
 * 仪表盘布局
 */
export interface DashboardLayout {
  id: string;
  name: string;
  items: LayoutItem[];
  createdAt: string;
  updatedAt: string;
}

/**
 * 可用卡片配置
 */
export const AVAILABLE_CARDS: CardConfig[] = [
  {
    id: 'news-list',
    type: 'news-list',
    title: '最新新闻',
    description: '显示纳斯达克和黄金的最新新闻',
    minW: 2,
    minH: 2,
  },
  {
    id: 'price-chart',
    type: 'price-chart',
    title: '价格走势',
    description: '显示纳斯达克和黄金的价格图表',
    minW: 2,
    minH: 2,
  },
  {
    id: 'sentiment',
    type: 'sentiment',
    title: '情绪指数',
    description: '显示市场情绪指数和趋势',
    minW: 2,
    minH: 2,
  },
  {
    id: 'portfolio',
    type: 'portfolio',
    title: '投资组合',
    description: '显示投资组合总览和收益',
    minW: 2,
    minH: 2,
  },
  {
    id: 'ai-chat',
    type: 'ai-chat',
    title: 'AI助手',
    description: '快速访问AI投资顾问',
    minW: 2,
    minH: 2,
  },
  {
    id: 'market-overview',
    type: 'market-overview',
    title: '市场概览',
    description: '显示市场整体情况',
    minW: 2,
    minH: 1,
  },
];

/**
 * 默认布局
 */
export const DEFAULT_LAYOUT: LayoutItem[] = [
  { i: 'market-overview', x: 0, y: 0, w: 4, h: 1, minW: 2, minH: 1 },
  { i: 'price-chart', x: 0, y: 1, w: 2, h: 2, minW: 2, minH: 2 },
  { i: 'sentiment', x: 2, y: 1, w: 2, h: 2, minW: 2, minH: 2 },
  { i: 'news-list', x: 0, y: 3, w: 2, h: 2, minW: 2, minH: 2 },
  { i: 'portfolio', x: 2, y: 3, w: 2, h: 2, minW: 2, minH: 2 },
];

/**
 * 仪表盘服务类
 */
class DashboardService {
  private readonly STORAGE_KEY = 'dashboard_layouts';
  private readonly CURRENT_LAYOUT_KEY = 'dashboard_current_layout';
  private readonly MAX_LAYOUTS = 5;

  /**
   * 获取所有布局
   */
  getLayouts(): DashboardLayout[] {
    try {
      const data = safeLocalStorage.getItem(this.STORAGE_KEY);
      if (!data) return [];

      const layouts = JSON.parse(data);
      logInfo('Loaded dashboard layouts', { count: layouts.length });
      return layouts;
    } catch (error) {
      logError('Failed to load dashboard layouts', error);
      return [];
    }
  }

  /**
   * 获取当前布局
   */
  getCurrentLayout(): DashboardLayout {
    try {
      const currentId = safeLocalStorage.getItem(this.CURRENT_LAYOUT_KEY);
      const layouts = this.getLayouts();

      if (currentId) {
        const layout = layouts.find((l) => l.id === currentId);
        if (layout) {
          logInfo('Loaded current dashboard layout', { id: currentId });
          return layout;
        }
      }

      // 返回默认布局
      return this.getDefaultLayout();
    } catch (error) {
      logError('Failed to load current dashboard layout', error);
      return this.getDefaultLayout();
    }
  }

  /**
   * 获取默认布局
   */
  getDefaultLayout(): DashboardLayout {
    return {
      id: 'default',
      name: '默认布局',
      items: DEFAULT_LAYOUT,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * 保存布局
   */
  saveLayout(layout: DashboardLayout): void {
    try {
      const layouts = this.getLayouts();
      const existingIndex = layouts.findIndex((l) => l.id === layout.id);

      const updatedLayout = {
        ...layout,
        updatedAt: new Date().toISOString(),
      };

      if (existingIndex >= 0) {
        layouts[existingIndex] = updatedLayout;
      } else {
        layouts.push(updatedLayout);

        // 限制布局数量
        if (layouts.length > this.MAX_LAYOUTS) {
          layouts.shift();
        }
      }

      safeLocalStorage.setItem(this.STORAGE_KEY, JSON.stringify(layouts));
      logInfo('Saved dashboard layout', { id: layout.id });
    } catch (error) {
      logError('Failed to save dashboard layout', error);
    }
  }

  /**
   * 设置当前布局
   */
  setCurrentLayout(layoutId: string): void {
    try {
      safeLocalStorage.setItem(this.CURRENT_LAYOUT_KEY, layoutId);
      logInfo('Set current dashboard layout', { id: layoutId });
    } catch (error) {
      logError('Failed to set current dashboard layout', error);
    }
  }

  /**
   * 删除布局
   */
  deleteLayout(layoutId: string): void {
    try {
      const layouts = this.getLayouts();
      const filtered = layouts.filter((l) => l.id !== layoutId);

      safeLocalStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));

      // 如果删除的是当前布局，切换到默认布局
      const currentId = safeLocalStorage.getItem(this.CURRENT_LAYOUT_KEY);
      if (currentId === layoutId) {
        safeLocalStorage.removeItem(this.CURRENT_LAYOUT_KEY);
      }

      logInfo('Deleted dashboard layout', { id: layoutId });
    } catch (error) {
      logError('Failed to delete dashboard layout', error);
    }
  }

  /**
   * 更新布局项
   */
  updateLayoutItems(layoutId: string, items: LayoutItem[]): void {
    try {
      const layouts = this.getLayouts();
      const layout = layouts.find(l => l.id === layoutId);
      
      if (layout) {
        layout.items = items;
        layout.updatedAt = new Date().toISOString();
        this.saveLayout(layout);
      }
    } catch (error) {
      logError('Failed to update layout items', error);
    }
  }

  /**
   * 创建新布局
   */
  createLayout(name: string, items: LayoutItem[] = DEFAULT_LAYOUT): DashboardLayout {
    const layout: DashboardLayout = {
      id: `layout_${Date.now()}`,
      name,
      items,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    this.saveLayout(layout);
    return layout;
  }

  /**
   * 重置为默认布局
   */
  resetToDefault(): DashboardLayout {
    const defaultLayout = this.getDefaultLayout();
    this.saveLayout(defaultLayout);
    this.setCurrentLayout(defaultLayout.id);
    return defaultLayout;
  }

  /**
   * 获取可用卡片
   */
  getAvailableCards(): CardConfig[] {
    return AVAILABLE_CARDS;
  }

  /**
   * 添加卡片到布局
   */
  addCardToLayout(layoutId: string, cardId: string): void {
    try {
      const layouts = this.getLayouts();
      const layout = layouts.find(l => l.id === layoutId);
      
      if (!layout) return;
      
      // 检查卡片是否已存在
      if (layout.items.some(item => item.i === cardId)) {
        logInfo('Card already exists in layout', { cardId });
        return;
      }
      
      const card = AVAILABLE_CARDS.find(c => c.id === cardId);
      if (!card) return;
      
      // 找到合适的位置
      const maxY = Math.max(...layout.items.map(item => item.y + item.h), 0);
      
      const newItem: LayoutItem = {
        i: cardId,
        x: 0,
        y: maxY,
        w: card.minW || 2,
        h: card.minH || 2,
        minW: card.minW,
        minH: card.minH,
        maxW: card.maxW,
        maxH: card.maxH,
      };
      
      layout.items.push(newItem);
      this.saveLayout(layout);
      
      logInfo('Added card to layout', { cardId, layoutId });
    } catch (error) {
      logError('Failed to add card to layout', error);
    }
  }

  /**
   * 从布局中移除卡片
   */
  removeCardFromLayout(layoutId: string, cardId: string): void {
    try {
      const layouts = this.getLayouts();
      const layout = layouts.find(l => l.id === layoutId);
      
      if (!layout) return;
      
      layout.items = layout.items.filter(item => item.i !== cardId);
      this.saveLayout(layout);
      
      logInfo('Removed card from layout', { cardId, layoutId });
    } catch (error) {
      logError('Failed to remove card from layout', error);
    }
  }
}

export const dashboardService = new DashboardService();
