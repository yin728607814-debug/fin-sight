/**
 * 应用头部组件
 * 包含导航、主题切换和用户菜单
 */

import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '../utils/AuthContext';

interface AppHeaderProps {
  title: string;
  icon?: React.ReactNode;
  showBackButton?: boolean;
  badge?: string;
  actions?: React.ReactNode;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  icon,
  showBackButton = true,
  badge,
  actions,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
    navigate('/login');
  };

  return (
    <header className="relative bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl shadow-lg border-b border-white/20 dark:border-gray-700/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* 左侧：返回按钮和标题 */}
          <div className="flex items-center">
            {showBackButton && (
              <>
                <Link
                  to="/"
                  className="flex items-center text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                >
                  <ArrowLeftIcon className="h-5 w-5 mr-2" />
                  返回首页
                </Link>
                <div className="ml-6 h-6 border-l border-gray-300/50 dark:border-gray-600/50" />
              </>
            )}
            <h1 className={`${showBackButton ? 'ml-6' : ''} text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center`}>
              {icon && <span className="mr-3">{icon}</span>}
              {title}
              {badge && (
                <span className="ml-3 px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                  {badge}
                </span>
              )}
            </h1>
          </div>

          {/* 右侧：操作按钮、主题切换和用户菜单 */}
          <div className="flex items-center space-x-4">
            {/* 自定义操作按钮 */}
            {actions}

            {/* 主题切换 */}
            <div className="relative z-[9998]">
              <ThemeToggle />
            </div>

            {/* 用户菜单 */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/40 dark:border-gray-700/40 rounded-lg hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all"
              >
                <UserCircleIcon className="h-5 w-5" />
                <span className="hidden sm:inline">{user?.email?.split('@')[0] || '用户'}</span>
              </button>

              {/* 下拉菜单 */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-[9999]">
                  <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {user?.email}
                    </p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    退出登录
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
