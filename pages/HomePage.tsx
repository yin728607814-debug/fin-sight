/**
 * 首页组件 - 应用入口和导航
 * 提供现货黄金和纳斯达克100的导航入口
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ChartBarIcon, 
  NewspaperIcon, 
  Squares2X2Icon,
  SparklesIcon,
  ShieldCheckIcon,
  BoltIcon,
  CurrencyDollarIcon,
  ChatBubbleLeftRightIcon,
  BriefcaseIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import { ThemeToggle } from '../components/ThemeToggle';
import { useAuth } from '../utils/AuthContext';

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
    id: 'portfolio',
    title: '投资组合',
    description: '智能追踪您的投资组合，实时监控收益与风险',
    path: '/portfolio',
    icon: BriefcaseIcon,
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'from-emerald-500/10 to-teal-500/10'
  },
  {
    id: 'gold',
    title: '黄金市场',
    description: '实时黄金价格分析，把握贵金属投资机会',
    path: '/gold',
    icon: CurrencyDollarIcon,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'from-amber-500/10 to-yellow-500/10'
  },
  {
    id: 'nasdaq',
    title: '纳斯达克100',
    description: '追踪科技股走势，洞察市场先机',
    path: '/nasdaq',
    icon: ChartBarIcon,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'from-blue-500/10 to-cyan-500/10'
  },
  {
    id: 'dashboard',
    title: '智能仪表盘',
    description: '个性化数据看板，一站式掌握市场动态',
    path: '/dashboard',
    icon: Squares2X2Icon,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'from-purple-500/10 to-pink-500/10'
  },
  {
    id: 'ai-chat',
    title: 'AI投资顾问',
    description: '24/7智能助手，专业投资建议随时获取',
    path: '/ai-chat',
    icon: ChatBubbleLeftRightIcon,
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'from-indigo-500/10 to-violet-500/10'
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
    id: 'ai',
    title: 'AI驱动分析',
    description: '运用先进的人工智能技术，深度解析市场新闻，为您提供精准的投资洞察',
    icon: SparklesIcon
  },
  {
    id: 'realtime',
    title: '实时数据追踪',
    description: '毫秒级数据更新，确保您始终掌握最新的市场动态和价格变化',
    icon: BoltIcon
  },
  {
    id: 'security',
    title: '安全可靠',
    description: '企业级数据加密和隐私保护，让您的投资信息安全无忧',
    icon: ShieldCheckIcon
  },
  {
    id: 'news',
    title: '智能新闻聚合',
    description: '自动筛选高质量财经资讯，过滤噪音，只为您呈现最有价值的信息',
    icon: NewspaperIcon
  },
  {
    id: 'trends',
    title: '可视化图表',
    description: '专业级交互式图表，直观展示价格走势和技术指标，辅助决策',
    icon: ChartBarIcon
  },
  {
    id: 'portfolio',
    title: '组合管理',
    description: '全方位投资组合追踪，自动计算收益率，帮您优化资产配置',
    icon: BriefcaseIcon
  }
];

/**
 * 首页组件
 */
