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
  const [migrationError, setMigrationError] = React.useState<string | null>(null);

  React.useEffect(() => {
    try {
      // 执行数据迁移
      migrateData();
      logInfo('Investment News Analyzer Application mounted');
    } catch (error) {
      console.error('数据迁移失败:', error);
      setMigrationError('数据迁移失败，应用可能无法正常工作');
      
      // 尝试清除所有数据并重新加载
      try {
        const keysToKeep = ['theme', 'dashboard_layouts', 'dashboard_current_layout', 'portfolio_positions', 'fund_config'];
        const allKeys = Object.keys(localStorage);
        allKeys.forEach(key => {
          if (!keysToKeep.includes(key)) {
            localStorage.removeItem(key);
          }
        });
        
        // 3秒后自动刷新页面
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      } catch (clearError) {
        console.error('清除数据失败:', clearError);
      }
    }
  }, []);

  // 如果有迁移错误，显示错误提示
  if (migrationError) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full">
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full mb-4">
            <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 text-center mb-2">
            数据迁移失败
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
            正在清除旧数据并重新加载...
          </p>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

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