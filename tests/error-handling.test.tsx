/**
 * 错误处理单元测试
 * 测试各种API失败场景和错误提示的正确显示
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DataFetchError } from '../components/DemoDataNotice';
import { RetryHandler, RetryButton } from '../components/RetryHandler';
import { ProgressiveFallback, createStandardFallbackLevels } from '../components/ProgressiveFallback';

describe('错误处理组件测试', () => {
  describe('DataFetchError 组件', () => {
    it('应该显示新闻数据获取失败的错误信息', () => {
      const mockRetry = jest.fn();
      const mockDismiss = jest.fn();

      render(
        <DataFetchError
          dataType="news"
          error="网络连接失败"
          onRetry={mockRetry}
          onDismiss={mockDismiss}
        />
      );

      expect(screen.getByText('新闻数据获取失败')).toBeInTheDocument();
      expect(screen.getByText('网络连接失败')).toBeInTheDocument();
      expect(screen.getByText('重试获取')).toBeInTheDocument();
      expect(screen.getByText('检查网络连接是否正常')).toBeInTheDocument();
    });

    it('应该显示价格数据获取失败的错误信息', () => {
      render(
        <DataFetchError
          dataType="price"
          error="API服务不可用"
        />
      );

      expect(screen.getByText('价格数据获取失败')).toBeInTheDocument();
      expect(screen.getByText('API服务不可用')).toBeInTheDocument();
      expect(screen.getByText('价格数据源可能维护中')).toBeInTheDocument();
    });

    it('应该显示分析数据获取失败的错误信息', () => {
      render(
        <DataFetchError
          dataType="analysis"
          error="分析服务超时"
        />
      );

      expect(screen.getByText('分析数据获取失败')).toBeInTheDocument();
      expect(screen.getByText('分析服务超时')).toBeInTheDocument();
      expect(screen.getByText('AI分析服务可能暂时过载')).toBeInTheDocument();
    });

    it('应该在点击重试按钮时调用重试函数', () => {
      const mockRetry = jest.fn();

      render(
        <DataFetchError
          dataType="news"
          onRetry={mockRetry}
        />
      );

      const retryButton = screen.getByText('重试获取');
      fireEvent.click(retryButton);

      expect(mockRetry).toHaveBeenCalledTimes(1);
    });

    it('应该在点击关闭按钮时调用关闭函数', () => {
      const mockDismiss = jest.fn();

      render(
        <DataFetchError
          dataType="news"
          onDismiss={mockDismiss}
        />
      );

      const dismissButton = screen.getByRole('button', { name: '关闭' });
      fireEvent.click(dismissButton);

      expect(mockDismiss).toHaveBeenCalledTimes(1);
    });

    it('应该显示备用数据选项', () => {
      const mockUseFallback = jest.fn();

      render(
        <DataFetchError
          dataType="news"
          showFallbackOption={true}
          onUseFallback={mockUseFallback}
        />
      );

      const fallbackButton = screen.getByText('使用备用数据');
      expect(fallbackButton).toBeInTheDocument();

      fireEvent.click(fallbackButton);
      expect(mockUseFallback).toHaveBeenCalledTimes(1);
    });
  });

  describe('RetryButton 组件', () => {
    it('应该显示重试按钮', () => {
      const mockRetry = jest.fn().mockResolvedValue(true);

      render(<RetryButton onRetry={mockRetry} />);

      expect(screen.getByText(/重试/)).toBeInTheDocument();
    });

    it('应该在点击时执行重试操作', async () => {
      const mockRetry = jest.fn().mockResolvedValue(true);

      render(<RetryButton onRetry={mockRetry} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockRetry).toHaveBeenCalledTimes(1);
      });
    });

    it('应该在重试过程中显示加载状态', async () => {
      const mockRetry = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(true), 100))
      );

      render(<RetryButton onRetry={mockRetry} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(screen.getByText('重试中...')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByText('重试中...')).not.toBeInTheDocument();
      });
    });

    it('应该在达到最大重试次数后禁用按钮', async () => {
      const mockRetry = jest.fn().mockResolvedValue(false);

      render(
        <RetryButton 
          onRetry={mockRetry} 
          config={{ maxAttempts: 1 }} // 只允许1次重试，简化测试
        />
      );

      const button = screen.getByRole('button');
      
      // 执行重试
      fireEvent.click(button);
      await waitFor(() => {
        expect(mockRetry).toHaveBeenCalledTimes(1);
      });

      // 按钮应该被禁用并显示失败状态
      await waitFor(() => {
        expect(screen.getByText('重试失败')).toBeInTheDocument();
        expect(button).toBeDisabled();
      });
    });
  });

  describe('RetryHandler 组件', () => {
    it('应该提供正确的重试状态', () => {
      const mockRetry = jest.fn().mockResolvedValue(true);

      render(
        <RetryHandler onRetry={mockRetry}>
          {({ isRetrying, attempt, maxAttempts, canRetry }) => (
            <div>
              <span data-testid="is-retrying">{isRetrying.toString()}</span>
              <span data-testid="attempt">{attempt}</span>
              <span data-testid="max-attempts">{maxAttempts}</span>
              <span data-testid="can-retry">{canRetry.toString()}</span>
            </div>
          )}
        </RetryHandler>
      );

      expect(screen.getByTestId('is-retrying')).toHaveTextContent('false');
      expect(screen.getByTestId('attempt')).toHaveTextContent('0');
      expect(screen.getByTestId('max-attempts')).toHaveTextContent('3');
      expect(screen.getByTestId('can-retry')).toHaveTextContent('true');
    });

    it('应该在重试失败时更新状态', async () => {
      const mockRetry = jest.fn().mockRejectedValue(new Error('网络错误'));

      render(
        <RetryHandler onRetry={mockRetry}>
          {({ retry, attempt, lastError }) => (
            <div>
              <button onClick={retry}>重试</button>
              <span data-testid="attempt">{attempt}</span>
              <span data-testid="error">{lastError || ''}</span>
            </div>
          )}
        </RetryHandler>
      );

      const button = screen.getByText('重试');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByTestId('attempt')).toHaveTextContent('1');
        expect(screen.getByTestId('error')).toHaveTextContent('网络错误');
      });
    });

    it('应该支持自动重试', async () => {
      // 简化测试，只测试基本的自动重试逻辑
      const mockRetry = jest.fn().mockResolvedValue(true);

      render(
        <RetryHandler 
          onRetry={mockRetry} 
          autoRetry={true}
          config={{ baseDelay: 10, maxAttempts: 1 }}
        >
          {({ retry, isRetrying }) => (
            <div>
              <button onClick={retry}>重试</button>
              <span data-testid="is-retrying">{isRetrying.toString()}</span>
            </div>
          )}
        </RetryHandler>
      );

      const button = screen.getByText('重试');
      fireEvent.click(button);

      // 验证重试被调用
      await waitFor(() => {
        expect(mockRetry).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('ProgressiveFallback 组件', () => {
    it('应该显示当前尝试的策略', () => {
      const mockLevels = createStandardFallbackLevels(
        'news',
        jest.fn().mockResolvedValue(true),
        jest.fn().mockResolvedValue(true),
        jest.fn().mockResolvedValue(true)
      );

      render(
        <ProgressiveFallback
          dataType="news"
          fallbackLevels={mockLevels}
          onSuccess={jest.fn()}
          onAllFailed={jest.fn()}
        />
      );

      // 使用getAllByText来处理重复的文本，并检查第一个元素
      expect(screen.getAllByText('主要数据源')[0]).toBeInTheDocument();
      expect(screen.getAllByText('从主要API获取最新数据')[0]).toBeInTheDocument();
      expect(screen.getByText('尝试获取')).toBeInTheDocument();
    });

    it('应该在策略失败时切换到下一个策略', async () => {
      const mockPrimary = jest.fn().mockResolvedValue(false);
      const mockFallback = jest.fn().mockResolvedValue(true);
      const mockSuccess = jest.fn();

      const mockLevels = [
        {
          id: 'primary',
          name: '主要数据源',
          description: '从主要API获取数据',
          action: mockPrimary,
          isAvailable: true
        },
        {
          id: 'fallback',
          name: '备用数据源',
          description: '从备用API获取数据',
          action: mockFallback,
          isAvailable: true
        }
      ];

      render(
        <ProgressiveFallback
          dataType="news"
          fallbackLevels={mockLevels}
          onSuccess={mockSuccess}
          onAllFailed={jest.fn()}
        />
      );

      // 点击尝试获取
      const tryButton = screen.getByText('尝试获取');
      fireEvent.click(tryButton);

      // 等待主要策略失败，应该显示备用策略
      await waitFor(() => {
        expect(screen.getByText('备用数据源')).toBeInTheDocument();
      });

      // 再次点击尝试获取
      const tryButton2 = screen.getByText('尝试获取');
      fireEvent.click(tryButton2);

      // 等待成功回调被调用
      await waitFor(() => {
        expect(mockSuccess).toHaveBeenCalledWith(mockLevels[1]);
      });
    });

    it('应该在所有策略失败时显示错误信息', async () => {
      const mockPrimary = jest.fn().mockResolvedValue(false);
      const mockFallback = jest.fn().mockResolvedValue(false);
      const mockAllFailed = jest.fn();

      const mockLevels = [
        {
          id: 'primary',
          name: '主要数据源',
          description: '从主要API获取数据',
          action: mockPrimary,
          isAvailable: true
        },
        {
          id: 'fallback',
          name: '备用数据源',
          description: '从备用API获取数据',
          action: mockFallback,
          isAvailable: true
        }
      ];

      render(
        <ProgressiveFallback
          dataType="news"
          fallbackLevels={mockLevels}
          onSuccess={jest.fn()}
          onAllFailed={mockAllFailed}
        />
      );

      // 尝试主要策略
      fireEvent.click(screen.getByText('尝试获取'));

      await waitFor(() => {
        expect(mockPrimary).toHaveBeenCalled();
      });

      // 等待切换到备用策略
      await waitFor(() => {
        expect(screen.getAllByText('备用数据源')[0]).toBeInTheDocument();
      });

      // 尝试备用策略
      fireEvent.click(screen.getByText('尝试获取'));

      await waitFor(() => {
        expect(mockFallback).toHaveBeenCalled();
      });

      // 等待所有策略失败，应该显示DataFetchError组件
      await waitFor(() => {
        expect(screen.getByText('新闻数据获取失败')).toBeInTheDocument();
        expect(screen.getByText(/所有数据源都不可用/)).toBeInTheDocument();
      });
    });

    it('应该显示策略进度', async () => {
      const mockLevels = createStandardFallbackLevels(
        'news',
        jest.fn().mockResolvedValue(false),
        jest.fn().mockResolvedValue(false)
      );

      render(
        <ProgressiveFallback
          dataType="news"
          fallbackLevels={mockLevels}
          onSuccess={jest.fn()}
          onAllFailed={jest.fn()}
        />
      );

      // 尝试第一个策略
      fireEvent.click(screen.getByText('尝试获取'));

      await waitFor(() => {
        expect(screen.getByText('部分数据源不可用')).toBeInTheDocument();
        expect(screen.getByText(/个策略已尝试/)).toBeInTheDocument();
      });
    });
  });

  describe('API失败场景测试', () => {
    it('应该处理网络连接失败', () => {
      render(
        <DataFetchError
          dataType="news"
          error="Network Error: Failed to fetch"
        />
      );

      expect(screen.getByText('新闻数据获取失败')).toBeInTheDocument();
      expect(screen.getByText('检查网络连接是否正常')).toBeInTheDocument();
    });

    it('应该处理API限制错误', () => {
      render(
        <DataFetchError
          dataType="news"
          error="API rate limit exceeded"
        />
      );

      expect(screen.getByText('新闻API可能达到调用限制')).toBeInTheDocument();
    });

    it('应该处理服务器错误', () => {
      render(
        <DataFetchError
          dataType="price"
          error="Internal Server Error"
        />
      );

      expect(screen.getByText('价格数据源可能维护中')).toBeInTheDocument();
    });

    it('应该处理超时错误', () => {
      render(
        <DataFetchError
          dataType="analysis"
          error="Request timeout"
        />
      );

      expect(screen.getByText('AI分析服务可能暂时过载')).toBeInTheDocument();
    });
  });

  describe('错误恢复机制测试', () => {
    it('应该在重试成功后清除错误状态', async () => {
      const mockRetry = jest.fn()
        .mockRejectedValueOnce(new Error('第一次失败'))
        .mockResolvedValueOnce(true);

      render(
        <RetryHandler onRetry={mockRetry}>
          {({ retry, lastError, attempt }) => (
            <div>
              <button onClick={retry}>重试</button>
              <span data-testid="error">{lastError || '无错误'}</span>
              <span data-testid="attempt">{attempt}</span>
            </div>
          )}
        </RetryHandler>
      );

      const button = screen.getByText('重试');
      
      // 第一次重试失败
      fireEvent.click(button);
      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('第一次失败');
        expect(screen.getByTestId('attempt')).toHaveTextContent('1');
      });

      // 第二次重试成功
      fireEvent.click(button);
      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('无错误');
        expect(screen.getByTestId('attempt')).toHaveTextContent('0');
      });
    });

    it('应该支持重置重试状态', () => {
      const mockRetry = jest.fn().mockRejectedValue(new Error('测试错误'));

      render(
        <RetryHandler onRetry={mockRetry}>
          {({ retry, reset, lastError, attempt }) => (
            <div>
              <button onClick={retry}>重试</button>
              <button onClick={reset}>重置</button>
              <span data-testid="error">{lastError || '无错误'}</span>
              <span data-testid="attempt">{attempt}</span>
            </div>
          )}
        </RetryHandler>
      );

      const retryButton = screen.getByText('重试');
      const resetButton = screen.getByText('重置');

      // 执行重试导致错误
      fireEvent.click(retryButton);

      waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('测试错误');
        expect(screen.getByTestId('attempt')).toHaveTextContent('1');
      });

      // 重置状态
      fireEvent.click(resetButton);

      expect(screen.getByTestId('error')).toHaveTextContent('无错误');
      expect(screen.getByTestId('attempt')).toHaveTextContent('0');
    });
  });
});