/**
 * 首页组件 - 应用入口和导航
 * 提供现货黄金和纳斯达克100的导航入口
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowTrendingUpIcon, GlobeAltIcon, ChartBarIcon, NewspaperIcon } from '@heroicons/react/24/outline';
import { ApiStatusIndicator } from '../components/ApiStatusIndicator';
import { ThemeToggle } from '../components/ThemeToggle';

/**
 * 首页组件Props
 */
interface HomePageProps {}

/**
 * 导航卡片数据
 */
interface NavigationCard {
  id: string;
  title: string;
  description: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}

const navigationCards: NavigationCard[] = [
  {
    id: 'gold',
    title: '现货黄金分析',
    description: '获取黄金市场最新新闻和价格趋势分析，把握贵金属投资机会',
    path: '/gold',
    icon: ArrowTrendingUpIcon,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50 hover:bg-yellow-100'
  },
  {
    id: 'nasdaq',
    title: '纳斯达克100分析',
    description: '追踪纳斯达克100指数相关新闻和技术分析，洞察科技股走势',
    path: '/nasdaq',
    icon: ChartBarIcon,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 hover:bg-blue-100'
  }
];

/**
 * 功能特性数据
 */
interface Feature {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const features: Feature[] = [
  {
    id: 'news',
    title: '实时新闻分析',
    description: '自动获取和分析影响市场的重要新闻，提供AI驱动的影响评估',
    icon: NewspaperIcon
  },
  {
    id: 'trends',
    title: '价格趋势图表',
    description: '直观展示过去5天的价格走势，支持交互式数据查看',
    icon: ChartBarIcon
  },
  {
    id: 'global',
    title: '多市场覆盖',
    description: '覆盖现货黄金和纳斯达克100，满足不同投资需求',
    icon: GlobeAltIcon
  }
];

/**
 * 首页组件
 */
export const HomePage: React.FC<HomePageProps> = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      {/* 主题切换按钮 - 固定在右上角 */}
      <div className="fixed top-4 right-4 z-[9998]">
        <ThemeToggle />
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center">
            <h1 className="text-4xl tracking-tight font-extrabold text-slate-900 dark:text-gray-100 sm:text-5xl md:text-6xl">
              <span className="block">投资新闻</span>
              <span className="block text-blue-600 dark:text-blue-400">智能分析器</span>
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-slate-500 dark:text-gray-400 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              获取实时金融新闻，AI智能分析市场影响，助您做出更明智的投资决策
            </p>
          </div>
        </div>
      </section>

      {/* API Status */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <ApiStatusIndicator />
      </section>

      {/* Navigation Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-gray-100 sm:text-4xl">
            选择投资产品
          </h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-gray-400">
            点击下方卡片开始分析您感兴趣的投资产品
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {navigationCards.map((card) => {
            const IconComponent = card.icon;
            return (
              <Link
                key={card.id}
                to={card.path}
                className={`${card.bgColor} dark:bg-gray-800 dark:hover:bg-gray-700 border border-slate-200 dark:border-gray-700 rounded-xl p-8 transition-all duration-200 hover:shadow-lg hover:scale-105 group`}
              >
                <div className="flex items-center mb-4">
                  <div className={`${card.color} p-3 rounded-lg bg-white dark:bg-gray-900 shadow-sm group-hover:shadow-md transition-shadow`}>
                    <IconComponent className="h-8 w-8" />
                  </div>
                  <h3 className="ml-4 text-xl font-bold text-slate-900 dark:text-gray-100">
                    {card.title}
                  </h3>
                </div>
                <p className="text-slate-600 dark:text-gray-400 leading-relaxed">
                  {card.description}
                </p>
                <div className="mt-6 flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300">
                  开始分析
                  <svg className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white dark:bg-gray-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-gray-100 sm:text-4xl">
              核心功能
            </h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-gray-400">
              专业的投资分析工具，助您把握市场机会
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature) => {
              const IconComponent = feature.icon;
              return (
                <div key={feature.id} className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                      <IconComponent className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-gray-100 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 dark:text-gray-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 dark:bg-blue-900 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            开始您的投资分析之旅
          </h2>
          <p className="mt-4 text-xl text-blue-100 dark:text-blue-200">
            选择您感兴趣的投资产品，获取专业的市场分析
          </p>
          <div className="mt-8 flex justify-center space-x-4">
            <Link
              to="/gold"
              className="bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 px-8 py-3 rounded-lg font-medium hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors"
            >
              分析黄金
            </Link>
            <Link
              to="/nasdaq"
              className="bg-blue-700 dark:bg-blue-800 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-800 dark:hover:bg-blue-700 transition-colors border border-blue-500 dark:border-blue-600"
            >
              分析纳斯达克
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;