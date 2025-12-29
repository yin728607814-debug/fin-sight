/**
 * 新闻列表卡片
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { useNews } from '../../utils/context';
import { DashboardCard } from '../DashboardCard';

interface NewsListCardProps {
  onRemove?: () => void;
}

interface NewsItemWithType {
  headline: string;
  datetime: number | string | Date;
  type: 'nasdaq' | 'gold';
}

export const NewsListCard: React.FC<NewsListCardProps> = ({ onRemove }) => {
  const { news: nasdaqNews } = useNews('nasdaq');
  const { news: goldNews } = useNews('gold');
  
  // 给新闻添加类型标签
  const nasdaqNewsWithType: NewsItemWithType[] = nasdaqNews.map(item => ({
    ...item,
    type: 'nasdaq' as const
  }));
  
  const goldNewsWithType: NewsItemWithType[] = goldNews.map(item => ({
    ...item,
    type: 'gold' as const
  }));
  
  const allNews = [...nasdaqNewsWithType, ...goldNewsWithType]
    .sort((a, b) => {
      const timeA = typeof a.datetime === 'number' ? a.datetime * 1000 : new Date(a.datetime).getTime();
      const timeB = typeof b.datetime === 'number' ? b.datetime * 1000 : new Date(b.datetime).getTime();
      return timeB - timeA;
    })
    .slice(0, 5);

  /**
   * 格式化日期
   */
  const formatDate = (datetime: number | string | Date): string => {
    try {
      let date: Date;
      if (typeof datetime === 'number') {
        // Unix 时间戳（秒），转换为毫秒
        date = new Date(datetime * 1000);
      } else {
        date = new Date(datetime);
      }
      
      // 检查日期是否有效
      if (isNaN(date.getTime())) {
        return '日期未知';
      }
      
      return date.toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return '日期未知';
    }
  };

  return (
    <DashboardCard title="最新新闻" onRemove={onRemove}>
      <div className="space-y-2">
        {allNews.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
            暂无新闻
          </p>
        ) : (
          allNews.map((item, index) => (
            <div
              key={index}
              className="p-3 bg-white/50 dark:bg-gray-700/50 rounded-lg hover:bg-white/70 dark:hover:bg-gray-700/70 transition-colors"
            >
              {/* 标签和日期 */}
              <div className="flex items-center justify-between mb-2">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  item.type === 'nasdaq'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                }`}>
                  {item.type === 'nasdaq' ? '纳斯达克' : '黄金'}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDate(item.datetime)}
                </span>
              </div>
              
              {/* 标题 */}
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
                {item.headline}
              </h4>
            </div>
          ))
        )}
        
        {/* 查看更多链接 */}
        <div className="flex items-center justify-center gap-4 pt-2">
          <Link
            to="/nasdaq"
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            纳斯达克新闻 →
          </Link>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <Link
            to="/gold"
            className="text-xs text-amber-600 dark:text-amber-400 hover:underline"
          >
            黄金新闻 →
          </Link>
        </div>
      </div>
    </DashboardCard>
  );
};
