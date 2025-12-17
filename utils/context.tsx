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
    nasdaq: []
  },
  analysis: {
    gold: [],
    nasdaq: []
  },
  priceData: {
    gold: [],
    nasdaq: []
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
          nasdaq: []
        },
        analysis: {
          gold: [],
          nasdaq: []
        },
        priceData: {
          gold: [],
          nasdaq: []
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
const STORAGE_VERSION = '1.0';

/**
 * 可持久化的状态字段
 */
interface PersistableState {
  currentAsset: AssetType;
  version: string;
}

/**
 * 从本地存储加载状态
 */
function loadPersistedState(): Partial<AppState> {
  try {
    const stored = getLocalStorage<PersistableState | null>(STORAGE_KEY, null);
    
    if (stored && stored.version === STORAGE_VERSION) {
      return {
        currentAsset: stored.currentAsset
      };
    }
  } catch (error) {
    console.warn('加载持久化状态失败:', error);
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
      version: STORAGE_VERSION
    };
    
    setLocalStorage(STORAGE_KEY, persistableState);
  } catch (error) {
    console.warn('保存持久化状态失败:', error);
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

  // 持久化状态变化
  useEffect(() => {
    if (enablePersistence) {
      savePersistedState(state);
    }
  }, [state.currentAsset, enablePersistence]);

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
    analysis: state.analysis[targetAsset],
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