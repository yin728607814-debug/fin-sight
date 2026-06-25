/**
 * 首页组件 - 登录后的投资指挥中心
 */

import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRightIcon,
  ArrowTrendingUpIcon,
  BanknotesIcon,
  BoltIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
  CpuChipIcon,
  DocumentArrowUpIcon,
  NewspaperIcon,
  ShieldCheckIcon,
  SignalIcon,
  SparklesIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline';
import { AppHeader } from '../components/AppHeader';
import { AnimatedMarketMotionChart } from '../components/AnimatedMarketMotionChart';
import { useAuth } from '../utils/AuthContext';
import type { MarketMotionVariant } from '../utils/marketMotion';

interface HomePageProps {}

interface MarketSignalCard {
  id: string;
  title: string;
  eyebrow: string;
  description: string;
  route: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: 'gold' | 'nasdaq' | 'astock';
  primaryColor: string;
  secondaryColor: string;
  softColor: string;
  bgGradient: string;
  statusChip: string;
  bottomMeta: Array<{ label: string; value: string }>;
  intensity: number;
  variant: MarketMotionVariant;
}

type SystemModuleVariant = 'dashboard' | 'advisor' | 'intake' | 'rules';
type SystemModulePreviewType = 'dashboard' | 'advisor' | 'intake' | 'rules';

interface SystemModule {
  id: string;
  title: string;
  description: string;
  route: string;
  icon: React.ComponentType<{ className?: string }>;
  status: string;
  theme: {
    primary: string;
    secondary: string;
    soft: string;
    bg: string;
  };
  variant: SystemModuleVariant;
  previewType: SystemModulePreviewType;
}

const ModulePreview: React.FC<{ type: SystemModulePreviewType }> = ({ type }) => {
  if (type === 'dashboard') {
    return (
      <div className="module-preview module-preview-dashboard">
        <div className="module-dashboard-grid">
          <span><b />价格</span>
          <span><b />新闻</span>
          <span><b />组合</span>
        </div>
        <div className="module-status-rail">
          <i />
          <i />
          <i />
        </div>
      </div>
    );
  }

  if (type === 'advisor') {
    return (
      <div className="module-preview module-preview-advisor">
        <span className="advisor-bubble bubble-a" />
        <span className="advisor-bubble bubble-b" />
        <span className="advisor-bubble bubble-c" />
        <div className="advisor-core">
          <i />
          <i />
          <i />
        </div>
      </div>
    );
  }

  if (type === 'intake') {
    return (
      <div className="module-preview module-preview-intake">
        <div className="intake-chip-row">
          <span>CSV</span>
          <span>Image</span>
          <span>Table</span>
        </div>
        <svg viewBox="0 0 220 44" fill="none" aria-hidden="true">
          <path className="intake-flow-base" d="M18 25 C 56 9, 88 38, 125 22 S 184 18, 204 25" />
          <path className="intake-flow-line" d="M18 25 C 56 9, 88 38, 125 22 S 184 18, 204 25" />
          <path className="intake-flow-head" d="M196 18 L206 25 L195 31" />
        </svg>
      </div>
    );
  }

  return (
    <div className="module-preview module-preview-rules">
      <svg viewBox="0 0 220 64" fill="none" aria-hidden="true">
        <path className="rules-link rules-link-a" d="M42 18 L110 32 L178 18" />
        <path className="rules-link rules-link-b" d="M42 48 L110 32 L178 48" />
        <path className="rules-link-flow" d="M42 18 L110 32 L178 18" />
        <circle className="rules-node node-a" cx="42" cy="18" r="5" />
        <circle className="rules-node node-b" cx="42" cy="48" r="5" />
        <circle className="rules-node node-c" cx="178" cy="18" r="5" />
        <circle className="rules-node node-d" cx="178" cy="48" r="5" />
        <circle className="rules-core" cx="110" cy="32" r="12" />
        <path className="rules-core-mark" d="M104 32H116M110 26V38" />
      </svg>
    </div>
  );
};

