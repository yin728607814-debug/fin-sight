/**
 * 应用状态管理Context
 * 提供全局状态管理和状态更新功能
 */

import { createContext, useContext, useReducer, ReactNode, useEffect, useState, useCallback } from 'react';
import { 
  AppState, 
  AppAction, 
  AppActionType, 
  AppContextType, 
  AssetType, 
  NewsItem, 
  NewsAnalysis, 
  PriceData,
  LoadingState,
  ErrorState 
} from '../types';
import { setLocalStorage, getLocalStorage } from './helpers';

// ============================================================================
// 初始状态定义
// ============================================================================

/**
 * 初始加载状态
 */
const initialLoadingState: LoadingState = {
  news: false,
  analysis: false,
  prices: false
};

/**
 * 初始错误状态
 */
const initialErrorState: ErrorState = {
  news: undefined,
  analysis: undefined,
  prices: undefined
};

/**
 * 应用初始状态
 */
export const initialAppState: AppState = {
  currentAsset: 'gold',
  news: {
    gold: [],
    nasdaq: [],
    astock: []
  },
  analysis: {
    gold: [],
    nasdaq: [],
    astock: []
  },
  overallAnalysis: {
    gold: null,
    nasdaq: null,
    astock: null
  },
  priceData: {
    gold: [],
    nasdaq: [],
    astock: []
  },
  loading: initialLoadingState,
  errors: initialErrorState
};

// ============================================================================
// Reducer函数
// ============================================================================

/**
 * 应用状态Reducer
 */
export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case AppActionType.SET_CURRENT_ASSET:
      return {
        ...state,
        currentAsset: action.payload
      };

    case AppActionType.SET_NEWS:
      return {
        ...state,
        news: {
          ...state.news,
          [action.payload.assetType]: action.payload.news
        }
      };

    case AppActionType.SET_ANALYSIS:
      return {
        ...state,
        analysis: {
          ...state.analysis,
          [action.payload.assetType]: action.payload.analysis
        }
      };

    case AppActionType.SET_OVERALL_ANALYSIS:
      return {
        ...state,
        overallAnalysis: {
          ...state.overallAnalysis,
          [action.payload.assetType]: action.payload.analysis
        }
      };

    case AppActionType.SET_PRICE_DATA:
      return {
        ...state,
        priceData: {
          ...state.priceData,
          [action.payload.assetType]: action.payload.data
        }
      };

    case AppActionType.SET_LOADING:
      return {
        ...state,
        loading: {
          ...state.loading,
          ...action.payload
        }
      };

    case AppActionType.SET_ERROR:
      return {
        ...state,
        errors: {
          ...state.errors,
          [action.payload.key]: action.payload.error
        }
      };

    case AppActionType.CLEAR_ERROR:
      return {
        ...state,
        errors: {
          ...state.errors,
          [action.payload]: undefined
        }
      };

    case AppActionType.RESET_STATE:
      // 返回一个全新的初始状态对象，确保完全重置
      return {
        currentAsset: 'gold',
        news: {
          gold: [],
          nasdaq: [],
          astock: []
        },
        analysis: {
          gold: [],
          nasdaq: [],
          astock: []
        },
        overallAnalysis: {
          gold: null,
          nasdaq: null,
          astock: null
        },
        priceData: {
          gold: [],
          nasdaq: [],
          astock: []
        },
        loading: {
          news: false,
          analysis: false,
          prices: false
        },
        errors: {
          news: undefined,
          analysis: undefined,
          prices: undefined
        }
      };

    default:
      return state;
  }
}

// ============================================================================
// Context创建
// ============================================================================

/**
 * 应用Context
 */
export const AppContext = createContext<AppContextType | undefined>(undefined);

// ============================================================================
// 持久化相关常量和函数
// ============================================================================

const STORAGE_KEY = 'investment-news-analyzer-state';
const STORAGE_VERSION = '2.3'; // 升级版本号，添加 astock 支持

/**
 * 可持久化的状态字段
 */
interface PersistableState {
  currentAsset: AssetType;
  news: {
    gold: NewsItem[];
    nasdaq: NewsItem[];
    astock: NewsItem[];
  };
  analysis: {
    gold: NewsAnalysis[];
    nasdaq: NewsAnalysis[];
    astock: NewsAnalysis[];
  };
  overallAnalysis: {
    gold: import('../types').OverallMarketAnalysis | null;
    nasdaq: import('../types').OverallMarketAnalysis | null;
    astock: import('../types').OverallMarketAnalysis | null;
  };
  priceData: {
    gold: PriceData[];
    nasdaq: PriceData[];
    astock: PriceData[];
  };
  timestamp: number; // 添加时间戳，用于判断数据是否过期
  version: string;
}

