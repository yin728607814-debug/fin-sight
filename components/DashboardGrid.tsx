/**
 * 仪表盘网格布局组件
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import GridLayout, {
  Layout as GridLayoutLayout,
  LayoutItem as GridLayoutItem
} from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { LayoutItem, CardType } from '../services/dashboardService';
import { NewsListCard } from './dashboard/NewsListCard';
import { PriceChartCard } from './dashboard/PriceChartCard';
import { SentimentCard } from './dashboard/SentimentCard';
import { PortfolioCard } from './dashboard/PortfolioCard';
import { AIChatCard } from './dashboard/AIChatCard';
import { MarketOverviewCard } from './dashboard/MarketOverviewCard';
import { debounce } from '../utils/performance';

interface DashboardGridProps {
  layoutId: string;
  items: LayoutItem[];
  isEditMode: boolean;
  onLayoutChange?: (items: LayoutItem[]) => void;
  onRemoveCard?: (cardId: string) => void;
}

/**
 * 仪表盘网格布局
 */
export const DashboardGrid: React.FC<DashboardGridProps> = ({
  items,
  isEditMode,
  onLayoutChange,
  onRemoveCard,
}) => {
  const [layout, setLayout] = useState<GridLayoutItem[]>([]);

  useEffect(() => {
    setLayout(items);
  }, [items]);

  /**
   * 防抖的布局变化处理
   */
  const debouncedLayoutChange = useMemo(
    () =>
      debounce((layoutItems: LayoutItem[]) => {
        onLayoutChange?.(layoutItems);
      }, 500),
    [onLayoutChange]
  );

  /**
   * 布局变化处理
   */
  const handleLayoutChange = useCallback(
    (newLayout: GridLayoutLayout) => {
      if (!isEditMode) return;

      setLayout([...newLayout]);

      // 转换为 LayoutItem 格式
      const layoutItems: LayoutItem[] = newLayout.map((item) => ({
        i: item.i,
        x: item.x,
        y: item.y,
        w: item.w,
        h: item.h,
        minW: item.minW,
        minH: item.minH,
        maxW: item.maxW,
        maxH: item.maxH,
      }));

      debouncedLayoutChange(layoutItems);
    },
    [isEditMode, debouncedLayoutChange]
  );

  /**
   * 渲染卡片
   */
  const renderCard = useCallback(
    (cardId: string) => {
      const handleRemove = () => onRemoveCard?.(cardId);

      switch (cardId as CardType) {
        case 'news-list':
          return <NewsListCard onRemove={isEditMode ? handleRemove : undefined} />;
        case 'price-chart':
          return <PriceChartCard onRemove={isEditMode ? handleRemove : undefined} />;
        case 'sentiment':
          return <SentimentCard onRemove={isEditMode ? handleRemove : undefined} />;
        case 'portfolio':
          return <PortfolioCard onRemove={isEditMode ? handleRemove : undefined} />;
        case 'ai-chat':
          return <AIChatCard onRemove={isEditMode ? handleRemove : undefined} />;
        case 'market-overview':
          return <MarketOverviewCard onRemove={isEditMode ? handleRemove : undefined} />;
        default:
          return (
            <div className="h-full flex items-center justify-center bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-xl">
              <p className="text-sm text-gray-500 dark:text-gray-400">未知卡片类型</p>
            </div>
          );
      }
    },
    [isEditMode, onRemoveCard]
  );

  return (
    <GridLayout
      className="layout"
      layout={layout}
      width={1200}
      gridConfig={{
        cols: 4,
        rowHeight: 150
      }}
      dragConfig={{
        enabled: isEditMode,
        handle: '.drag-handle'
      }}
      resizeConfig={{
        enabled: isEditMode
      }}
      onLayoutChange={handleLayoutChange}
    >
      {layout.map((item) => (
        <div key={item.i} className={isEditMode ? 'drag-handle cursor-move' : ''}>
          {renderCard(item.i)}
        </div>
      ))}
    </GridLayout>
  );
};
