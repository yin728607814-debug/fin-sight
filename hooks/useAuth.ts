/**
 * 认证 Hook
 * 提供当前用户信息
 */

import { useState, useEffect } from 'react';
import { authService } from '../services/authService';

interface User {
  id: string;
  email: string;
}

interface UseAuthReturn {
  user: User | null;
  loading: boolean;
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 获取当前用户
    const loadUser = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        if (currentUser) {
          setUser({
            id: currentUser.id,
            email: currentUser.email || ''
          });
        }
      } catch (error) {
        console.error('获取用户信息失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();

    // 监听认证状态变化
    const authSubscription = authService.onAuthStateChange((user) => {
      if (user) {
        setUser({
          id: user.id,
          email: user.email || ''
        });
      } else {
        setUser(null);
      }
    });

    return () => {
      authSubscription?.data?.subscription?.unsubscribe();
    };
  }, []);

  return { user, loading };
};
