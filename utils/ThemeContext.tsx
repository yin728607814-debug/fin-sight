/**
 * 主题上下文
 * 提供全局主题状态管理
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Theme, EffectiveTheme, themeService } from '../services/themeService';

/**
 * 主题上下文类型
 */
interface ThemeContextType {
  theme: Theme;
  effectiveTheme: EffectiveTheme;
  setTheme: (theme: Theme) => void;
}

/**
 * 主题上下文
 */
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * 主题提供者 Props
 */
interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * 主题提供者组件
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => themeService.getTheme());
  const [effectiveTheme, setEffectiveTheme] = useState<EffectiveTheme>(() => 
    themeService.getEffectiveTheme(themeService.getTheme())
  );

  /**
   * 设置主题
   */
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    themeService.setTheme(newTheme);
    
    const effective = themeService.getEffectiveTheme(newTheme);
    setEffectiveTheme(effective);
    themeService.applyTheme(effective);
  };

  /**
   * 初始化主题
   */
  useEffect(() => {
    // 应用初始主题
    themeService.applyTheme(effectiveTheme);

    // 监听系统主题变化（仅当设置为 system 时）
    if (theme === 'system') {
      const unwatch = themeService.watchSystemTheme((systemTheme) => {
        setEffectiveTheme(systemTheme);
        themeService.applyTheme(systemTheme);
      });

      return unwatch;
    }
  }, [theme, effectiveTheme]);

  const value: ThemeContextType = {
    theme,
    effectiveTheme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * 使用主题 Hook
 */
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
