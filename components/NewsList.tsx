/**
 * NewsList组件 - 新闻列表展示
 * 显示新闻列表和对应的分析结果
 */

import React, { useMemo, useState } from 'react';
import { NewsListProps, NewsAnalysis, ImpactType } from '../types';
import { ImpactIndicator } from './ImpactIndicator';
import { LoadingSpinner } from './LoadingSpinner';

/**
 * 新闻列表组件
 */
export const NewsList: React.FC<NewsListProps> = ({ 
  news = [], 
  analysis = [], 
  loading = false
}) => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'time' | 'impact' | 'relevance'>('time');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const newsListRef = React.useRef<HTMLDivElement>(null);

  /**
   * 切换新闻项展开状态
   */
  const toggleExpanded = (newsId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(newsId)) {
      newExpanded.delete(newsId);
    } else {
      newExpanded.add(newsId);
    }
    setExpandedItems(newExpanded);
  };

  /**
   * 获取新闻对应的分析结果
   */
  const getAnalysisForNews = (newsId: string): NewsAnalysis | undefined => {
    if (!analysis || !Array.isArray(analysis)) {
      return undefined;
    }
    return analysis.find(a => a.newsId === newsId);
  };

  /**
   * 排序后的新闻列表
   */
  const sortedNews = useMemo(() => {
    // 确保 news 是数组
    if (!news || !Array.isArray(news)) {
      return [];
    }

    const newsWithAnalysis = news.map(newsItem => ({
      news: newsItem,
      analysis: getAnalysisForNews(newsItem.id)
    }));

    return newsWithAnalysis.sort((a, b) => {
      switch (sortBy) {
        case 'time':
          return new Date(b.news.publishedAt).getTime() - new Date(a.news.publishedAt).getTime();
        
        case 'impact': {
          const scoreA = a.analysis ? a.analysis.confidence * Math.abs(a.analysis.predictedChange) : 0;
          const scoreB = b.analysis ? b.analysis.confidence * Math.abs(b.analysis.predictedChange) : 0;
          return scoreB - scoreA;
        }
        
        case 'relevance':
          return b.news.relevanceScore - a.news.relevanceScore;
        
        default:
          return 0;
      }
    });
  }, [news, analysis, sortBy]);

  /**
   * 分页后的新闻列表
   */
  const paginatedNews = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedNews.slice(startIndex, endIndex);
  }, [sortedNews, currentPage, itemsPerPage]);

  /**
   * 总页数
   */
  const totalPages = Math.ceil(sortedNews.length / itemsPerPage);

  /**
   * 切换页码
   */
  const goToPage = (page: number) => {
    setCurrentPage(page);
    // 滚动到新闻列表的起始位置
    if (newsListRef.current) {
      newsListRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  /**
   * 格式化时间显示
   */
  const formatTime = (date: Date | string) => {
    try {
      let dateObj: Date;
      
      if (date instanceof Date) {
        dateObj = date;
      } else if (typeof date === 'string') {
        dateObj = new Date(date);
      } else {
        return '时间未知';
      }
      
      if (isNaN(dateObj.getTime())) {
        return '时间未知';
      }
      
      const now = new Date();
      const diffMs = now.getTime() - dateObj.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutes = Math.floor(diffMs / (1000 * 60));

      if (diffHours > 24) {
        return dateObj.toLocaleDateString('zh-CN');
      } else if (diffHours > 0) {
        return `${diffHours}小时前`;
      } else if (diffMinutes > 0) {
        return `${diffMinutes}分钟前`;
      } else {
        return '刚刚';
      }
    } catch (error) {
      return '时间未知';
    }
  };

  /**
   * 获取影响类型的图标
   */
  const getImpactIcon = (impact: ImpactType) => {
    switch (impact) {
      case 'positive':
        return (
          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
          </svg>
        );
      case 'negative':
        return (
          <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-slate-600">正在加载新闻...</p>
        </div>
      </div>
    );
  }

  if (!news || news.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8">
        <div className="text-center">
          <div className="text-slate-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">暂无新闻</h3>
          <p className="text-slate-500">当前没有可显示的新闻内容</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4" ref={newsListRef}>
      {/* 排序控制 */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">
            新闻列表 ({news.length})
          </h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-slate-500">排序:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'time' | 'impact' | 'relevance')}
              className="text-sm border border-slate-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="impact">影响程度</option>
              <option value="time">发布时间</option>
              <option value="relevance">相关性</option>
            </select>
          </div>
        </div>
      </div>

      {/* 新闻列表 */}
      <div className="space-y-3">
        {paginatedNews.map(({ news: newsItem, analysis: newsAnalysis }) => {
          const isExpanded = expandedItems.has(newsItem.id);
          
          return (
            <div
              key={newsItem.id}
              className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow duration-200"
            >
              {/* 新闻头部 */}
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {newsItem.source}
                      </span>
                      <span className="text-sm text-slate-500">
                        {formatTime(newsItem.publishedAt)}
                      </span>
                      <div className="flex items-center space-x-1">
                        <span className="text-xs text-slate-400">相关性:</span>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <svg
                              key={i}
                              className={`w-3 h-3 ${
                                i < Math.round(newsItem.relevanceScore * 5)
                                  ? 'text-yellow-400'
                                  : 'text-slate-300'
                              }`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <h4 className="text-lg font-medium text-slate-900 mb-2">
                      {newsItem.title}
                    </h4>
                    
                    <p className="text-slate-600 text-sm line-clamp-3 mb-3">
                      {newsItem.content}
                    </p>
                  </div>

                  {/* 影响指示器 */}
                  {newsAnalysis && (
                    <div className="ml-4 flex-shrink-0">
                      <ImpactIndicator
                        impact={newsAnalysis.impact}
                        confidence={newsAnalysis.confidence}
                        summary={newsAnalysis.summary}
                      />
                    </div>
                  )}
                </div>

                {/* 操作按钮 */}
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => toggleExpanded(newsItem.id)}
                      className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {isExpanded ? (
                        <>
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                          收起详情
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                          查看详情
                        </>
                      )}
                    </button>
                    
                    <a
                      href={newsItem.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      原文链接
                    </a>
                  </div>

                  {newsAnalysis && typeof newsAnalysis.predictedChange === 'number' && (
                    <div className="flex items-center space-x-2">
                      {getImpactIcon(newsAnalysis.impact)}
                      <span className="text-sm font-medium">
                        预测变化: {newsAnalysis.predictedChange >= 0 ? '+' : ''}{newsAnalysis.predictedChange.toFixed(2)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* 展开的详细内容 */}
              {isExpanded && (
                <div className="border-t border-slate-200 bg-slate-50 p-4">
                  {newsAnalysis ? (
                    // 有分析结果时显示分析详情
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h5 className="font-medium text-slate-900 mb-2">分析摘要</h5>
                        <p className="text-sm text-slate-600 mb-4">{newsAnalysis.summary}</p>
                        
                        <h5 className="font-medium text-slate-900 mb-2">关键要点</h5>
                        <ul className="text-sm text-slate-600 space-y-1">
                          {newsAnalysis.keyPoints.map((point, index) => (
                            <li key={index} className="flex items-start">
                              <span className="inline-block w-1.5 h-1.5 bg-slate-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                              {point}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h5 className="font-medium text-slate-900 mb-2">影响评估</h5>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-600">影响方向:</span>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              newsAnalysis.impact === 'positive' 
                                ? 'bg-green-100 text-green-800'
                                : newsAnalysis.impact === 'negative'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {newsAnalysis.impact === 'positive' ? '利好' : 
                               newsAnalysis.impact === 'negative' ? '利空' : '中性'}
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-600">置信度:</span>
                            <div className="flex items-center space-x-2">
                              <div className="w-20 bg-slate-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full" 
                                  style={{ width: `${newsAnalysis.confidence * 100}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium">
                                {(newsAnalysis.confidence * 100).toFixed(0)}%
                              </span>
                            </div>
                          </div>
                          
                          {typeof newsAnalysis.predictedChange === 'number' && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-slate-600">预测变化:</span>
                              <span className={`text-sm font-medium ${
                                newsAnalysis.predictedChange >= 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {newsAnalysis.predictedChange >= 0 ? '+' : ''}{newsAnalysis.predictedChange.toFixed(2)}%
                              </span>
                            </div>
                          )}
                          
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-600">时间框架:</span>
                            <span className="text-sm text-slate-900">
                              {newsAnalysis.timeframe === 'short' ? '短期' :
                               newsAnalysis.timeframe === 'medium' ? '中期' : '长期'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // 没有分析结果时显示新闻完整内容
                    <div>
                      <h5 className="font-medium text-slate-900 mb-3">新闻详情</h5>
                      <div className="prose prose-sm max-w-none">
                        <p className="text-slate-700 whitespace-pre-wrap">{newsItem.content}</p>
                      </div>
                      <div className="mt-4 pt-4 border-t border-slate-300">
                        <div className="flex items-center justify-between text-sm text-slate-500">
                          <div>
                            <span className="font-medium">来源:</span> {newsItem.source}
                          </div>
                          <div>
                            <span className="font-medium">发布时间:</span> {newsItem.publishedAt.toLocaleString('zh-CN')}
                          </div>
                        </div>
                        {newsItem.url && (
                          <div className="mt-3">
                            <a
                              href={newsItem.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
                            >
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                              阅读原文
                            </a>
                          </div>
                        )}
                      </div>
                      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                        <p className="text-sm text-yellow-800">
                          <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          该新闻尚未进行 AI 分析，点击"重新分析&quot;按钮获取影响评估
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 分页控件 */}
      {totalPages > 1 && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-600">
              显示 {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, sortedNews.length)} 条，共 {sortedNews.length} 条新闻
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                上一页
              </button>
              
              <div className="flex items-center space-x-1">
                {[...Array(totalPages)].map((_, index) => {
                  const page = index + 1;
                  // 只显示当前页附近的页码
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 2 && page <= currentPage + 2)
                  ) {
                    return (
                      <button
                        key={page}
                        onClick={() => goToPage(page)}
                        className={`px-3 py-1 text-sm rounded-md ${
                          currentPage === page
                            ? 'bg-blue-600 text-white'
                            : 'border border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  } else if (
                    page === currentPage - 3 ||
                    page === currentPage + 3
                  ) {
                    return <span key={page} className="px-2 text-slate-400">...</span>;
                  }
                  return null;
                })}
              </div>
              
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                下一页
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