// 数据过期时间：24小时
const DATA_EXPIRATION_MS = 24 * 60 * 60 * 1000;

/**
 * 验证持久化数据的有效性
 */
function validatePersistedData(stored: any): boolean {
  if (!stored || typeof stored !== 'object') return false;
  
  // 检查版本
  if (stored.version !== STORAGE_VERSION) return false;
  
  // 检查必需字段
  if (!stored.currentAsset) return false;
  
  // 检查数据结构
  if (!stored.news || typeof stored.news !== 'object') return false;
  if (!stored.analysis || typeof stored.analysis !== 'object') return false;
  if (!stored.priceData || typeof stored.priceData !== 'object') return false;
  
  // 检查数组类型 - 包括 astock
  if (!Array.isArray(stored.news.gold) || !Array.isArray(stored.news.nasdaq) || !Array.isArray(stored.news.astock)) return false;
  if (!Array.isArray(stored.analysis.gold) || !Array.isArray(stored.analysis.nasdaq) || !Array.isArray(stored.analysis.astock)) return false;
  if (!Array.isArray(stored.priceData.gold) || !Array.isArray(stored.priceData.nasdaq) || !Array.isArray(stored.priceData.astock)) return false;
  
  return true;
}

/**
 * 从本地存储加载状态
 */
function loadPersistedState(): Partial<AppState> {
  try {
    const stored = getLocalStorage<PersistableState | null>(STORAGE_KEY, null);
    
    // 验证数据有效性
    if (!validatePersistedData(stored)) {
      console.warn('持久化数据无效，使用初始状态');
      // 清除无效数据
      localStorage.removeItem(STORAGE_KEY);
      return {};
    }
    
    // 检查数据是否过期
    const now = Date.now();
    const isExpired = stored!.timestamp && (now - stored!.timestamp > DATA_EXPIRATION_MS);
    
    if (isExpired) {
      console.log('持久化数据已过期，使用初始状态');
      return {
        currentAsset: stored!.currentAsset
      };
    }
    
    return {
      currentAsset: stored!.currentAsset,
      news: stored!.news,
      analysis: stored!.analysis,
      overallAnalysis: stored!.overallAnalysis,
      priceData: stored!.priceData
    };
  } catch (error) {
    console.error('加载持久化状态失败:', error);
    // 清除损坏的数据
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('清除损坏数据失败:', e);
    }
  }
  
  return {};
}

/**
 * 保存状态到本地存储
 */
function savePersistedState(state: AppState): void {
  try {
    const persistableState: PersistableState = {
      currentAsset: state.currentAsset,
      news: state.news,
      analysis: state.analysis,
      overallAnalysis: state.overallAnalysis,
      priceData: state.priceData,
      timestamp: Date.now(),
      version: STORAGE_VERSION
    };
    
    setLocalStorage(STORAGE_KEY, persistableState);
  } catch (error) {
    console.warn('保存持久化状态失败:', error);
    
    // 如果存储失败（可能是数据太大），尝试只保存关键数据
    try {
      const minimalState: Partial<PersistableState> = {
        currentAsset: state.currentAsset,
        timestamp: Date.now(),
        version: STORAGE_VERSION
      };
      setLocalStorage(STORAGE_KEY, minimalState);
    } catch (fallbackError) {
      console.error('保存最小化状态也失败:', fallbackError);
    }
  }
}

// ============================================================================
// Context Provider组件
// ============================================================================

interface AppProviderProps {
  children: ReactNode;
  initialState?: Partial<AppState>;
  enablePersistence?: boolean;
}

/**
 * 应用Context Provider组件
 */
