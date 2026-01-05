/**
 * 认证服务
 * 使用 Supabase Auth 管理用户登录注册
 */

import { supabase } from './supabaseClient';
import { Session, AuthError } from '@supabase/supabase-js';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  confirmPassword?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  createdAt: Date;
}

/**
 * 认证服务类
 */
export class AuthService {
  /**
   * 用户注册
   */
  static async register(credentials: RegisterCredentials): Promise<{ user: AuthUser | null; error: string | null }> {
    try {
      if (!supabase) {
        return { user: null, error: 'Supabase 未初始化' };
      }

      const { email, password } = credentials;

      // 验证邮箱格式
      if (!email || !email.includes('@')) {
        return { user: null, error: '请输入有效的邮箱地址' };
      }

      // 验证密码长度
      if (!password || password.length < 6) {
        return { user: null, error: '密码至少需要6个字符' };
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        return { user: null, error: this.getErrorMessage(error) };
      }

      if (!data.user) {
        return { user: null, error: '注册失败，请重试' };
      }

      return {
        user: {
          id: data.user.id,
          email: data.user.email!,
          createdAt: new Date(data.user.created_at)
        },
        error: null
      };
    } catch (error) {
      console.error('注册异常:', error);
      return { user: null, error: '注册失败，请稍后重试' };
    }
  }

  /**
   * 用户登录
   */
  static async login(credentials: LoginCredentials): Promise<{ user: AuthUser | null; error: string | null }> {
    try {
      if (!supabase) {
        return { user: null, error: 'Supabase 未初始化' };
      }

      const { email, password } = credentials;

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { user: null, error: this.getErrorMessage(error) };
      }

      if (!data.user) {
        return { user: null, error: '登录失败，请重试' };
      }

      return {
        user: {
          id: data.user.id,
          email: data.user.email!,
          createdAt: new Date(data.user.created_at)
        },
        error: null
      };
    } catch (error) {
      console.error('登录异常:', error);
      return { user: null, error: '登录失败，请稍后重试' };
    }
  }

  /**
   * 用户登出
   */
  static async logout(): Promise<{ error: string | null }> {
    try {
      if (!supabase) {
        return { error: 'Supabase 未初始化' };
      }

      const { error } = await supabase.auth.signOut();

      if (error) {
        return { error: this.getErrorMessage(error) };
      }

      return { error: null };
    } catch (error) {
      console.error('登出异常:', error);
      return { error: '登出失败，请稍后重试' };
    }
  }

  /**
   * 获取当前用户
   */
  static async getCurrentUser(): Promise<AuthUser | null> {
    try {
      if (!supabase) {
        return null;
      }

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return null;
      }

      return {
        id: user.id,
        email: user.email!,
        createdAt: new Date(user.created_at)
      };
    } catch (error) {
      console.error('获取当前用户失败:', error);
      return null;
    }
  }

  /**
   * 获取当前会话
   */
  static async getSession(): Promise<Session | null> {
    try {
      if (!supabase) {
        return null;
      }

      const { data: { session } } = await supabase.auth.getSession();
      return session;
    } catch (error) {
      console.error('获取会话失败:', error);
      return null;
    }
  }

  /**
   * 监听认证状态变化
   */
  static onAuthStateChange(callback: (user: AuthUser | null) => void) {
    if (!supabase) {
      return { data: { subscription: { unsubscribe: () => {} } } };
    }

    return supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        callback({
          id: session.user.id,
          email: session.user.email!,
          createdAt: new Date(session.user.created_at)
        });
      } else {
        callback(null);
      }
    });
  }

  /**
   * 重置密码（发送重置邮件）
   */
  static async resetPassword(email: string): Promise<{ error: string | null }> {
    try {
      if (!supabase) {
        return { error: 'Supabase 未初始化' };
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        return { error: this.getErrorMessage(error) };
      }

      return { error: null };
    } catch (error) {
      console.error('重置密码异常:', error);
      return { error: '发送重置邮件失败，请稍后重试' };
    }
  }

  /**
   * 更新密码
   */
  static async updatePassword(newPassword: string): Promise<{ error: string | null }> {
    try {
      if (!supabase) {
        return { error: 'Supabase 未初始化' };
      }

      if (newPassword.length < 6) {
        return { error: '密码至少需要6个字符' };
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        return { error: this.getErrorMessage(error) };
      }

      return { error: null };
    } catch (error) {
      console.error('更新密码异常:', error);
      return { error: '更新密码失败，请稍后重试' };
    }
  }

  /**
   * 转换错误消息为中文
   */
  private static getErrorMessage(error: AuthError): string {
    const errorMessages: Record<string, string> = {
      'Invalid login credentials': '邮箱或密码错误',
      'Email not confirmed': '请先验证邮箱',
      'User already registered': '该邮箱已被注册',
      'Password should be at least 6 characters': '密码至少需要6个字符',
      'Unable to validate email address: invalid format': '邮箱格式不正确',
      'Email rate limit exceeded': '操作过于频繁，请稍后再试',
      'Invalid email or password': '邮箱或密码错误',
    };

    return errorMessages[error.message] || error.message || '操作失败，请重试';
  }
}

export const authService = AuthService;