const SystemModuleCard: React.FC<{ module: SystemModule }> = ({ module }) => {
  const IconComponent = module.icon;

  return (
    <Link
      to={module.route}
      className={`group system-module module-${module.variant}`}
      style={
        {
          '--module-primary': module.theme.primary,
          '--module-secondary': module.theme.secondary,
          '--module-soft': module.theme.soft,
          '--module-bg': module.theme.bg,
        } as React.CSSProperties
      }
    >
      <div className="module-topline" />
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="system-module-icon">
          <IconComponent className="h-5 w-5" />
        </div>
        <span className="system-module-chip"><i />{module.status}</span>
      </div>
      <div className="relative z-10 mt-4">
        <h3 className="text-base font-black text-gray-950 dark:text-white">{module.title}</h3>
        <p className="mt-2 min-h-[48px] text-sm leading-6 text-gray-600 dark:text-gray-400">{module.description}</p>
      </div>
      <ModulePreview type={module.previewType} />
      <div className="system-module-enter">
        <span>进入模块</span>
        <ArrowRightIcon className="h-4 w-4" />
      </div>
    </Link>
  );
};

const marketSignalCards: MarketSignalCard[] = [
  {
    id: 'gold',
    title: '黄金市场',
    eyebrow: 'Defensive Signal',
    description: '跟踪黄金价格、避险情绪、美元与利率环境的联动变化。',
    route: '/gold',
    icon: BanknotesIcon,
    tone: 'gold',
    primaryColor: '#F59E0B',
    secondaryColor: '#EA580C',
    softColor: '#FDBA74',
    bgGradient: 'linear-gradient(135deg, rgba(255, 255, 251, 0.9), rgba(255, 251, 235, 0.42), rgba(255, 247, 237, 0.34))',
    statusChip: '防守观察',
    bottomMeta: [
      { label: '关注重点', value: '避险 / 利率' },
      { label: '策略角色', value: '防守底仓' },
    ],
    intensity: 0.84,
    variant: 'gold',
  },
  {
    id: 'nasdaq',
    title: '纳斯达克100',
    eyebrow: 'Growth Pulse',
    description: '观察科技成长股、流动性、回撤区间与长期定投节奏。',
    route: '/nasdaq',
    icon: ChartBarIcon,
    tone: 'nasdaq',
    primaryColor: '#2563EB',
    secondaryColor: '#06B6D4',
    softColor: '#60A5FA',
    bgGradient: 'linear-gradient(135deg, rgba(248, 252, 255, 0.92), rgba(239, 246, 255, 0.46), rgba(236, 254, 255, 0.34))',
    statusChip: '趋势偏强',
    bottomMeta: [
      { label: '关注重点', value: '趋势 / 回撤' },
      { label: '策略角色', value: '长期定投' },
    ],
    intensity: 1.08,
    variant: 'nasdaq',
  },
  {
    id: 'astock',
    title: 'A股市场',
    eyebrow: 'Local Momentum',
    description: '追踪指数、政策、新闻情绪与本土市场资金风险偏好。',
    route: '/astock',
    icon: ArrowTrendingUpIcon,
    tone: 'astock',
    primaryColor: '#E11D48',
    secondaryColor: '#F43F5E',
    softColor: '#FB7185',
    bgGradient: 'linear-gradient(135deg, rgba(255, 252, 253, 0.92), rgba(255, 241, 242, 0.42), rgba(250, 245, 255, 0.34))',
    statusChip: '情绪扫描',
    bottomMeta: [
      { label: '关注重点', value: '指数 / 情绪' },
      { label: '策略角色', value: '本土信号' },
    ],
    intensity: 1.16,
    variant: 'aStock',
  },
];

