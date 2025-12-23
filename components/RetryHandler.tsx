/**
 * 重试处理组件
 * 提供智能重试机制和用户友好的重试体验
 */

import React, { useState, useCallback, useEffect } from 'react';
import { LoadingSpinner } from './LoadingSpinner';

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryableErrors?: string[];
}

interface RetryHandlerProps {
  onRetry: () => Promise<boolean>;
  config?: Partial<RetryConfig>;
  autoRetry?: boolean;
  children: (retryState: RetryState) => React.ReactNode;
}

export interface RetryState {
  isRetrying: boolean;
  attempt: number;
  maxAttempts: number;
  nextRetryIn: number;
  canRetry: boolean;
  lastError?: string;
  retry: () => void;
  reset: () => void;
}

const DEFAULT_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  retryableErrors: [
    'network error',
    'timeout',
    'rate limit',
    'server error',
    '5xx',
    'connection'
  ]
};

export const RetryHandler: React.FC<RetryHandlerProps> = ({
  onRetry,
  config = {},
  autoRetry = false,
  children
}) => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  const [isRetrying, setIsRetrying] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [nextRetryIn, setNextRetryIn] = useState(0);
  const [lastError, setLastError] = useState<string>();
  const [countdownTimer, setCountdownTimer] = useState<NodeJS.Timeout>();

  const calculateDelay = useCallback((attemptNumber: number): number => {
    const delay = finalConfig.baseDelay * Math.pow(finalConfig.backoffFactor, attemptNumber - 1);
    return Math.min(delay, finalConfig.maxDelay);
  }, [finalConfig]);

  const isErrorRetryable = useCallback((error: string): boolean => {
    if (!finalConfig.retryableErrors) return true;
    
    const lowerError = error.toLowerCase();
    return finalConfig.retryableErrors.some(retryableError => 
      lowerError.includes(retryableError.toLowerCase())
    );
  }, [finalConfig.retryableErrors]);

  const startCountdown = useCallback((delay: number) => {
    setNextRetryIn(Math.ceil(delay / 1000));
    
    const timer = setInterval(() => {
      setNextRetryIn(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    setCountdownTimer(timer);
  }, []);

  const executeRetry = useCallback(async () => {
    if (attempt >= finalConfig.maxAttempts) {
      return;
    }

    const currentAttempt = attempt + 1;
    setAttempt(currentAttempt);
    setIsRetrying(true);
    setLastError(undefined);

    try {
      const success = await onRetry();
      
      if (success) {
        // 成功，重置状态
        setAttempt(0);
        setIsRetrying(false);
        setNextRetryIn(0);
        if (countdownTimer) {
          clearInterval(countdownTimer);
        }
        return;
      }
      
      // 失败但没有抛出错误
      throw new Error('操作失败');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      setLastError(errorMessage);
      
      // 检查是否可以重试
      if (currentAttempt < finalConfig.maxAttempts && isErrorRetryable(errorMessage)) {
        const delay = calculateDelay(currentAttempt);
        
        if (autoRetry) {
          // 自动重试
          startCountdown(delay);
          setTimeout(() => {
            executeRetry();
          }, delay);
        } else {
          // 手动重试，显示倒计时
          setIsRetrying(false);
          startCountdown(delay);
        }
      } else {
        // 不能重试或达到最大次数
        setIsRetrying(false);
        setNextRetryIn(0);
      }
    }
  }, [attempt, finalConfig.maxAttempts, onRetry, autoRetry, calculateDelay, isErrorRetryable, startCountdown, countdownTimer]);

  const manualRetry = useCallback(() => {
    if (countdownTimer) {
      clearInterval(countdownTimer);
      setCountdownTimer(undefined);
    }
    setNextRetryIn(0);
    executeRetry();
  }, [executeRetry, countdownTimer]);

  const reset = useCallback(() => {
    setAttempt(0);
    setIsRetrying(false);
    setNextRetryIn(0);
    setLastError(undefined);
    if (countdownTimer) {
      clearInterval(countdownTimer);
      setCountdownTimer(undefined);
    }
  }, [countdownTimer]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (countdownTimer) {
        clearInterval(countdownTimer);
      }
    };
  }, [countdownTimer]);

  const retryState: RetryState = {
    isRetrying,
    attempt,
    maxAttempts: finalConfig.maxAttempts,
    nextRetryIn,
    canRetry: attempt < finalConfig.maxAttempts && (!lastError || isErrorRetryable(lastError)),
    lastError,
    retry: manualRetry,
    reset
  };

  return <>{children(retryState)}</>;
};

/**
 * 简化的重试按钮组件
 */
interface RetryButtonProps {
  onRetry: () => Promise<boolean>;
  config?: Partial<RetryConfig>;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const RetryButton: React.FC<RetryButtonProps> = ({
  onRetry,
  config,
  disabled = false,
  className = '',
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  return (
    <RetryHandler onRetry={onRetry} config={config}>
      {({ isRetrying, canRetry, nextRetryIn, retry, attempt, maxAttempts }) => (
        <button
          onClick={retry}
          disabled={disabled || isRetrying || !canRetry}
          className={`
            inline-flex items-center ${sizeClasses[size]} font-medium rounded-md
            ${canRetry && !isRetrying
              ? 'text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              : 'text-gray-400 bg-gray-50 border border-gray-200 cursor-not-allowed'
            }
            transition-colors ${className}
          `}
        >
          {isRetrying ? (
            <>
              <LoadingSpinner size="sm" className="mr-1" />
              重试中...
            </>
          ) : nextRetryIn > 0 ? (
            <>
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {nextRetryIn}秒后重试
            </>
          ) : canRetry ? (
            <>
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              重试 ({attempt}/{maxAttempts})
            </>
          ) : (
            <>
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              重试失败
            </>
          )}
        </button>
      )}
    </RetryHandler>
  );
};

/**
 * 重试状态指示器组件
 */
interface RetryIndicatorProps {
  retryState: RetryState;
  className?: string;
}

export const RetryIndicator: React.FC<RetryIndicatorProps> = ({
  retryState,
  className = ''
}) => {
  const { isRetrying, attempt, maxAttempts, nextRetryIn, lastError } = retryState;

  if (!isRetrying && attempt === 0 && !lastError) {
    return null;
  }

  return (
    <div className={`text-sm ${className}`}>
      {isRetrying && (
        <div className="flex items-center text-blue-600">
          <LoadingSpinner size="sm" className="mr-2" />
          <span>正在重试... (第 {attempt} 次)</span>
        </div>
      )}
      
      {nextRetryIn > 0 && (
        <div className="flex items-center text-yellow-600">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{nextRetryIn} 秒后自动重试</span>
        </div>
      )}
      
      {lastError && !isRetrying && nextRetryIn === 0 && (
        <div className="flex items-center text-red-600">
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span>重试 {attempt}/{maxAttempts} 次后失败</span>
        </div>
      )}
    </div>
  );
};