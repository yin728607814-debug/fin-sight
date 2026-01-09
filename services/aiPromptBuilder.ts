/**
 * AI Prompt 构建器
 * 负责构建智能问答的提示词，结合市场数据和对话上下文
 */

import { AssetType, NewsAnalysis } from '../types';
import { ChatMessage, ChatContext } from './chatService';

/**
 * AI 回答格式接口
 */
export interface AIResponse {
  answer: string;
  reasoning?: string;
  suggestion?: string;
  riskWarning?: string;
}

/**
 * AI Prompt 构建器类
 */
export class AIPromptBuilder {
  /**
   * 构建聊天提示词
   */
  public static buildChatPrompt(
    userQuestion: string,
    context: ChatContext,
    conversationHistory: ChatMessage[] = []
  ): string {
    const assetName = context.assetType === 'gold' 
      ? '现货黄金(XAUUSD)' 
      : context.assetType === 'astock' 
        ? '上证指数(SSE)' 
        : '纳斯达克100指数';
    
    // 构建对话历史部分
    const historyText = this.buildConversationHistory(conversationHistory);
    
    // 构建市场数据部分
    const marketDataText = this.buildMarketData(context, assetName);
    
    // 构建新闻摘要部分
    const newsText = this.buildNewsSummary(context);

    return `你是一位专业的金融投资顾问AI助手。请基于以下信息回答用户问题。

${marketDataText}

${newsText}

${historyText}

用户问题：${userQuestion}

回答要求：
1. 提供简洁明确的回答（150-250字）
2. 基于实际数据进行分析
3. 如果涉及投资建议，必须包含风险提示
4. 使用专业但易懂的语言
5. 如果数据不足以回答问题，请明确说明

请以JSON格式返回（不要使用markdown代码块）：
{
  "answer": "主要回答内容",
  "reasoning": "分析依据（可选）",
  "suggestion": "投资建议（可选，仅在用户询问建议时提供）",
  "riskWarning": "风险提示（如果提供了投资建议，必须包含）"
}`;
  }

  /**
   * 构建对话历史文本
   */
  private static buildConversationHistory(history: ChatMessage[]): string {
    if (history.length === 0) {
      return '对话历史：无（这是新对话）';
    }

    const historyLines = history.slice(-5).map(msg => {
      const role = msg.role === 'user' ? '用户' : 'AI助手';
      return `${role}: ${msg.content.substring(0, 100)}${msg.content.length > 100 ? '...' : ''}`;
    });

    return `对话历史（最近5条）：
${historyLines.join('\n')}`;
  }

  /**
   * 构建市场数据文本
   */
  private static buildMarketData(context: ChatContext, assetName: string): string {
    const parts: string[] = [`当前市场数据（${assetName}）：`];

    if (context.currentPrice !== undefined) {
      parts.push(`- 当前价格: ${context.currentPrice.toLocaleString('en-US', { maximumFractionDigits: 2 })}`);
    }

    if (context.priceChange !== undefined) {
      const direction = context.priceChange >= 0 ? '上涨' : '下跌';
      parts.push(`- 24小时变化: ${direction} ${Math.abs(context.priceChange).toFixed(2)}%`);
    }

    if (context.sentimentScore !== undefined) {
      const sentiment = context.sentimentScore >= 60 ? '乐观' : 
                       context.sentimentScore <= 40 ? '悲观' : '中性';
      parts.push(`- 市场情绪: ${sentiment}（${context.sentimentScore.toFixed(0)}分）`);
    }

    if (context.recentNews && context.recentNews.length > 0) {
      parts.push(`- 最新新闻数量: ${context.recentNews.length}条`);
    }

    return parts.join('\n');
  }

  /**
   * 构建新闻摘要文本
   */
  private static buildNewsSummary(context: ChatContext): string {
    if (!context.recentNews || context.recentNews.length === 0) {
      return '最新新闻：暂无';
    }

    // 只取前3条新闻的标题
    const newsLines = context.recentNews.slice(0, 3).map((news, index) => {
      return `${index + 1}. ${news.title}`;
    });

    return `最新新闻（前3条）：
${newsLines.join('\n')}`;
  }

  /**
   * 解析AI响应
   */
  public static parseAIResponse(responseText: string): AIResponse {
    try {
      // 尝试提取JSON
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        // 如果没有JSON格式，将整个文本作为回答
        return {
          answer: responseText.trim()
        };
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        answer: parsed.answer || responseText,
        reasoning: parsed.reasoning,
        suggestion: parsed.suggestion,
        riskWarning: parsed.riskWarning
      };
    } catch (error) {
      console.error('解析AI响应失败:', error);
      // 解析失败时返回原始文本
      return {
        answer: responseText.trim()
      };
    }
  }

  /**
   * 格式化AI回答为显示文本
   */
  public static formatResponse(response: AIResponse): string {
    const parts: string[] = [];

    // 主要回答
    if (response.answer) {
      parts.push(response.answer);
    }

    // 分析依据
    if (response.reasoning) {
      parts.push(`\n\n📊 **分析依据**\n${response.reasoning}`);
    }

    // 投资建议
    if (response.suggestion) {
      parts.push(`\n\n💡 **投资建议**\n${response.suggestion}`);
    }

    // 风险提示
    if (response.riskWarning) {
      parts.push(`\n\n⚠️ **风险提示**\n${response.riskWarning}`);
    } else if (response.suggestion) {
      // 如果有建议但没有风险提示，添加默认风险提示
      parts.push(`\n\n⚠️ **风险提示**\n投资有风险，入市需谨慎。以上建议仅供参考，不构成投资决策依据。`);
    }

    return parts.join('');
  }

  /**
   * 构建免责声明
   */
  public static getDisclaimer(): string {
    return `⚠️ **免责声明**

本AI助手提供的信息和建议仅供参考，不构成任何投资建议或决策依据。投资者应当根据自身情况独立判断，并承担相应风险。

- 市场有风险，投资需谨慎
- 过往表现不代表未来收益
- 请勿盲目跟从任何投资建议
- 建议咨询专业金融顾问`;
  }

  /**
   * 检查是否需要显示免责声明
   */
  public static shouldShowDisclaimer(response: AIResponse): boolean {
    // 如果包含投资建议或风险提示，需要显示免责声明
    return !!(response.suggestion || response.riskWarning);
  }

  /**
   * 构建快速问题建议
   */
  public static getQuickQuestions(assetType?: AssetType): string[] {
    const commonQuestions = [
      '当前市场趋势如何？',
      '最近有哪些重要新闻影响市场？',
      '现在适合买入吗？',
      '未来走势预测如何？'
    ];

    if (assetType === 'gold') {
      return [
        ...commonQuestions,
        '美元走势对黄金有什么影响？',
        '通胀数据对黄金价格的影响？',
        '地缘政治风险如何影响黄金？'
      ];
    } else if (assetType === 'nasdaq') {
      return [
        ...commonQuestions,
        '科技股的估值是否合理？',
        '美联储政策对纳斯达克的影响？',
        'AI行业发展对指数的推动作用？'
      ];
    }

    return commonQuestions;
  }
}
