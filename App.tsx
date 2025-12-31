import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './utils/context';
import { ThemeProvider } from './utils/ThemeContext';
import { DebugPanel } from './components/DebugPanel';
import { PageLoading } from './components/LoadingSpinner';
import { ErrorBoundary } from './components/ErrorBoundary';
import { logInfo } from './services/logger';
import { migrateData } from './utils/dataMigration';

// 懒加载页面组件
const HomePage = lazy(() => import('./pages/HomePage'));
const GoldAnalysisPage = lazy(() => import('./pages/GoldAnalysisPage'));
const NasdaqAnalysisPage = lazy(() => import('./pages/NasdaqAnalysisPage'));
const AIChatPage = lazy(() => import('./pages/AIChatPage'));
const PortfolioPage = lazy(() => import('./pages/PortfolioPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const FundConfigPage = lazy(() => import('./pages/FundConfigPage'));

const App: React.FC = () => {
  React.useEffect(() => {
    // 执行数据迁移
    migrateData();
    
    logInfo('Investment News Analyzer Application mounted');
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AppProvider>
          <Router>
            <Suspense fallback={<PageLoading />}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/gold" element={<GoldAnalysisPage />} />
                <Route path="/nasdaq" element={<NasdaqAnalysisPage />} />
                <Route path="/ai-chat" element={<AIChatPage />} />
                <Route path="/portfolio" element={<PortfolioPage />} />
                <Route path="/fund-config" element={<FundConfigPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
              </Routes>
            </Suspense>
            <DebugPanel />
          </Router>
        </AppProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;