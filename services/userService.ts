/**
 * 用户服务
 * 管理用户标识（使用 UUID）
 */

import { v4 as uuidv4 } from 'uuid';
import { logInfo } from './logger';

const USER_ID_KEY = 'portfolio_user_id';
const USER_ID_VERSION_KEY = 'portfolio_user_id_version';
const CURRENT_VERSION = '1.0';

/**
 * 用户服务类
 */
export class UserService {
  /**
   * 获取或生成用户ID
   */
  static getUserId(): string {
    let userId = localStorage.getItem(USER_ID_KEY);
    const version = localStorage.getItem(USER_ID_VERSION_KEY);
    
    // 如果没有用户ID或版本不匹配，生成新的
    if (!userId || version !== CURRENT_VERSION) {
      userId = uuidv4();
      localStorage.setItem(USER_ID_KEY, userId);
      localStorage.setItem(USER_ID_VERSION_KEY, CURRENT_VERSION);
      
      logInfo('生成新的用户ID', { 
        userId: userId.substring(0, 8) + '...',
        version: CURRENT_VERSION
      });
    }
    
    return userId;
  }

  /**
   * 清除用户ID（用于重置或测试）
   */
  static clearUserId(): void {
    localStorage.removeItem(USER_ID_KEY);
    localStorage.removeItem(USER_ID_VERSION_KEY);
    logInfo('用户ID已清除');
  }

  /**
   * 检查是否有用户ID
   */
  static hasUserId(): boolean {
    return !!localStorage.getItem(USER_ID_KEY);
  }

  /**
   * 获取用户ID的简短版本（用于显示）
   */
  static getUserIdShort(): string {
    const userId = this.getUserId();
    return userId.substring(0, 8);
  }
}
