/**
 * 新闻列表卡片
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useNews } from '../../utils/context';
import { DashboardCard } from '../DashboardCard';

interface NewsListCardProps {
  onRemove?: () => void;
}

type TabType = 'nasdaq' | 'gold';

export const NewsListCard: React.FC<NewsListCardProps> = ({ onRemove }) => {
  const [activeTab, setActiveTab] = useState<TabType>('nasdaq');
  const { news: nasdaqNews } = useNews('nasdaq');
  const { news: goldNews } = useNews('gold');
  
  // 根据当前 tab 选择新闻
  const currentNews = activeTab === 'nasdaq' ? nasdaqNews : goldNews;
  const displayNews = currentNews.slice(0, 5);

  /**
   * 格式化日期
   */
  const formatDate = (publishedAt: Date | string): string => {
    try {
      let date: Date;
      
      // 处理不同的输入类型
      if (publishedAt instanceof Date) {
        date = publishedAt;
      } else if (typeof publishedAt === 'string') {
        date = new Date(publishedAt);
      } else {
        console.error('🔍 NewsListCard formatDate 收到未知类型:', typeof publishedAt, publishedAt);
        return '日期未知';
      }
      
      // 检查日期是否有效
      if (isNaN(date.getTime())) {
        console.error('🔍 NewsListCard formatDate 日期无效:', publishedAt);
        return '日期未知';
      }
      
      return date.toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('🔍 NewsListCard formatDate 错误:', error, publishedAt);
      return '日期未知';
    }
  };

  return (
    <DashboardCard title="最新新闻" onRemove={onRemove}>
      <div className="space-y-3">
        {/* Tab 切换 */}
        <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <button
            onClick={() => setActiveTab('nasdaq')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === 'nasdaq'
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            纳斯达克
          </button>
          <button
            onClick={() => setActiveTab('gold')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === 'gold'
                ? 'bg-white dark:bg-gray-700 text-amber-600 dark:text-amber-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            黄金
          </button>
        </div>

        {/* 新闻列表 */}
        <div className="space-y-2">
          {displayNews.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
              暂无{activeTab === 'nasdaq' ? '纳斯达克' : '黄金'}新闻
            </p>
          ) : (
            displayNews.map((item, index) => (
              <div
                key={item.id || index}
                className="p-3 bg-white/50 dark:bg-gray-700/50 rounded-lg hover:bg-white/70 dark:hover:bg-gray-700/70 transition-colors cursor-pointer"
              >
                {/* 标题 */}
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2 mb-2">
                  {item.title}
                </h4>
                
                {/* 摘要 */}
                {item.content && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                    {item.content}
                  </p>
                )}
                
                {/* 日期 */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-500">
                    {formatDate(item.publishedAt)}
                  </span>
                  {item.source && (
                    <span className="text-xs text-gray-400 dark:text-gray-600">
                      {item.source}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        
        {/* 查看更多链接 */}
        <Link
          to={activeTab === 'nasdaq' ? '/nasdaq' : '/gold'}
          className={`block text-center text-sm hover:underline ${
            activeTab === 'nasdaq'
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-amber-600 dark:text-amber-400'
          }`}
        >
          查看更多 →
        </Link>
      </div>
    </DashboardCard>
  );
};
