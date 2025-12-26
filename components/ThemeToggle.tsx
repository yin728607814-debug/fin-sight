/**
 * 主题切换组件
 * 提供深色/浅色模式切换按钮
 */

import React from 'react';
import { SunIcon, MoonIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../utils/ThemeContext';
import { Theme } from '../services/themeService';

/**
 * 主题切换组件
 */
export const ThemeToggle: React.FC = () => {
  const { theme, effectiveTheme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = React.useState(false);

  /**
   * 主题选项
   */
  const themes: Array<{ value: Theme; label: string; icon: React.ReactNode }> = [
    {
      value: 'light',
      label: '浅色',
      icon: <SunIcon className="h-4 w-4" />,
    },
    {
      value: 'dark',
      label: '深色',
      icon: <MoonIcon className="h-4 w-4" />,
    },
    {
      value: 'system',
      label: '跟随系统',
      icon: <ComputerDesktopIcon className="h-4 w-4" />,
    },
  ];

  /**
   * 获取当前主题图标
   */
  const getCurrentIcon = () => {
    if (effectiveTheme === 'dark') {
      return <MoonIcon className="h-5 w-5" />;
    }
    return <SunIcon className="h-5 w-5" />;
  };

  /**
   * 处理主题选择
   */
  const handleThemeSelect = (selectedTheme: Theme) => {
    setTheme(selectedTheme);
    setIsOpen(false);
  };

  /**
   * 关闭下拉菜单（点击外部）
   */
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.theme-toggle-container')) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className="relative theme-toggle-container">
      {/* 切换按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center p-2 text-gray-700 dark:text-gray-300 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/40 dark:border-gray-700/40 rounded-lg hover:bg-white/80 dark:hover:bg-gray-800/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all shadow-lg"
        aria-label="切换主题"
        title="切换主题"
      >
        {getCurrentIcon()}
      </button>

      {/* 下拉菜单 */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-[9999] animate-in fade-in slide-in-from-top-2 duration-200">
          {themes.map((themeOption) => (
            <button
              key={themeOption.value}
              onClick={() => handleThemeSelect(themeOption.value)}
              className={`w-full flex items-center px-4 py-3 text-sm text-left transition-colors ${
                theme === themeOption.value
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`}
            >
              <span className="mr-3">{themeOption.icon}</span>
              <span className="flex-1">{themeOption.label}</span>
              {theme === themeOption.value && (
                <svg
                  className="h-4 w-4 text-blue-600 dark:text-blue-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
