/**
 * 图片分析服务
 * 使用 Gemini Vision API 识别收益截图
 */

import axios from 'axios';
import { config } from '../config/env';
import { AnalysisResult } from '../components/ImageUploadAnalyzer';

/**
 * Gemini Vision 模型列表（按优先级排序）
 */
const GEMINI_VISION_MODELS = [
  { model: 'gemini-2.0-flash-exp', version: 'v1beta' },     // 首选：Gemini 2.0 Flash（支持视觉）
  { model: 'gemini-1.5-flash', version: 'v1beta' },         // 备选1：Gemini 1.5 Flash
  { model: 'gemini-1.5-pro', version: 'v1beta' },           // 备选2：Gemini 1.5 Pro
];

/**
 * 将图片文件转换为 Base64
 */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      // 移除 data:image/xxx;base64, 前缀
      const base64Data = base64.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * 调用 Gemini Vision API 分析图片
 */
async function callGeminiVision(
  imageBase64: string,
  mimeType: string,
  prompt: string
): Promise<string> {
  let lastError: Error | null = null;

  for (const { model, version } of GEMINI_VISION_MODELS) {
    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${config.apiKeys.gemini}`,
        {
          contents: [{
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: imageBase64
                }
              }
            ]
          }],
          generationConfig: {
            temperature: 0.1, // 低温度，提高准确性
            maxOutputTokens: 2048
          }
        },
        { timeout: 60000 } // 60秒超时
      );

      const responseText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (responseText) {
        if (model !== GEMINI_VISION_MODELS[0].model) {
          console.log(`ℹ️ 使用备用视觉模型: ${model} (${version})`);
        }
        return responseText;
      }
    } catch (error: any) {
      lastError = error;
      const status = error.response?.status;
      const isTimeout = error.code === 'ECONNABORTED' || error.message?.includes('timeout');
      
      // 503 (服务过载)、429 (配额限制) 或超时时尝试下一个模型
      if (status === 503 || status === 429 || isTimeout) {
        const reason = isTimeout ? '超时' : status;
        console.log(`⚠️ ${model} 不可用 (${reason})，尝试下一个模型...`);
        continue;
      }
      
      // 其他错误直接抛出
      throw error;
    }
  }

  // 所有模型都失败
  throw lastError || new Error('所有 Gemini Vision 模型都不可用');
}

/**
 * 分析收益截图
 */
export async function analyzeIncomeScreenshot(file: File): Promise<AnalysisResult[]> {
  try {
    console.log('📸 开始分析收益截图:', file.name);

    // 转换图片为 Base64
    const imageBase64 = await fileToBase64(file);
    const mimeType = file.type;

    // 构建提示词
    const prompt = `请仔细分析这张基金收益截图，这是一张招商银行或支付宝APP的基金持仓列表。

【重要】截图格式说明：
- 招商银行格式：每个基金显示"基金名称"、"昨日收益"（红色或绿色数字）、"持仓收益"、"持仓金额"
- 支付宝格式：每个基金显示"基金名称"、"日收益"、"持仓收益"、"持仓金额"

请提取所有可见基金的以下信息：
1. 基金名称（完整名称，包括括号内的代码）
2. 基金代码（如果基金名称中有括号，提取括号内的代码）
3. 昨日收益或日收益的金额（红色表示正收益，绿色表示负收益）
4. 根据昨日收益金额和持仓金额计算涨跌幅

【识别规则】：
- 招商银行截图中，"昨日收益"就是我们需要的"当日收益"
- 支付宝截图中，"日收益"就是我们需要的"当日收益"
- 红色数字表示正收益（盈利），绿色数字表示负收益（亏损）
- 基金名称中如果包含"纳斯达克"、"QDII"、"美股"等关键词，assetType 设为 "nasdaq"
- 其他基金 assetType 设为 "astock"

请以JSON格式返回结果，不要包含markdown代码块标记，直接返回纯JSON：

{
  "source": "cmb" 或 "alipay",
  "funds": [
    {
      "fundName": "基金完整名称（不含括号和代码）",
      "fundCode": "基金代码（从括号中提取，如QDII、QDIIA等）",
      "assetType": "nasdaq" 或 "astock",
      "dailyChange": 涨跌幅百分比（数字，根据昨日收益/持仓金额计算，如果昨日收益是35.52，持仓金额是51399.52，则涨跌幅约为0.069%）,
      "dailyProfitLoss": 昨日收益金额（数字，红色为正数，绿色为负数，如 35.52 或 -90.48）,
      "totalValue": 持仓金额（数字，如 51399.52）,
      "confidence": 识别置信度（0-1之间的数字）
    }
  ]
}

【示例】：
如果看到：
- 基金名称：摩根纳斯达克100指数(QDII)人民币A
- 昨日收益：35.52（红色）
- 持仓金额：51,399.52

应该返回：
{
  "fundName": "摩根纳斯达克100指数人民币A",
  "fundCode": "QDII",
  "assetType": "nasdaq",
  "dailyChange": 0.069,
  "dailyProfitLoss": 35.52,
  "totalValue": 51399.52,
  "confidence": 0.95
}

请现在开始识别截图中的所有基金信息。`;

    // 调用 Gemini Vision API
    console.log('🤖 调用 Gemini Vision API...');
    const responseText = await callGeminiVision(imageBase64, mimeType, prompt);
    
    console.log('📝 API 响应:', responseText);

    // 解析 JSON 响应
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('无法从响应中提取JSON数据');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    if (!parsed.funds || !Array.isArray(parsed.funds)) {
      throw new Error('响应格式错误：缺少 funds 数组');
    }

    // 验证和清理数据
    const results: AnalysisResult[] = parsed.funds
      .filter((fund: any) => {
        // 至少要有基金名称
        if (!fund.fundName) {
          console.warn('跳过：缺少基金名称', fund);
          return false;
        }
        
        // 至少要有收益金额
        if (typeof fund.dailyProfitLoss !== 'number') {
          console.warn('跳过：缺少收益金额', fund);
          return false;
        }
        
        return true;
      })
      .map((fund: any) => {
        // 如果没有涨跌幅，尝试从收益金额和持仓金额计算
        let dailyChange = fund.dailyChange;
        if (typeof dailyChange !== 'number' && fund.totalValue && fund.dailyProfitLoss) {
          dailyChange = (fund.dailyProfitLoss / fund.totalValue) * 100;
          console.log(`计算涨跌幅: ${fund.fundName} = ${dailyChange.toFixed(4)}%`);
        }
        
        // 如果还是没有涨跌幅，设为0
        if (typeof dailyChange !== 'number') {
          dailyChange = 0;
          console.warn(`无法计算涨跌幅，设为0: ${fund.fundName}`);
        }
        
        return {
          fundName: fund.fundName.trim(),
          fundCode: fund.fundCode || undefined,
          assetType: fund.assetType === 'nasdaq' ? 'nasdaq' : 'astock',
          dailyChange: dailyChange,
          dailyProfitLoss: fund.dailyProfitLoss,
          totalValue: fund.totalValue || undefined,
          confidence: fund.confidence || 0.8
        };
      });

    console.log('✅ 识别完成，共识别', results.length, '个基金');
    
    if (results.length === 0) {
      throw new Error('未能识别到任何基金信息，请确保截图清晰且包含收益数据');
    }

    return results;

  } catch (error) {
    console.error('❌ 图片分析失败:', error);
    
    if (error instanceof Error) {
      throw new Error(`图片分析失败: ${error.message}`);
    }
    
    throw new Error('图片分析失败，请重试');
  }
}

/**
 * 批量更新基金收益到数据库
 */
export async function batchUpdateFundProfits(
  results: AnalysisResult[],
  updateCallback: (fundName: string, dailyChange: number, dailyProfitLoss: number) => Promise<void>
): Promise<{ success: number; failed: number; errors: string[] }> {
  let success = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const result of results) {
    try {
      await updateCallback(result.fundName, result.dailyChange, result.dailyProfitLoss);
      success++;
      console.log(`✅ 更新成功: ${result.fundName}`);
    } catch (error) {
      failed++;
      const errorMsg = `${result.fundName}: ${error instanceof Error ? error.message : '未知错误'}`;
      errors.push(errorMsg);
      console.error(`❌ 更新失败: ${errorMsg}`);
    }
  }

  return { success, failed, errors };
}
