/**
 * 投资组合AI分析组件
 * 基于持仓结构和已分析的新闻数据，提供AI投资建议
 */

import React, { useState } from 'react';
import { Portfolio } from '../services/portfolioService';
import { NewsAnalysis, OverallMarketAnalysis } from '../types';
import { analysisService } from '../services/analysisService';

interface PortfolioAIAnalysisProps {
  portfolio: Portfolio;
  goldAnalysis: NewsAnalysis[];
  nasdaqAnalysis: NewsAnalysis[];
  astockAnalysis: NewsAnalysis[];
  goldOverallAnalysis: OverallMarketAnalysis | null;
  nasdaqOverallAnalysis: OverallMarketAnalysis | null;
  astockOverallAnalysis: OverallMarketAnalysis | null;
}

interface AIAnalysisResult {
  summary: string;
  positionAnalysis: {
    gold: string;
    nasdaq: string;
    astock: string;
  };
  recommendations: string[];
  riskAssessment: string;
  adjustmentSuggestions: string[];
}

export const PortfolioAIAnalysis: React.FC<PortfolioAIAnalysisProps> = ({
  portfolio,
  goldAnalysis,
  nasdaqAnalysis,
  astockAnalysis,
  goldOverallAnalysis,
  nasdaqOverallAnalysis,
  astockOverallAnalysis
}) => {
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(true); // 默认折叠

  /**
   * 计算持仓比例（基于总资产190万）
   */
  const calculatePositionRatios = () => {
    const goldPositions = portfolio.positions.filter(p => p.assetType === 'gold');
    const nasdaqPositions = portfolio.positions.filter(p => p.assetType === 'nasdaq');
    const astockPositions = portfolio.positions.filter(p => p.assetType === 'astock');

    const goldInvestment = goldPositions.reduce((sum, p) => sum + p.investmentAmount, 0);
    const nasdaqInvestment = nasdaqPositions.reduce((sum, p) => sum + p.investmentAmount, 0);
    const astockInvestment = astockPositions.reduce((sum, p) => sum + p.investmentAmount, 0);

    // 总资产固定为190万
    const totalAssets = 1900000;

    return {
      gold: {
        amount: goldInvestment,
        ratio: totalAssets > 0 ? (goldInvestment / totalAssets) * 100 : 0,
        count: goldPositions.length,
        profitLoss: goldPositions.reduce((sum, p) => sum + (p.profitLoss || 0), 0)
      },
      nasdaq: {
        amount: nasdaqInvestment,
        ratio: totalAssets > 0 ? (nasdaqInvestment / totalAssets) * 100 : 0,
        count: nasdaqPositions.length,
        profitLoss: nasdaqPositions.reduce((sum, p) => sum + (p.profitLoss || 0), 0)
      },
      astock: {
        amount: astockInvestment,
        ratio: totalAssets > 0 ? (astockInvestment / totalAssets) * 100 : 0,
        count: astockPositions.length,
        profitLoss: astockPositions.reduce((sum, p) => sum + (p.profitLoss || 0), 0)
      }
    };
  };

  /**
   * 执行AI分析
   */
  const performAnalysis = async () => {
    setLoading(true);
    setError(null);

    try {
      const ratios = calculatePositionRatios();

      // 构建分析提示词
      const prompt = buildAnalysisPrompt(
        portfolio, 
        ratios, 
        goldAnalysis, 
        nasdaqAnalysis, 
        astockAnalysis,
        goldOverallAnalysis,
        nasdaqOverallAnalysis,
        astockOverallAnalysis
      );

      // 调用Gemini API
      const response = await analysisService.makeGeminiRequest({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096
        }
      });

      const responseText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!responseText) {
        throw new Error('AI分析返回空响应');
      }

      // 解析响应
      const parsedAnalysis = parseAnalysisResponse(responseText);
      setAnalysis(parsedAnalysis);

    } catch (err) {
      console.error('AI分析失败:', err);
      setError(err instanceof Error ? err.message : '分析失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 构建分析提示词
   */
  const buildAnalysisPrompt = (
    portfolio: Portfolio,
    ratios: ReturnType<typeof calculatePositionRatios>,
    goldAnalysis: NewsAnalysis[],
    nasdaqAnalysis: NewsAnalysis[],
    astockAnalysis: NewsAnalysis[],
    goldOverallAnalysis: OverallMarketAnalysis | null,
    nasdaqOverallAnalysis: OverallMarketAnalysis | null,
    astockOverallAnalysis: OverallMarketAnalysis | null
  ): string => {
    // 汇总黄金市场分析
    const goldMarketSummary = goldOverallAnalysis 
      ? `预测趋势：${goldOverallAnalysis.predictedTrend}\n风险等级：${goldOverallAnalysis.riskLevel}\n关键因素：${goldOverallAnalysis.keyFactors.join('、')}\n投资建议：${goldOverallAnalysis.investmentAdvice}\n综合摘要：${goldOverallAnalysis.summary}`
      : '暂无整体分析';

    const goldNewsSummary = goldAnalysis.length > 0
      ? goldAnalysis.slice(0, 5).map((a, index) => 
          `- 新闻${index + 1}\n  影响：${a.impact === 'positive' ? '利好' : a.impact === 'negative' ? '利空' : '中性'} (置信度${(a.confidence * 100).toFixed(0)}%)\n  分析：${a.summary}\n  关键点：${a.keyPoints.join('、')}`
        ).join('\n\n')
      : '暂无新闻分析';

    // 汇总纳斯达克市场分析
    const nasdaqMarketSummary = nasdaqOverallAnalysis
      ? `预测趋势：${nasdaqOverallAnalysis.predictedTrend}\n风险等级：${nasdaqOverallAnalysis.riskLevel}\n关键因素：${nasdaqOverallAnalysis.keyFactors.join('、')}\n投资建议：${nasdaqOverallAnalysis.investmentAdvice}\n综合摘要：${nasdaqOverallAnalysis.summary}`
      : '暂无整体分析';

    const nasdaqNewsSummary = nasdaqAnalysis.length > 0
      ? nasdaqAnalysis.slice(0, 5).map((a, index) => 
          `- 新闻${index + 1}\n  影响：${a.impact === 'positive' ? '利好' : a.impact === 'negative' ? '利空' : '中性'} (置信度${(a.confidence * 100).toFixed(0)}%)\n  分析：${a.summary}\n  关键点：${a.keyPoints.join('、')}`
        ).join('\n\n')
      : '暂无新闻分析';

    // 汇总A股市场分析
    const astockMarketSummary = astockOverallAnalysis
      ? `预测趋势：${astockOverallAnalysis.predictedTrend}\n风险等级：${astockOverallAnalysis.riskLevel}\n关键因素：${astockOverallAnalysis.keyFactors.join('、')}\n投资建议：${astockOverallAnalysis.investmentAdvice}\n综合摘要：${astockOverallAnalysis.summary}`
      : '暂无整体分析';

    const astockNewsSummary = astockAnalysis.length > 0
      ? astockAnalysis.slice(0, 5).map((a, index) => 
          `- 新闻${index + 1}\n  影响：${a.impact === 'positive' ? '利好' : a.impact === 'negative' ? '利空' : '中性'} (置信度${(a.confidence * 100).toFixed(0)}%)\n  分析：${a.summary}\n  关键点：${a.keyPoints.join('、')}`
        ).join('\n\n')
      : '暂无新闻分析';

    return `你是一位专业的投资顾问。请基于以下信息，为用户的投资组合提供专业分析和建议。

## 投资组合概况
- 总资产：¥1,900,000.00（固定）
- 总投资金额：¥${portfolio.totalInvestment.toLocaleString('zh-CN', { maximumFractionDigits: 0 })}
- 当前市值：¥${portfolio.currentValue.toLocaleString('zh-CN', { maximumFractionDigits: 0 })}
- 总盈亏：¥${portfolio.totalProfitLoss.toLocaleString('zh-CN', { maximumFractionDigits: 0 })} (${portfolio.totalProfitLossPercent.toFixed(2)}%)

## 持仓结构（占总资产比例）
### 黄金
- 投资金额：¥${ratios.gold.amount.toLocaleString('zh-CN', { maximumFractionDigits: 0 })}
- 占总资产比例：${ratios.gold.ratio.toFixed(1)}%
- 持仓数量：${ratios.gold.count}个
- 盈亏：¥${ratios.gold.profitLoss.toLocaleString('zh-CN', { maximumFractionDigits: 0 })}

### 纳斯达克100
- 投资金额：¥${ratios.nasdaq.amount.toLocaleString('zh-CN', { maximumFractionDigits: 0 })}
- 占总资产比例：${ratios.nasdaq.ratio.toFixed(1)}%
- 持仓数量：${ratios.nasdaq.count}个
- 盈亏：¥${ratios.nasdaq.profitLoss.toLocaleString('zh-CN', { maximumFractionDigits: 0 })}

### A股基金
- 投资金额：¥${ratios.astock.amount.toLocaleString('zh-CN', { maximumFractionDigits: 0 })}
- 占总资产比例：${ratios.astock.ratio.toFixed(1)}%
- 持仓数量：${ratios.astock.count}个
- 盈亏：¥${ratios.astock.profitLoss.toLocaleString('zh-CN', { maximumFractionDigits: 0 })}

**重要说明**：持仓比例是基于总资产190万计算的，不是基于总投资金额。这意味着还有部分资产（约${((1900000 - portfolio.totalInvestment) / 1900000 * 100).toFixed(1)}%）未投资或以现金形式持有。
## 市场分析（基于AI新闻分析）

### 黄金市场
${goldMarketSummary}

主要新闻分析：
${goldNewsSummary}

### 纳斯达克市场
${nasdaqMarketSummary}

主要新闻分析：
${nasdaqNewsSummary}

### A股市场
${astockMarketSummary}

主要新闻分析：
${astockNewsSummary}

## 分析要求
请提供以下内容（返回JSON格式，不要markdown代码块）：

{
  "summary": "整体投资组合评价，结合持仓结构和市场分析（150-200字）",
  "positionAnalysis": {
    "gold": "黄金持仓分析，结合市场趋势和新闻分析（100-150字）",
    "nasdaq": "纳斯达克持仓分析，结合市场趋势和新闻分析（100-150字）",
    "astock": "A股持仓分析，结合市场趋势和新闻分析（100-150字）"
  },
  "recommendations": [
    "具体建议1（基于市场分析）",
    "具体建议2（基于持仓结构）",
    "具体建议3（基于风险控制）"
  ],
  "riskAssessment": "风险评估和注意事项，结合当前市场环境（100-150字）",
  "adjustmentSuggestions": [
    "调整建议1（如增持/减持某类资产，给出具体理由）",
    "调整建议2（如调整比例，给出目标比例）",
    "调整建议3（如分散风险，给出具体方案）"
  ]
}

注意：
1. 充分利用已有的市场分析和新闻分析结果
2. 建议要具体、可操作，并说明理由
3. 考虑资产配置的合理性和风险分散
4. 结合市场趋势给出前瞻性建议
5. 语言要专业但易懂`;
  };

  /**
   * 解析AI响应
   */
  const parseAnalysisResponse = (responseText: string): AIAnalysisResult => {
    try {
      // 移除可能的markdown代码块标记
      const cleanedText = responseText
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim();

      // 提取JSON
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('无法从响应中提取JSON');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        summary: parsed.summary || '分析完成',
        positionAnalysis: {
          gold: parsed.positionAnalysis?.gold || '暂无分析',
          nasdaq: parsed.positionAnalysis?.nasdaq || '暂无分析',
          astock: parsed.positionAnalysis?.astock || '暂无分析'
        },
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
        riskAssessment: parsed.riskAssessment || '暂无风险评估',
        adjustmentSuggestions: Array.isArray(parsed.adjustmentSuggestions) ? parsed.adjustmentSuggestions : []
      };
    } catch (error) {
      console.error('解析AI响应失败:', error);
      throw new Error('解析分析结果失败');
    }
  };

  const ratios = calculatePositionRatios();

  return (
    <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/20 overflow-hidden">
      {/* 头部 - 可点击折叠 */}
      <div 
        className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center flex-1">
          <svg className="h-5 w-5 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
              AI 投资组合分析
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              基于持仓结构和市场新闻的智能分析
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {!analysis && !isCollapsed && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                performAnalysis();
              }}
              disabled={loading || portfolio.positions.length === 0}
              className="flex items-center px-4 py-2 bg-purple-600 dark:bg-purple-500 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  分析中...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  开始分析
                </>
              )}
            </button>
          )}
          
          {/* 折叠/展开图标 */}
          <svg 
            className={`h-5 w-5 text-gray-500 transition-transform ${isCollapsed ? '' : 'rotate-180'}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* 内容区域 - 可折叠 */}
      {!isCollapsed && (
        <div className="p-6">
        {/* 错误提示 */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
            <div className="flex items-start">
              <svg className="h-5 w-5 text-red-600 dark:text-red-500 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-300">分析失败</h3>
                <div className="mt-2 text-sm text-red-700 dark:text-red-400">{error}</div>
              </div>
              <button
                onClick={performAnalysis}
                className="ml-3 px-3 py-1.5 text-xs font-medium text-red-800 dark:text-red-300 bg-red-100 dark:bg-red-900/40 rounded hover:bg-red-200 dark:hover:bg-red-900/60 transition-colors"
              >
                重试
              </button>
            </div>
          </div>
        )}

        {/* 持仓概览 */}
        {!analysis && !loading && portfolio.positions.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">当前持仓结构</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
                <div className="text-xs text-yellow-600 dark:text-yellow-400 mb-1">黄金</div>
                <div className="text-lg font-bold text-yellow-700 dark:text-yellow-300">{ratios.gold.ratio.toFixed(1)}%</div>
                <div className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">{ratios.gold.count}个持仓</div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <div className="text-xs text-blue-600 dark:text-blue-400 mb-1">纳斯达克</div>
                <div className="text-lg font-bold text-blue-700 dark:text-blue-300">{ratios.nasdaq.ratio.toFixed(1)}%</div>
                <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">{ratios.nasdaq.count}个持仓</div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                <div className="text-xs text-purple-600 dark:text-purple-400 mb-1">A股</div>
                <div className="text-lg font-bold text-purple-700 dark:text-purple-300">{ratios.astock.ratio.toFixed(1)}%</div>
                <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">{ratios.astock.count}个持仓</div>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center mt-4">
              点击"开始分析"按钮，AI将结合最新市场新闻为您提供专业的投资建议
            </p>
          </div>
        )}

        {/* 空状态 */}
        {!analysis && !loading && portfolio.positions.length === 0 && (
          <div className="text-center py-8">
            <svg className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500 dark:text-gray-400">
              请先添加持仓后再进行AI分析
            </p>
          </div>
        )}

        {/* 分析结果 */}
        {analysis && (
          <div className="space-y-6">
            {/* 重新分析按钮 */}
            <div className="flex justify-end">
              <button
                onClick={performAnalysis}
                disabled={loading}
                className="flex items-center px-3 py-1.5 text-sm text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
              >
                <svg className="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                重新分析
              </button>
            </div>

            {/* 整体评价 */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
              <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-300 mb-2 flex items-center">
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                整体评价
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{analysis.summary}</p>
            </div>

            {/* 分资产分析 */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">分资产分析</h3>
              
              {ratios.gold.count > 0 && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
                  <h4 className="text-sm font-medium text-yellow-900 dark:text-yellow-300 mb-2">🟡 黄金 ({ratios.gold.ratio.toFixed(1)}%)</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{analysis.positionAnalysis.gold}</p>
                </div>
              )}

              {ratios.nasdaq.count > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                  <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">🔵 纳斯达克 ({ratios.nasdaq.ratio.toFixed(1)}%)</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{analysis.positionAnalysis.nasdaq}</p>
                </div>
              )}

              {ratios.astock.count > 0 && (
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                  <h4 className="text-sm font-medium text-purple-900 dark:text-purple-300 mb-2">🟣 A股 ({ratios.astock.ratio.toFixed(1)}%)</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{analysis.positionAnalysis.astock}</p>
                </div>
              )}
            </div>

            {/* 投资建议 */}
            {analysis.recommendations.length > 0 && (
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                <h3 className="text-sm font-semibold text-green-900 dark:text-green-300 mb-3 flex items-center">
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  投资建议
                </h3>
                <ul className="space-y-2">
                  {analysis.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start text-sm text-gray-700 dark:text-gray-300">
                      <span className="inline-block w-5 h-5 rounded-full bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 text-xs flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                        {index + 1}
                      </span>
                      <span className="leading-relaxed">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 风险评估 */}
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
              <h3 className="text-sm font-semibold text-orange-900 dark:text-orange-300 mb-2 flex items-center">
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                风险评估
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{analysis.riskAssessment}</p>
            </div>

            {/* 调整建议 */}
            {analysis.adjustmentSuggestions.length > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-3 flex items-center">
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                  调整建议
                </h3>
                <ul className="space-y-2">
                  {analysis.adjustmentSuggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start text-sm text-gray-700 dark:text-gray-300">
                      <svg className="h-4 w-4 text-blue-600 dark:text-blue-400 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <span className="leading-relaxed">{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        </div>
      )}
    </div>
  );
};