export function AppProvider({ 
  children, 
  initialState, 
  enablePersistence = true 
}: AppProviderProps) {
  // 合并初始状态和持久化状态
  const mergedInitialState = {
    ...initialAppState,
    ...(enablePersistence ? loadPersistedState() : {}),
    ...initialState
  };

  const [state, dispatch] = useReducer(appReducer, mergedInitialState);

  // 持久化状态变化（使用防抖避免频繁保存）
  useEffect(() => {
    if (!enablePersistence) return;
    
    const timeoutId = setTimeout(() => {
      savePersistedState(state);
    }, 500); // 500ms 防抖
    
    return () => clearTimeout(timeoutId);
  }, [
    state,
    enablePersistence
  ]);

  const contextValue: AppContextType = {
    state,
    dispatch
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

// ============================================================================
// Custom Hooks
// ============================================================================

/**
 * 使用应用状态的Hook
 */
export function useAppState(): AppContextType {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppState必须在AppProvider内部使用');
  }
  return context;
}

/**
 * 使用当前资产状态的Hook
 */
export function useCurrentAsset() {
  const { state, dispatch } = useAppState();
  
  const setCurrentAsset = useCallback((assetType: AssetType) => {
    dispatch({ type: AppActionType.SET_CURRENT_ASSET, payload: assetType });
  }, [dispatch]);

  return {
    currentAsset: state.currentAsset,
    setCurrentAsset
  };
}

/**
 * 使用新闻状态的Hook
 */
export function useNews(assetType?: AssetType) {
  const { state, dispatch } = useAppState();
  const targetAsset = assetType || state.currentAsset;

  const setNews = useCallback((news: NewsItem[]) => {
    dispatch({
      type: AppActionType.SET_NEWS,
      payload: { assetType: targetAsset, news }
    });
  }, [dispatch, targetAsset]);

  return {
    news: state.news[targetAsset],
    setNews,
    loading: state.loading.news,
    error: state.errors.news
  };
}

/**
 * 使用分析状态的Hook
 */
export function useAnalysis(assetType?: AssetType) {
  const { state, dispatch } = useAppState();
  const targetAsset = assetType || state.currentAsset;

  const setAnalysis = useCallback((analysis: NewsAnalysis[]) => {
    dispatch({
      type: AppActionType.SET_ANALYSIS,
      payload: { assetType: targetAsset, analysis }
    });
  }, [dispatch, targetAsset]);

  return {
    analysis: state.analysis[targetAsset], // 保持原来的名称
    setAnalysis,
    loading: state.loading.analysis,
    error: state.errors.analysis
  };
}

/**
 * 使用价格数据状态的Hook
 */
export function usePriceData(assetType?: AssetType) {
  const { state, dispatch } = useAppState();
  const targetAsset = assetType || state.currentAsset;

  const setPriceData = useCallback((data: PriceData[]) => {
    dispatch({
      type: AppActionType.SET_PRICE_DATA,
      payload: { assetType: targetAsset, data }
    });
  }, [dispatch, targetAsset]);

  return {
    priceData: state.priceData[targetAsset],
    setPriceData,
    loading: state.loading.prices,
    error: state.errors.prices
  };
}

/**
 * 使用整体分析状态的Hook
 */
export function useOverallAnalysis(assetType?: AssetType) {
  const { state, dispatch } = useAppState();
  const targetAsset = assetType || state.currentAsset;

  const setOverallAnalysis = useCallback((analysis: import('../types').OverallMarketAnalysis) => {
    dispatch({
      type: AppActionType.SET_OVERALL_ANALYSIS,
      payload: { assetType: targetAsset, analysis }
    });
  }, [dispatch, targetAsset]);

  return {
    overallAnalysis: state.overallAnalysis[targetAsset],
    setOverallAnalysis
  };
}

/**
 * 使用加载状态的Hook
 */
export function useLoading() {
  const { state, dispatch } = useAppState();

  const setLoading = useCallback((loading: Partial<LoadingState>) => {
    dispatch({ type: AppActionType.SET_LOADING, payload: loading });
  }, [dispatch]);

  return {
    loading: state.loading,
    setLoading
  };
}

/**
 * 使用错误状态的Hook
 */
export function useErrors() {
  const { state, dispatch } = useAppState();

  const setError = useCallback((key: keyof ErrorState, error: string) => {
    dispatch({ type: AppActionType.SET_ERROR, payload: { key, error } });
  }, [dispatch]);

  const clearError = useCallback((key: keyof ErrorState) => {
    dispatch({ type: AppActionType.CLEAR_ERROR, payload: key });
  }, [dispatch]);

  const clearAllErrors = useCallback(() => {
    Object.keys(state.errors).forEach(key => {
      clearError(key as keyof ErrorState);
    });
  }, [state.errors, clearError]);

  return {
    errors: state.errors,
    setError,
    clearError,
    clearAllErrors
  };
}

/**
 * 重置应用状态的Hook
 */
export function useResetState() {
  const { dispatch } = useAppState();

  const resetState = useCallback(() => {
    dispatch({ type: AppActionType.RESET_STATE });
  }, [dispatch]);

  return { resetState };
}

/**
 * 自动刷新Hook
 */
export function useAutoRefresh(
  refreshCallback: () => Promise<void>,
  intervalMs: number = 5 * 60 * 1000, // 默认5分钟
  enabled: boolean = true
) {
  const { state } = useAppState();
  
  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(async () => {
      try {
        // 只有在没有加载状态时才自动刷新，避免干扰用户操作
        const hasActiveLoading = Object.values(state.loading).some(loading => loading);
        
        if (!hasActiveLoading) {
          await refreshCallback();
        }
      } catch (error) {
        console.warn('自动刷新失败:', error);
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }, [refreshCallback, intervalMs, enabled, state.loading]);
}

/**
 * 页面可见性检测Hook
 */
export function usePageVisibility() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return isVisible;
}