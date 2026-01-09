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
    const prompt = `请仔细分析这张基金收益截图，提取以下信息：

1. 识别这是招商银行APP还是支付宝APP的截图
2. 提取所有可见基金的以下信息：
   - 基金名称（完整名称）
   - 基金代码（如果有）
   - 当日涨跌幅（百分比）
   - 当日收益金额（人民币）
   - 持仓市值（如果有）

请以JSON格式返回结果，不要包含markdown代码块标记，直接返回纯JSON：

{
  "source": "cmb" 或 "alipay",
  "funds": [
    {
      "fundName": "基金完整名称",
      "fundCode": "基金代码（可选）",
      "assetType": "nasdaq" 或 "astock",
      "dailyChange": 当日涨跌幅（数字，如 1.23 表示 1.23%）,
      "dailyProfitLoss": 当日收益金额（数字，如 123.45）,
      "totalValue": 持仓市值（可选，数字）,
      "confidence": 识别置信度（0-1之间的数字）
    }
  ]
}

注意：
- 如果是招商银行的截图，通常是纳斯达克相关基金，assetType 设为 "nasdaq"
- 如果是支付宝的截图，通常是A股基金，assetType 设为 "astock"
- 涨跌幅请转换为数字（如 +1.23% 转为 1.23，-0.56% 转为 -0.56）
- 收益金额请转换为数字（如 +¥123.45 转为 123.45，-¥56.78 转为 -56.78）
- 如果无法识别某个字段，请设置为 null
- confidence 表示识别的置信度，范围 0-1`;

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
        // 必须有基金名称和收益数据
        return fund.fundName && 
               typeof fund.dailyChange === 'number' && 
               typeof fund.dailyProfitLoss === 'number';
      })
      .map((fund: any) => ({
        fundName: fund.fundName,
        fundCode: fund.fundCode || undefined,
        assetType: fund.assetType === 'nasdaq' ? 'nasdaq' : 'astock',
        dailyChange: fund.dailyChange,
        dailyProfitLoss: fund.dailyProfitLoss,
        totalValue: fund.totalValue || undefined,
        confidence: fund.confidence || 0.8
      }));

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
