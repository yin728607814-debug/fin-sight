/**
 * AI 图片识别组件
 * 用于上传收益截图并自动识别更新收益信息
 */

import React, { useState } from 'react';
import { PhotoIcon, SparklesIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { analyzeIncomeScreenshot } from '../services/imageAnalysisService';

interface ImageUploadAnalyzerProps {
  onAnalysisComplete: (results: AnalysisResult[]) => void;
}

export interface AnalysisResult {
  fundName: string;
  fundCode?: string;
  assetType: 'nasdaq' | 'astock';
  dailyChange: number;
  dailyProfitLoss: number;
  profitLoss?: number;  // 持仓收益（累计）
  profitLossPercent?: number;  // 持仓收益率（从支付宝截图中提取）
  totalValue?: number;
  confidence: number;
}

/**
 * AI 图片识别分析器组件
 */
export const ImageUploadAnalyzer: React.FC<ImageUploadAnalyzerProps> = ({ onAnalysisComplete }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * 处理文件选择
   */
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      setError('请上传图片文件');
      return;
    }

    // 验证文件大小（最大10MB）
    if (file.size > 10 * 1024 * 1024) {
      setError('图片大小不能超过10MB');
      return;
    }

    setSelectedFile(file);
    setError(null);
    setAnalysisResults(null);

    // 生成预览
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  /**
   * 开始分析图片
   */
  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const results = await analyzeIncomeScreenshot(selectedFile);
      setAnalysisResults(results);
      
      // 通知父组件
      onAnalysisComplete(results);
    } catch (err) {
      console.error('图片分析失败:', err);
      setError(err instanceof Error ? err.message : '图片分析失败，请重试');
    } finally {
      setIsAnalyzing(false);
    }
  };

  /**
   * 清除选择
   */
  const handleClear = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setAnalysisResults(null);
    setError(null);
  };

  /**
   * 切换展开/收起
   */
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
    if (isExpanded) {
      handleClear();
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mb-6">
      {/* 标题栏 - 可点击展开/收起 */}
      <button
        onClick={toggleExpand}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <SparklesIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          <div className="text-left">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              AI 智能识图更新收益
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              上传招商银行或支付宝的收益截图，自动识别并更新收益数据
            </p>
          </div>
        </div>
        <div className="text-gray-400">
          {isExpanded ? '收起 ▲' : '展开 ▼'}
        </div>
      </button>

      {/* 展开内容 */}
      {isExpanded && (
        <div className="px-6 pb-6 border-t border-gray-200 dark:border-gray-700">
          <div className="mt-4 space-y-4">
            {/* 上传区域 */}
            {!selectedFile && (
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-purple-500 dark:hover:border-purple-400 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="screenshot-upload"
                />
                <label
                  htmlFor="screenshot-upload"
                  className="cursor-pointer flex flex-col items-center space-y-3"
                >
                  <PhotoIcon className="h-12 w-12 text-gray-400" />
                  <div>
                    <span className="text-purple-600 dark:text-purple-400 font-medium">
                      点击上传图片
                    </span>
                    <span className="text-gray-500 dark:text-gray-400"> 或拖拽到此处</span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    支持 PNG, JPG, JPEG 格式，最大 10MB
                  </p>
                </label>
              </div>
            )}

            {/* 预览和分析区域 */}
            {selectedFile && (
              <div className="space-y-4">
                {/* 图片预览 */}
                <div className="relative">
                  <img
                    src={previewUrl || ''}
                    alt="预览"
                    className="w-full max-h-96 object-contain rounded-lg border border-gray-200 dark:border-gray-700"
                  />
                  <button
                    onClick={handleClear}
                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                {/* 操作按钮 */}
                <div className="flex space-x-3">
                  <button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="flex-1 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                  >
                    {isAnalyzing ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>AI 分析中...</span>
                      </>
                    ) : (
                      <>
                        <SparklesIcon className="h-5 w-5" />
                        <span>开始 AI 识别</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleClear}
                    disabled={isAnalyzing}
                    className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    重新上传
                  </button>
                </div>

                {/* 错误提示 */}
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                  </div>
                )}

                {/* 分析结果 */}
                {analysisResults && analysisResults.length > 0 && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <h4 className="text-green-800 dark:text-green-300 font-semibold mb-3 flex items-center">
                      <SparklesIcon className="h-5 w-5 mr-2" />
                      识别成功！已自动更新以下基金收益：
                    </h4>
                    <div className="space-y-2">
                      {analysisResults.map((result, index) => (
                        <div
                          key={index}
                          className="bg-white dark:bg-gray-800 rounded p-3 text-sm"
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {result.fundName}
                              {result.fundCode && (
                                <span className="text-gray-500 dark:text-gray-400 ml-2">
                                  ({result.fundCode})
                                </span>
                              )}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              置信度: {(result.confidence * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">昨日收益: </span>
                              <span
                                className={
                                  result.dailyProfitLoss >= 0
                                    ? 'text-green-600 dark:text-green-400'
                                    : 'text-red-600 dark:text-red-400'
                                }
                              >
                                {result.dailyProfitLoss >= 0 ? '+' : ''}
                                ¥{result.dailyProfitLoss.toFixed(2)}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">持仓金额: </span>
                              <span className="text-gray-900 dark:text-white">
                                {result.totalValue ? `¥${result.totalValue.toFixed(2)}` : '-'}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">持仓收益: </span>
                              <span
                                className={
                                  (result.profitLoss || 0) >= 0
                                    ? 'text-green-600 dark:text-green-400'
                                    : 'text-red-600 dark:text-red-400'
                                }
                              >
                                {result.profitLoss !== undefined ? `¥${result.profitLoss.toFixed(2)}` : '-'}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">当日涨跌: </span>
                              <span
                                className={
                                  result.dailyChange >= 0
                                    ? 'text-green-600 dark:text-green-400'
                                    : 'text-red-600 dark:text-red-400'
                                }
                              >
                                {result.dailyChange >= 0 ? '+' : ''}
                                {result.dailyChange.toFixed(2)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 使用说明 */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="text-blue-800 dark:text-blue-300 font-semibold mb-2 text-sm">
                📌 使用说明
              </h4>
              <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                <li>• <strong>纳斯达克基金</strong>：上传招商银行 APP 的基金收益截图</li>
                <li>• <strong>A股基金</strong>：上传支付宝的基金收益截图</li>
                <li>• 确保截图清晰，包含基金名称、收益率和收益金额信息</li>
                <li>• AI 会自动识别并匹配您的持仓基金，更新当日收益数据</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
