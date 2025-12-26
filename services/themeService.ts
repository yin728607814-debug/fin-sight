/**
 * 主题服务
 * 负责主题切换、持久化和系统主题检测
 */

export type Theme = 'light' | 'dark' | 'system';
export type EffectiveTheme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'app-theme';

/**
 * 主题服务类
 */
export class ThemeService {
  private static instance: ThemeService;

  private constructor() {}

  /**
   * 获取单例实例
   */
  static getInstance(): ThemeService {
    if (!ThemeService.instance) {
      ThemeService.instance = new ThemeService();
    }
    return ThemeService.instance;
  }

  /**
   * 获取保存的主题设置
   */
  getTheme(): Theme {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        return saved;
      }
    } catch (error) {
      console.warn('无法读取主题设置:', error);
    }
    return 'system'; // 默认跟随系统
  }

  /**
   * 保存主题设置
   */
  setTheme(theme: Theme): void {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (error) {
      console.error('无法保存主题设置:', error);
    }
  }

  /**
   * 获取系统主题
   */
  getSystemTheme(): EffectiveTheme {
    if (typeof window === 'undefined') {
      return 'light';
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    return mediaQuery.matches ? 'dark' : 'light';
  }

  /**
   * 计算实际生效的主题
   */
  getEffectiveTheme(theme: Theme): EffectiveTheme {
    if (theme === 'system') {
      return this.getSystemTheme();
    }
    return theme;
  }

  /**
   * 应用主题到 DOM
   */
  applyTheme(theme: EffectiveTheme): void {
    const root = document.documentElement;
    
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }

  /**
   * 监听系统主题变化
   */
  watchSystemTheme(callback: (theme: EffectiveTheme) => void): () => void {
    if (typeof window === 'undefined') {
      return () => {};
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handler = (e: MediaQueryListEvent) => {
      callback(e.matches ? 'dark' : 'light');
    };

    // 现代浏览器
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
    
    // 旧版浏览器
    mediaQuery.addListener(handler);
    return () => mediaQuery.removeListener(handler);
  }
}

/**
 * 默认主题服务实例
 */
export const themeService = ThemeService.getInstance();