const systemModules: SystemModule[] = [
  {
    id: 'dashboard',
    title: '智能仪表盘',
    description: '价格、新闻、情绪和组合状态的统一看板。',
    route: '/dashboard',
    icon: Squares2X2Icon,
    status: 'Live Board',
    theme: {
      primary: '#2563EB',
      secondary: '#06B6D4',
      soft: '#93C5FD',
      bg: 'linear-gradient(135deg, rgba(248, 252, 255, 0.9), rgba(239, 246, 255, 0.52), rgba(236, 254, 255, 0.34))',
    },
    variant: 'dashboard',
    previewType: 'dashboard',
  },
  {
    id: 'ai-chat',
    title: 'AI投资顾问',
    description: '围绕当前持仓、新闻和市场信号继续追问。',
    route: '/ai-chat',
    icon: ChatBubbleLeftRightIcon,
    status: 'AI Ready',
    theme: {
      primary: '#4F46E5',
      secondary: '#8B5CF6',
      soft: '#A5B4FC',
      bg: 'linear-gradient(135deg, rgba(250, 250, 255, 0.92), rgba(238, 242, 255, 0.52), rgba(245, 243, 255, 0.34))',
    },
    variant: 'advisor',
    previewType: 'advisor',
  },
  {
    id: 'import',
    title: '导入持仓',
    description: '从截图或表格快速补充投资组合数据。',
    route: '/import-data',
    icon: DocumentArrowUpIcon,
    status: 'Data Intake',
    theme: {
      primary: '#059669',
      secondary: '#14B8A6',
      soft: '#6EE7B7',
      bg: 'linear-gradient(135deg, rgba(250, 255, 252, 0.9), rgba(236, 253, 245, 0.48), rgba(240, 253, 250, 0.34))',
    },
    variant: 'intake',
    previewType: 'intake',
  },
  {
    id: 'fund-config',
    title: '基金配置',
    description: '管理基金映射、识别规则和市场分类。',
    route: '/fund-config',
    icon: Cog6ToothIcon,
    status: 'Rules Engine',
    theme: {
      primary: '#D97706',
      secondary: '#7C3AED',
      soft: '#FBBF24',
      bg: 'linear-gradient(135deg, rgba(255, 253, 247, 0.92), rgba(255, 251, 235, 0.46), rgba(245, 243, 255, 0.34))',
    },
    variant: 'rules',
    previewType: 'rules',
  },
];

