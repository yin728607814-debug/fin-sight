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

export const NewsListCard: React.FC<NewsListCardProps> = ({ onRemove }) => {
  const { news: nasdaqNews } = useNews('nasdaq');
  const { news: goldNews } = useNews('gold');
  
  const allNews = [...nasdaqNews, ...goldNews]
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
        year: 'numeric',
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
      <div className="space-y-3">
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
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2 mb-1">
                {item.headline}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatDate(item.datetime)}
              </p>
            </div>
          ))
        )}
        
        <Link
          to="/nasdaq"
          className="block text-center text-sm text-blue-600 dark:text-blue-400 hover:underline mt-4"
        >
          查看更多 →
        </Link>
      </div>
    </DashboardCard>
  );
};
