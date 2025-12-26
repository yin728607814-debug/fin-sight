/**
 * AI助手卡片
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { DashboardCard } from '../DashboardCard';

interface AIChatCardProps {
  onRemove?: () => void;
}

export const AIChatCard: React.FC<AIChatCardProps> = ({ onRemove }) => {
  const quickQuestions = [
    '现在适合投资吗？',
    '纳斯达克走势如何？',
    '黄金价格趋势？',
  ];

  return (
    <DashboardCard title="AI投资顾问" onRemove={onRemove}>
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          快速提问，获取AI投资建议
        </p>

        <div className="space-y-2">
          {quickQuestions.map((question, index) => (
            <Link
              key={index}
              to={`/ai-chat?q=${encodeURIComponent(question)}`}
              className="block p-3 bg-white/50 dark:bg-gray-700/50 rounded-lg hover:bg-white/70 dark:hover:bg-gray-700/70 transition-colors text-sm text-gray-700 dark:text-gray-300"
            >
              {question}
            </Link>
          ))}
        </div>

        <Link
          to="/ai-chat"
          className="block text-center px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors"
        >
          打开AI助手
        </Link>
      </div>
    </DashboardCard>
  );
};
