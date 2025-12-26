/**
 * 卡片选择器组件
 */

import React from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { dashboardService, CardConfig } from '../services/dashboardService';

interface CardSelectorProps {
  currentCards: string[];
  onAddCard: (cardId: string) => void;
}

/**
 * 卡片选择器
 */
export const CardSelector: React.FC<CardSelectorProps> = ({
  currentCards,
  onAddCard,
}) => {
  const availableCards = dashboardService.getAvailableCards();
  const addableCards = availableCards.filter(card => !currentCards.includes(card.id));

  if (addableCards.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          所有卡片都已添加
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {addableCards.map(card => (
        <div
          key={card.id}
          className="p-4 bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-xl border border-white/20 dark:border-gray-700/20 hover:border-blue-500/50 dark:hover:border-blue-400/50 transition-all"
        >
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {card.title}
            </h3>
            <button
              onClick={() => onAddCard(card.id)}
              className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
              title="添加卡片"
            >
              <PlusIcon className="h-5 w-5" />
            </button>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {card.description}
          </p>
        </div>
      ))}
    </div>
  );
};
