/**
 * 错误处理工具模块
 * 提供统一的错误处理和错误类型创建功能
 */

import { APIError, NetworkError, AnalysisError, ErrorType } from '../types';

/**
 * 创建API错误
 */
export function createAPIError(
  type: ErrorType,
  message: string,
  code?: string | number,
  details?: unknown
): APIError {
  return {
    type,
    message,
    code,
    details
  };
}

/**
 * 创建网络错误
 */
export function createNetworkError(
  message: string,
  status?: number,
  details?: unknown
): NetworkError {
  return {
    type: ErrorType.NETWORK_ERROR,
    message,
    status,
    details
  };
}

/**
 * 创建分析错误
 */
export function createAnalysisError(
  message: string,
  newsId?: string,
  details?: unknown
): AnalysisError {
  return {
    type: ErrorType.ANALYSIS_FAILED,
    message,
    newsId,
    details
  };
}

/**
 * 判断是否为API错误
 */
export function isAPIError(error: unknown): error is APIError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    'message' in error &&
    Object.values(ErrorType).includes((error as APIError).type)
  );
}

/**
 * 判断是否为网络错误
 */
export function isNetworkError(error: unknown): error is NetworkError {
  return isAPIError(error) && error.type === ErrorType.NETWORK_ERROR;
}

/**
 * 判断是否为分析错误
 */
export function isAnalysisError(error: unknown): error is AnalysisError {
  return isAPIError(error) && error.type === ErrorType.ANALYSIS_FAILED;
}

/**
 * 获取用户友好的错误消息
 */
export function getErrorMessage(error: unknown): string {
  if (isAPIError(error)) {
    switch (error.type) {
      case ErrorType.NETWORK_ERROR:
        return '网络连接失败，请检查网络设置后重试';
      case ErrorType.API_LIMIT_EXCEEDED:
        return 'API调用次数已达上限，请稍后再试';
      case ErrorType.INVALID_RESPONSE:
        return '服务器返回数据格式错误';
      case ErrorType.ANALYSIS_FAILED:
        return '新闻分析失败，请重试';
      case ErrorType.DATA_NOT_FOUND:
        return '未找到相关数据';
      case ErrorType.VALIDATION_ERROR:
        return '数据验证失败';
      default:
        return error.message || '未知错误';
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return '发生未知错误';
}

/**
 * 错误重试策略配置
 */
export interface RetryConfig {
  maxRetries: number;
  baseDelay: number; // 基础延迟时间（毫秒）
  maxDelay: number; // 最大延迟时间（毫秒）
  backoffFactor: number; // 退避因子
}

/**
 * 默认重试配置
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2
};

/**
 * 计算重试延迟时间（指数退避算法）
 */
export function calculateRetryDelay(
  attempt: number,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): number {
  const delay = config.baseDelay * Math.pow(config.backoffFactor, attempt - 1);
  return Math.min(delay, config.maxDelay);
}

/**
 * 判断错误是否可以重试
 */
export function isRetryableError(error: unknown): boolean {
  if (isNetworkError(error)) {
    // 网络错误通常可以重试
    return true;
  }

  if (isAPIError(error)) {
    switch (error.type) {
      case ErrorType.API_LIMIT_EXCEEDED:
      case ErrorType.INVALID_RESPONSE:
        return true;
      case ErrorType.VALIDATION_ERROR:
      case ErrorType.DATA_NOT_FOUND:
        return false;
      default:
        return true;
    }
  }

  return false;
}

/**
 * 错误处理器类
 */
export class ErrorHandler {
  private static instance: ErrorHandler;

  private constructor() {}

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * 处理新闻API错误
   */
  public handleNewsAPIError(error: unknown): APIError {
    if (isAPIError(error)) {
      return error;
    }

    if (error instanceof Error) {
      return createAPIError(
        ErrorType.NETWORK_ERROR,
        `新闻API调用失败: ${error.message}`,
        undefined,
        error
      );
    }

    return createAPIError(
      ErrorType.NETWORK_ERROR,
      '新闻API调用失败',
      undefined,
      error
    );
  }

  /**
   * 处理价格API错误
   */
  public handlePriceAPIError(error: unknown): APIError {
    if (isAPIError(error)) {
      return error;
    }

    if (error instanceof Error) {
      return createAPIError(
        ErrorType.NETWORK_ERROR,
        `价格API调用失败: ${error.message}`,
        undefined,
        error
      );
    }

    return createAPIError(
      ErrorType.NETWORK_ERROR,
      '价格API调用失败',
      undefined,
      error
    );
  }

  /**
   * 处理分析错误
   */
  public handleAnalysisError(error: unknown, newsId?: string): AnalysisError {
    if (isAnalysisError(error)) {
      return error;
    }

    if (error instanceof Error) {
      return createAnalysisError(
        `新闻分析失败: ${error.message}`,
        newsId,
        error
      );
    }

    return createAnalysisError('新闻分析失败', newsId, error);
  }

  /**
   * 处理网络错误
   */
  public handleNetworkError(error: unknown): NetworkError {
    if (isNetworkError(error)) {
      return error;
    }

    // 处理axios错误
    if (error && typeof error === 'object' && 'isAxiosError' in error && error.isAxiosError) {
      const axiosError = error as any;
      const status = axiosError.response?.status;
      const message = axiosError.response?.data?.message || axiosError.message || '网络请求失败';
      return createNetworkError(`网络错误: ${message}`, status, error);
    }

    if (error instanceof Error) {
      return createNetworkError(`网络错误: ${error.message}`, undefined, error);
    }

    return createNetworkError('网络连接失败', undefined, error);
  }
}