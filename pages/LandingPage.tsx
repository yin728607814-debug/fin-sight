/**
 * 落地页组件
 * 未登录显示登录页面，已登录显示主页
 */

import React from 'react';
import { useAuth } from '../utils/AuthContext';
import { PageLoading } from '../components/LoadingSpinner';
import LoginPage from './LoginPage';
import HomePage from './HomePage';

export const LandingPage: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();

  // 正在加载认证状态
  if (loading) {
    return <PageLoading />;
  }

  // 未登录显示登录页
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // 已登录显示主页
  return <HomePage />;
};

export default LandingPage;