export const HomePage: React.FC<HomePageProps> = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('退出登录失败:', error);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* 顶部用户菜单 - 固定在右上角 */}
      <div className="fixed top-6 right-6 z-[9998] flex items-center space-x-3">
        {/* 用户菜单 */}
        {user && (
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-white dark:hover:bg-gray-800 transition-all"
            >
              <UserCircleIcon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {user.email}
              </span>
            </button>

            {/* 下拉菜单 */}
            {showUserMenu && (
              <>
                {/* 遮罩层 */}
                <div 
                  className="fixed inset-0 z-[9997]" 
                  onClick={() => setShowUserMenu(false)}
                />
                
                {/* 菜单内容 */}
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-[9999]">
                  <div className="py-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
                      退出登录
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
        
        {/* 主题切换按钮 */}
        <ThemeToggle />
      </div>

      {/* Hero Section - 全新设计 */}
      <section className="relative overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-500/20 to-purple-500/20 dark:from-blue-600/10 dark:to-purple-600/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-emerald-500/20 to-cyan-500/20 dark:from-emerald-600/10 dark:to-cyan-600/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-indigo-500/10 to-pink-500/10 dark:from-indigo-600/5 dark:to-pink-600/5 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 lg:pt-32 lg:pb-32">
          <div className="text-center">
            {/* 标签 */}
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 border border-blue-200/50 dark:border-blue-800/50 mb-8">
              <SparklesIcon className="h-4 w-4 text-blue-600 dark:text-blue-400 mr-2" />
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">AI驱动的智能投资平台</span>
            </div>

            {/* 主标题 */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
              <span className="block text-gray-900 dark:text-white mb-2">
                智能投资分析
              </span>
              <span className="block bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                数据驱动决策
              </span>
            </h1>

            {/* 副标题 */}
            <p className="mt-6 max-w-3xl mx-auto text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
              整合实时市场数据、AI智能分析与专业投资工具，
              <br className="hidden sm:block" />
              助您在复杂的金融市场中做出更明智的投资决策
            </p>

            {/* CTA按钮 */}
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/portfolio"
                className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300 hover:scale-105"
              >
                <BriefcaseIcon className="h-5 w-5 mr-2" />
                开始投资
                <svg className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-gray-900 dark:text-white bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-300 hover:scale-105"
              >
                <Squares2X2Icon className="h-5 w-5 mr-2" />
                查看仪表盘
              </Link>
            </div>

            {/* 统计数据 */}
            <div className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 dark:text-white">24/7</div>
                <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">实时监控</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 dark:text-white">AI</div>
                <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">智能分析</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 dark:text-white">5+</div>
                <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">专业工具</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Navigation Cards - 重新设计 */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            核心功能模块
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            选择您需要的投资工具，开启智能投资之旅
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {navigationCards.map((card, index) => {
            const IconComponent = card.icon;
            return (
              <Link
                key={card.id}
                to={card.path}
                className="group relative overflow-hidden rounded-2xl bg-gradient-to-br bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* 渐变背景 */}
                <div className={`absolute inset-0 bg-gradient-to-br ${card.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                
                {/* 内容 */}
                <div className="relative p-8">
                  {/* 图标 */}
                  <div className={`inline-flex p-4 rounded-xl bg-gradient-to-br ${card.bgColor} mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className={`h-8 w-8 ${card.color}`} />
                  </div>

                  {/* 标题 */}
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                    {card.title}
                  </h3>

                  {/* 描述 */}
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
                    {card.description}
                  </p>

                  {/* 箭头 */}
                  <div className="flex items-center text-sm font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    立即使用
                    <svg className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </div>

                {/* 装饰性元素 */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/50 to-transparent dark:from-white/5 rounded-full blur-2xl transform translate-x-16 -translate-y-16 group-hover:scale-150 transition-transform duration-500"></div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Features Section - 重新设计 */}
      <section className="relative py-24 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              为什么选择我们
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              专业的技术团队，先进的AI算法，为您打造最优质的投资分析体验
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div 
                  key={feature.id} 
                  className="group relative p-8 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-blue-500/50 dark:hover:border-blue-500/50 transition-all duration-300 hover:shadow-xl"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* 图标 */}
                  <div className="inline-flex p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 mb-6 group-hover:scale-110 transition-transform duration-300">
                    <IconComponent className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                  </div>

                  {/* 标题 */}
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                    {feature.title}
                  </h3>

                  {/* 描述 */}
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {feature.description}
                  </p>

                  {/* 装饰线 */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 rounded-b-2xl"></div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section - 重新设计 */}
      <section className="relative py-24 overflow-hidden">
        {/* 背景 */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-900 dark:via-indigo-900 dark:to-purple-900"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            准备好开始了吗？
          </h2>
          <p className="text-xl text-blue-100 dark:text-blue-200 mb-10 max-w-2xl mx-auto">
            立即体验专业的投资分析工具，让数据为您的投资决策保驾护航
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/portfolio"
              className="group inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-blue-600 bg-white rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
            >
              <BriefcaseIcon className="h-5 w-5 mr-2" />
              管理投资组合
              <svg className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link
              to="/gold"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-white/10 backdrop-blur-sm border-2 border-white/30 rounded-xl hover:bg-white/20 transition-all duration-300 hover:scale-105"
            >
              <CurrencyDollarIcon className="h-5 w-5 mr-2" />
              分析黄金市场
            </Link>
          </div>

          {/* 信任标识 */}
          <div className="mt-16 flex items-center justify-center gap-8 text-white/80">
            <div className="flex items-center">
              <ShieldCheckIcon className="h-5 w-5 mr-2" />
              <span className="text-sm">安全可靠</span>
            </div>
            <div className="flex items-center">
              <BoltIcon className="h-5 w-5 mr-2" />
              <span className="text-sm">实时更新</span>
            </div>
            <div className="flex items-center">
              <SparklesIcon className="h-5 w-5 mr-2" />
              <span className="text-sm">AI驱动</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-gray-600 dark:text-gray-400">
            <p className="text-sm">
              © 2025 智能投资分析平台. 专业的投资分析工具，助您做出更明智的决策.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;