export const HomePage: React.FC<HomePageProps> = () => {
  const { user } = useAuth();
  const displayName = user?.email?.split('@')[0] || '投资者';
  const shellRef = useRef<HTMLDivElement>(null);
  const [hoveredMarket, setHoveredMarket] = useState<string | null>(null);

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const target = shellRef.current;
    if (!target) return;

    const rect = target.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    target.style.setProperty('--pointer-x', `${x.toFixed(2)}%`);
    target.style.setProperty('--pointer-y', `${y.toFixed(2)}%`);
    target.style.setProperty('--pointer-shift-x', `${((x - 50) * 0.35).toFixed(2)}px`);
    target.style.setProperty('--pointer-shift-y', `${((y - 50) * 0.25).toFixed(2)}px`);
    target.style.setProperty('--core-shift-x', `${((x - 50) * -0.08).toFixed(2)}px`);
    target.style.setProperty('--core-shift-y', `${((y - 50) * -0.06).toFixed(2)}px`);
    target.style.setProperty('--deck-tilt-x', `${((50 - y) * 0.08).toFixed(2)}deg`);
    target.style.setProperty('--deck-tilt-y', `${((x - 50) * 0.1).toFixed(2)}deg`);
  };

  return (
    <div
      ref={shellRef}
      onPointerMove={handlePointerMove}
      className="home-command-shell min-h-screen overflow-hidden text-gray-900 dark:text-gray-100"
    >
      <div className="command-bg" />
      <div className="command-grid" />
      <div className="command-scanline" />

      <AppHeader
        title="FinSight"
        showBackButton={false}
        badge="工作台"
        icon={<SparklesIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />}
      />

      <main className="relative z-10 mx-auto max-w-7xl px-6 py-8 lg:px-8 lg:py-10">
        <section className="grid min-h-[640px] items-center gap-10 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/70 bg-white/60 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-blue-700 shadow-lg shadow-blue-500/10 backdrop-blur-xl dark:border-blue-800/50 dark:bg-gray-800/60 dark:text-blue-300">
              <SignalIcon className="h-4 w-4" />
              AI Investment Command Center
            </div>

            <p className="mt-8 text-sm font-medium text-gray-600 dark:text-gray-400">
              欢迎回来，{displayName}
            </p>
            <h1 className="command-hero-title mt-4">
              <span>投资信号中枢</span>
              <span>为组合决策提速</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-gray-700 dark:text-gray-300">
              黄金、纳指、A股、新闻情绪和持仓状态在首页汇合，先完成市场扫描，再进入 AI 辅助决策。
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/portfolio" className="command-primary-button">
                打开投资组合
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
              <Link to="/ai-chat" className="command-secondary-button">
                询问 AI 顾问
                <CpuChipIcon className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-10 grid max-w-2xl grid-cols-3 gap-3">
              <div className="command-metric">
                <div className="text-[11px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">Coverage</div>
                <div className="mt-2 text-lg font-bold text-gray-950 dark:text-white">3 Markets</div>
                <div className="mt-2 h-1 rounded-full bg-gradient-to-r from-amber-300 via-cyan-300 to-rose-400" />
              </div>
              <div className="command-metric">
                <div className="text-[11px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">Workflow</div>
                <div className="mt-2 text-lg font-bold text-gray-950 dark:text-white">Scan - Ask - Act</div>
                <div className="mt-2 h-1 rounded-full bg-cyan-300/60" />
              </div>
              <div className="command-metric">
                <div className="text-[11px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">System</div>
                <div className="mt-2 text-lg font-bold text-gray-950 dark:text-white">AI Assisted</div>
                <div className="mt-2 h-1 rounded-full bg-emerald-300/60" />
              </div>
            </div>
          </div>

          <div className="signal-deck-stage relative mx-auto flex min-h-[590px] w-full max-w-[680px] items-center justify-center">
            <div className="signal-deck">
              <div className="deck-grid-plane" />
              <div className="deck-light deck-light-gold" />
              <div className="deck-light deck-light-blue" />

              <div className="deck-topbar">
                <div>
                  <p>Market Signal Deck</p>
                  <strong>市场信号沙盘</strong>
                </div>
                <span className="deck-live-dot">AI 同步中</span>
              </div>

              <div className="deck-track-stack">
                <Link to="/gold" className="signal-track signal-track-gold">
                  <div className="track-meta">
                    <BanknotesIcon className="h-5 w-5" />
                    <span>黄金防守信号</span>
                  </div>
                  <svg viewBox="0 0 260 56" fill="none">
                    <path className="track-gridline" d="M0 42H260" />
                    <path className="track-gridline" d="M0 24H260" />
                    <path className="track-glow" d="M4 38 C 32 20, 54 30, 78 18 S 126 16, 152 26 S 205 42, 256 14" />
                    <path className="track-line" d="M4 38 C 32 20, 54 30, 78 18 S 126 16, 152 26 S 205 42, 256 14" />
                  </svg>
                  <span className="track-pill">避险 / 利率</span>
                </Link>

                <Link to="/nasdaq" className="signal-track signal-track-nasdaq">
                  <div className="track-meta">
                    <ChartBarIcon className="h-5 w-5" />
                    <span>纳指成长脉冲</span>
                  </div>
                  <svg viewBox="0 0 260 56" fill="none">
                    <path className="track-gridline" d="M0 42H260" />
                    <path className="track-gridline" d="M0 24H260" />
                    <path className="track-glow" d="M4 40 C 28 44, 48 26, 72 31 S 118 16, 150 19 S 204 8, 256 17" />
                    <path className="track-line" d="M4 40 C 28 44, 48 26, 72 31 S 118 16, 150 19 S 204 8, 256 17" />
                  </svg>
                  <span className="track-pill">趋势 / 回撤</span>
                </Link>

                <Link to="/astock" className="signal-track signal-track-astock">
                  <div className="track-meta">
                    <ArrowTrendingUpIcon className="h-5 w-5" />
                    <span>A股情绪扫描</span>
                  </div>
                  <svg viewBox="0 0 260 56" fill="none">
                    <path className="track-gridline" d="M0 42H260" />
                    <path className="track-gridline" d="M0 24H260" />
                    <path className="track-glow" d="M4 28 C 31 14, 55 22, 78 32 S 123 48, 151 31 S 207 18, 256 30" />
                    <path className="track-line" d="M4 28 C 31 14, 55 22, 78 32 S 123 48, 151 31 S 207 18, 256 30" />
                  </svg>
                  <span className="track-pill">政策 / 情绪</span>
                </Link>
              </div>

              <div className="deck-core-card">
                <CpuChipIcon className="h-8 w-8 text-blue-600 dark:text-blue-300" />
                <div>
                  <p>组合核心</p>
                  <strong>Market Sync</strong>
                </div>
                <div className="core-status-row">
                  <span><i /> 持仓</span>
                  <span><i /> 新闻</span>
                  <span><i /> AI</span>
                </div>
              </div>

              <div className="deck-side-status">
                <span>
                  <ShieldCheckIcon className="h-4 w-4 text-amber-500" />
                  黄金回撤信号
                </span>
                <span>
                  <BoltIcon className="h-4 w-4 text-blue-500" />
                  AI 决策层
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.32em] text-blue-600/70 dark:text-blue-300/70">Market Terminals</p>
              <h2 className="mt-2 text-3xl font-black text-gray-950 dark:text-white">三大市场信号舱</h2>
            </div>
            <NewspaperIcon className="hidden h-7 w-7 text-gray-400 lg:block" />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {marketSignalCards.map((card) => {
              const IconComponent = card.icon;
              return (
                <Link
                  key={card.id}
                  to={card.route}
                  className={`group market-terminal terminal-${card.tone}`}
                  onPointerEnter={() => setHoveredMarket(card.id)}
                  onPointerLeave={() => setHoveredMarket(null)}
                  style={
                    {
                      '--terminal-primary': card.primaryColor,
                      '--terminal-secondary': card.secondaryColor,
                      '--terminal-soft': card.softColor,
                      '--terminal-bg': card.bgGradient,
                    } as React.CSSProperties
                  }
                >
                  <div className="terminal-glow" />
                  <div className="relative z-10 flex items-start justify-between gap-4">
                    <div className="terminal-icon">
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <ArrowRightIcon className="h-5 w-5 text-gray-400 transition group-hover:translate-x-1 group-hover:text-gray-900 dark:group-hover:text-white" />
                  </div>

                  <div className="relative z-10 mt-4">
                    <p className="text-xs font-bold uppercase tracking-[0.25em] text-gray-500 dark:text-gray-400">{card.eyebrow}</p>
                    <h3 className="mt-2 text-2xl font-black text-gray-950 dark:text-white">{card.title}</h3>
                    <p className="mt-2 min-h-[52px] text-sm leading-6 text-gray-600 dark:text-gray-400">{card.description}</p>
                  </div>

                  <AnimatedMarketMotionChart
                    variant={card.variant}
                    primaryColor={card.primaryColor}
                    secondaryColor={card.secondaryColor}
                    glowColor={card.softColor}
                    status={card.statusChip}
                    intensity={card.intensity}
                    hover={hoveredMarket === card.id}
                  />

                  <div className="relative z-10 mt-3 grid grid-cols-2 gap-3">
                    {card.bottomMeta.map((meta) => (
                      <div key={meta.label} className="terminal-stat">
                        <span>{meta.label}</span>
                        <strong>{meta.value}</strong>
                      </div>
                    ))}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="mt-8 pb-12">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.32em] text-gray-500 dark:text-gray-400">System Modules</p>
              <h2 className="mt-2 text-2xl font-black text-gray-950 dark:text-white">常用系统模块</h2>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {systemModules.map((module) => (
              <SystemModuleCard key={module.id} module={module} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default HomePage;
