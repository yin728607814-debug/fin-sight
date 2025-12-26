import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './utils/context';
import { ThemeProvider } from './utils/ThemeContext';
import { HomePage, GoldAnalysisPage, NasdaqAnalysisPage } from './pages';
import { DebugPanel } from './components/DebugPanel';
import { logInfo } from './services/logger';

const App: React.FC = () => {
  React.useEffect(() => {
    logInfo('Investment News Analyzer Application mounted');
  }, []);

  return (
    <ThemeProvider>
      <AppProvider>
        <Router>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/gold" element={<GoldAnalysisPage />} />
            <Route path="/nasdaq" element={<NasdaqAnalysisPage />} />
          </Routes>
          <DebugPanel />
        </Router>
      </AppProvider>
    </ThemeProvider>
  );
};

export default App;