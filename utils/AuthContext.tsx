/**
 * 认证上下文
 * 管理全局认证状态
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, AuthUser } from '../services/authService';
import { UserService } from '../services/userService';
import { positionService } from '../services/positionService';
import { fundConfigService } from '../services/fundConfigService';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  register: (email: string, password: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // 初始化：检查用户登录状态
  useEffect(() => {
    const initAuth = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          // 缓存用户ID
          UserService.cacheUserId(currentUser.id);
          // 更新服务的用户ID
          positionService.setUserId(currentUser.id);
          fundConfigService.setUserId(currentUser.id);
        }
      } catch (error) {
        console.error('初始化认证失败:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // 监听认证状态变化
    const { data: { subscription } } = authService.onAuthStateChange((authUser) => {
      setUser(authUser);
      if (authUser) {
        UserService.cacheUserId(authUser.id);
        positionService.setUserId(authUser.id);
        fundConfigService.setUserId(authUser.id);
      } else {
        UserService.clearUserId();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    const { user: authUser, error } = await authService.login({ email, password });
    
    if (authUser) {
      setUser(authUser);
      UserService.cacheUserId(authUser.id);
      positionService.setUserId(authUser.id);
      fundConfigService.setUserId(authUser.id);
    }
    
    return { error };
  };

  const register = async (email: string, password: string) => {
    const { user: authUser, error } = await authService.register({ email, password });
    
    if (authUser) {
      setUser(authUser);
      UserService.cacheUserId(authUser.id);
      positionService.setUserId(authUser.id);
      fundConfigService.setUserId(authUser.id);
    }
    
    return { error };
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    UserService.clearUserId();
    // 清空服务的用户ID
    positionService.setUserId('');
    fundConfigService.setUserId('');
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
