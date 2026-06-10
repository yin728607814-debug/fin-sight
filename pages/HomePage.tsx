/**
 * 首页组件 - 登录后的投资工作台
 */

import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRightIcon,
  BanknotesIcon,
  BriefcaseIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
  DocumentArrowUpIcon,
  NewspaperIcon,
  Squares2X2Icon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { AppHeader } from '../components/AppHeader';
import { useAuth } from '../utils/AuthContext';

interface HomePageProps {}

interface MarketCard {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  statLabel: string;
  statValue: string;
}

interface ToolLink {
  id: string;
  title: string;
  description: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

const marketCards: MarketCard[] = [
  {
    id: 'gold',
    title: '黄金市场',
    subtitle: '防守底仓观察',
    description: '跟踪黄金价格、新闻影响和中期配置信号。',
    path: '/gold',
    icon: BanknotesIcon,
    accent: 'text-amber-600 bg-amber-50 border-amber-100 dark:text-amber-300 dark:bg-amber-950/30 dark:border-amber-900/60',
    statLabel: '关注重点',
    statValue: '避险 / 利率',
  },
  {
    id: 'nasdaq',
    title: '纳斯达克100',
    subtitle: '长期定投观察',
    description: '查看科技股走势、宏观新闻和定投节奏建议。',
    path: '/nasdaq',
    icon: ChartBarIcon,
    accent: 'text-blue-600 bg-blue-50 border-blue-100 dark:text-blue-300 dark:bg-blue-950/30 dark:border-blue-900/60',
    statLabel: '关注重点',
    statValue: '趋势 / 回撤',
  },
  {
    id: 'astock',
    title: 'A股市场',
    subtitle: '本土市场跟踪',
    description: '追踪上证指数与A股新闻，辅助仓位判断。',
    path: '/astock',
    icon: ChartBarIcon,
    accent: 'text-rose-600 bg-rose-50 border-rose-100 dark:text-rose-300 dark:bg-rose-950/30 dark:border-rose-900/60',
    statLabel: '关注重点',
    statValue: '指数 / 情绪',
  },
];

const tools: ToolLink[] = [
  {
    id: 'dashboard',
    title: '智能仪表盘',
    description: '把价格、新闻和情绪指数放到同一个看板。',
    path: '/dashboard',
    icon: Squares2X2Icon,
  },
  {
    id: 'ai-chat',
    title: 'AI投资顾问',
    description: '围绕当前持仓和市场新闻继续追问。',
    path: '/ai-chat',
    icon: ChatBubbleLeftRightIcon,
  },
  {
    id: 'import',
    title: '导入持仓',
    description: '从截图或表格快速补充投资组合数据。',
    path: '/import-data',
    icon: DocumentArrowUpIcon,
  },
  {
    id: 'fund-config',
    title: '基金配置',
    description: '管理基金映射和持仓识别规则。',
    path: '/fund-config',
    icon: Cog6ToothIcon,
  },
];

export const HomePage: React.FC<HomePageProps> = () => {
  const { user } = useAuth();
  const displayName = user?.email?.split('@')[0] || '投资者';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-50">
      <AppHeader
        title="FinSight"
        showBackButton={false}
        badge="工作台"
        icon={<SparklesIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />}
      />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  欢迎回来，{displayName}
                </p>
                <h1 className="mt-2 text-3xl font-bold tracking-normal text-slate-950 dark:text-white sm:text-4xl">
                  今天先看组合，再看市场信号
                </h1>
                <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300">
                  首页现在聚合最常用的入口：持仓、三类市场分析、看板和AI问答，减少来回跳转。
                </p>
              </div>
              <Link
                to="/portfolio"
                className="inline-flex shrink-0 items-center justify-center rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
              >
                打开投资组合
                <ArrowRightIcon className="ml-2 h-4 w-4" />
              </Link>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                <div className="text-sm text-slate-500 dark:text-slate-400">主线流程</div>
                <div className="mt-1 text-lg font-semibold text-slate-950 dark:text-white">持仓 - 市场 - 决策</div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                <div className="text-sm text-slate-500 dark:text-slate-400">市场覆盖</div>
                <div className="mt-1 text-lg font-semibold text-slate-950 dark:text-white">黄金 / 纳指 / A股</div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                <div className="text-sm text-slate-500 dark:text-slate-400">辅助工具</div>
                <div className="mt-1 text-lg font-semibold text-slate-950 dark:text-white">看板 / AI / 导入</div>
              </div>
            </div>
          </div>

          <aside className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-950 dark:text-white">快速开始</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">按常用顺序排列</p>
              </div>
              <BriefcaseIcon className="h-6 w-6 text-slate-400" />
            </div>
            <div className="mt-5 space-y-3">
              <Link
                to="/portfolio"
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 transition hover:border-slate-300 hover:bg-white dark:border-slate-800 dark:bg-slate-950/60 dark:hover:border-slate-700 dark:hover:bg-slate-900"
              >
                <span>
                  <span className="block text-sm font-semibold text-slate-950 dark:text-white">查看持仓和收益</span>
                  <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">优先确认资产状态</span>
                </span>
                <ArrowRightIcon className="h-4 w-4 text-slate-400" />
              </Link>
              <Link
                to="/dashboard"
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 transition hover:border-slate-300 hover:bg-white dark:border-slate-800 dark:bg-slate-950/60 dark:hover:border-slate-700 dark:hover:bg-slate-900"
              >
                <span>
                  <span className="block text-sm font-semibold text-slate-950 dark:text-white">进入综合看板</span>
                  <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">适合快速扫一遍市场</span>
                </span>
                <ArrowRightIcon className="h-4 w-4 text-slate-400" />
              </Link>
              <Link
                to="/ai-chat"
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 transition hover:border-slate-300 hover:bg-white dark:border-slate-800 dark:bg-slate-950/60 dark:hover:border-slate-700 dark:hover:bg-slate-900"
              >
                <span>
                  <span className="block text-sm font-semibold text-slate-950 dark:text-white">问AI下一步</span>
                  <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">把新闻和持仓放在一起问</span>
                </span>
                <ArrowRightIcon className="h-4 w-4 text-slate-400" />
              </Link>
            </div>
          </aside>
        </section>

        <section className="mt-6">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-950 dark:text-white">市场观察</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">三个市场入口统一放在同一层级，方便横向比较。</p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {marketCards.map((card) => {
              const IconComponent = card.icon;
              return (
                <Link
                  key={card.id}
                  to={card.path}
                  className="group rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className={`rounded-lg border p-3 ${card.accent}`}>
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <ArrowRightIcon className="mt-2 h-4 w-4 text-slate-400 transition group-hover:translate-x-1 group-hover:text-slate-700 dark:group-hover:text-slate-200" />
                  </div>
                  <div className="mt-5">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{card.subtitle}</p>
                    <h3 className="mt-1 text-xl font-bold text-slate-950 dark:text-white">{card.title}</h3>
                    <p className="mt-3 min-h-[48px] text-sm leading-6 text-slate-600 dark:text-slate-300">{card.description}</p>
                  </div>
                  <div className="mt-5 rounded-lg bg-slate-50 px-4 py-3 dark:bg-slate-950/60">
                    <div className="text-xs text-slate-500 dark:text-slate-400">{card.statLabel}</div>
                    <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{card.statValue}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-950 dark:text-white">常用工具</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">把低频工具压缩到同一区域，避免和核心市场入口抢层级。</p>
            </div>
            <NewspaperIcon className="hidden h-6 w-6 text-slate-400 sm:block" />
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {tools.map((tool) => {
              const IconComponent = tool.icon;
              return (
                <Link
                  key={tool.id}
                  to={tool.path}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-300 hover:bg-white dark:border-slate-800 dark:bg-slate-950/60 dark:hover:border-slate-700 dark:hover:bg-slate-900"
                >
                  <IconComponent className="h-6 w-6 text-slate-500 dark:text-slate-400" />
                  <h3 className="mt-4 text-sm font-semibold text-slate-950 dark:text-white">{tool.title}</h3>
                  <p className="mt-2 text-sm leading-5 text-slate-500 dark:text-slate-400">{tool.description}</p>
                </Link>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
};

export default HomePage;
