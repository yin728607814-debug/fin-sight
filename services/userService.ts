/**
 * 用户服务
 * 管理用户标识（使用 Supabase Auth）
 */

import { authService } from './authService';
import { logInfo } from './logger';

const USER_ID_KEY = 'portfolio_user_id';

/**
 * 用户服务类
 */
export class UserService {
  /**
   * 获取当前登录用户的ID
   */
  static async getUserId(): Promise<string> {
    // 优先从 Supabase Auth 获取
    const user = await authService.getCurrentUser();
    
    if (user) {
      return user.id;
    }

    // 如果未登录，返回空字符串（需要跳转到登录页）
    return '';
  }

  /**
   * 同步获取用户ID（用于非异步场景）
   * 注意：这个方法可能返回过期的ID，建议使用 getUserId()
   */
  static getUserIdSync(): string {
    // 从 localStorage 获取缓存的用户ID
    return localStorage.getItem(USER_ID_KEY) || '';
  }

  /**
   * 缓存用户ID到 localStorage
   */
  static cacheUserId(userId: string): void {
    if (userId) {
      localStorage.setItem(USER_ID_KEY, userId);
    } else {
      localStorage.removeItem(USER_ID_KEY);
    }
  }

  /**
   * 清除用户ID缓存
   */
  static clearUserId(): void {
    localStorage.removeItem(USER_ID_KEY);
    logInfo('用户ID已清除');
  }

  /**
   * 检查用户是否已登录
   */
  static async isLoggedIn(): Promise<boolean> {
    const userId = await this.getUserId();
    return !!userId;
  }

  /**
   * 获取用户ID的简短版本（用于显示）
   */
  static getUserIdShort(userId?: string): string {
    const id = userId || this.getUserIdSync();
    return id ? id.substring(0, 8) : '';
  }
}
