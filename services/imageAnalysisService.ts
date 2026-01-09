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
    // 转换图片为 Base64
    const imageBase64 = await fileToBase64(file);
    const mimeType = file.type;

    // 构建提示词
    const prompt = `请仔细分析这张基金收益截图，这是一张招商银行或支付宝APP的基金持仓列表。

【重要】截图格式说明：

**招商银行有两种格式：**

**格式1：列表视图（简洁）**
- 第一行：基金名称（如：摩根纳斯达克100指数(QDII)人民币A）
- 第二行左侧：昨日收益（红色为正，绿色为负，如：35.52）
- 第二行右侧：持仓金额（如：51,399.52）
- 第三行左侧：持仓收益（累计总收益，如：-90.48）
- 第三行右侧：持仓金额标签

**格式2：详情视图（详细）**
- 第一行：基金名称
- 第二行：持仓金额（左侧）和当前市值（右侧）
- 第三行：昨日收益（左侧）和当天收益率（右侧）
- 第四行：持仓收益（左侧）和收益率（右侧）

**支付宝格式：**
- 第一行：基金名称（如：长城久嘉创新成长灵活配置混合C）
- 第二行：基金类型标签（基金、进阶理财、定投等）
- 第三行：持仓金额（左侧）、日收益（中间，红色为正/绿色为负）、持仓收益（右侧，红色为正/绿色为负）
- 第四行：占比百分比（左侧）、空白、持仓收益百分比（右侧，如：+10.01%）

请提取所有可见基金的以下信息：
1. 基金名称（完整名称，保留括号）
2. 基金代码（如果有括号则从括号中提取，如 QDII、LOF 等；否则留空）
3. 日收益金额（红色为正，绿色为负）
4. 持仓收益金额（累计总收益，红色为正，绿色为负）
5. 持仓金额（当前市值）
6. 持仓收益率（支付宝第四行右侧的百分比，如：+10.01%）

⚠️ 【关键】基金名称格式规范：
- 使用半角括号 () 而不是全角括号（）
- 纳斯达克基金格式规范：
  * 南方基金：南方纳斯达克100指数发起 (QDII) A （(QDII)前后有空格，A前面有空格）
  * 建信基金：建信纳斯达克100指数QDII A （QDII和A之间有空格）
  * 摩根基金：摩根纳斯达克100指数(QDII)人民币A （括号前后无空格）
  * 华宝基金：华宝纳斯达克精选股票发起式(QDII)A （括号前后无空格）
- A股基金格式规范：
  * 保持原始名称，只需将全角括号转换为半角括号
  * 如：国投瑞银白银期货(LOF)C
  * 注意：汇添富中证科创业50指数增强C（是"科创业"不是"科创创业"）

请以JSON格式返回结果，不要包含markdown代码块标记，直接返回纯JSON：

{
  "source": "alipay",
  "funds": [
    {
      "fundName": "基金名称（使用半角括号）",
      "fundCode": "基金代码（如果有）",
      "assetType": "astock",
      "dailyProfitLoss": 日收益金额（数字，正数或负数）,
      "profitLoss": 持仓收益金额（数字，正数或负数）,
      "profitLossPercent": 持仓收益率（数字，如10.01表示+10.01%）,
      "totalValue": 持仓金额（数字）,
      "confidence": 0.95
    }
  ]
}

【示例1 - 招商银行列表视图（纳斯达克）】：
如果看到：
摩根纳斯达克100指数(QDII)人民币A
昨日收益  35.52          51,399.52
持仓收益  -90.48         持仓金额

应该返回：
{
  "fundName": "摩根纳斯达克100指数(QDII)人民币A",
  "fundCode": "QDII",
  "assetType": "nasdaq",
  "dailyProfitLoss": 35.52,
  "profitLoss": -90.48,
  "totalValue": 51399.52,
  "confidence": 0.95
}

【示例2 - 支付宝格式（A股）】：
如果看到：
长城久嘉创新成长灵活配置混合C
基金  进阶理财  定投
8,881.89        +241.05        +781.89
占比 15.11%                    +9.77%

应该返回：
{
  "fundName": "长城久嘉创新成长灵活配置混合C",
  "fundCode": "",
  "assetType": "astock",
  "dailyProfitLoss": 241.05,
  "profitLoss": 781.89,
  "profitLossPercent": 9.77,
  "totalValue": 8881.89,
  "confidence": 0.95
}
注意：profitLossPercent 是第四行右侧的百分比数值（去掉%号和+/-号）

【示例3 - 支付宝格式（带括号的A股）】：
如果看到：
国投瑞银白银期货（LOF）C
基金  进阶理财  定投
651.25          -24.08         +51.25
占比 1.11%                     +8.54%

应该返回：
{
  "fundName": "国投瑞银白银期货(LOF)C",
  "fundCode": "LOF",
  "assetType": "astock",
  "dailyProfitLoss": -24.08,
  "profitLoss": 51.25,
  "profitLossPercent": 8.54,
  "totalValue": 651.25,
  "confidence": 0.95
}
注意：将全角括号（）改成半角括号 ()，profitLossPercent 是第四行右侧的百分比数值

⚠️ 重要提醒：
- 招商银行有两种视图格式，支付宝有自己的格式，请根据实际截图判断
- 基金名称中包含"纳斯达克"、"QDII"的，assetType 设为 "nasdaq"
- 其他基金 assetType 设为 "astock"
- 必须使用半角括号 () 而不是全角括号（）
- 支付宝格式中：
  * 第三行第一个数字是持仓金额（当前市值）
  * 第三行第二个数字是日收益（带+/-号）
  * 第三行第三个数字是持仓收益（带+/-号）
- 纳斯达克基金的括号和空格格式要严格按照规范

请现在开始识别截图中的所有基金信息。`;

    // 调用 Gemini Vision API
    const responseText = await callGeminiVision(imageBase64, mimeType, prompt);
    
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
        
        // 至少要有昨日收益金额
        if (typeof fund.dailyProfitLoss !== 'number') {
          console.warn('跳过：缺少昨日收益金额', fund);
          return false;
        }
        
        return true;
      })
      .map((fund: any) => {
        // 标准化基金名称格式
        let normalizedName = fund.fundName.trim();
        
        // 1. 将全角括号转换为半角括号
        normalizedName = normalizedName.replace(/（/g, '(').replace(/）/g, ')');
        
        // 2. 处理南方基金：确保 (QDII) 前后有空格，A/C/I 前面有空格
        if (normalizedName.includes('南方纳斯达克')) {
          // 先移除所有空格
          normalizedName = normalizedName.replace(/\s+/g, '');
          
          // 在 (QDII) 前后添加空格
          normalizedName = normalizedName.replace(/\(QDII\)/g, ' (QDII) ');
          
          // 在 A/C/I 前添加空格
          normalizedName = normalizedName.replace(/\(QDII\)\s*([ACI])$/g, '(QDII) $1');
          
          // 清理多余空格
          normalizedName = normalizedName.replace(/\s+/g, ' ').trim();
        }
        
        // 3. 处理建信基金：确保 QDII 和 A 之间有空格
        if (normalizedName.includes('建信纳斯达克')) {
          // 先移除 QDII 后面的所有空格
          normalizedName = normalizedName.replace(/QDII\s*/g, 'QDII');
          
          // QDIIA -> QDII A, QDIIC -> QDII C
          normalizedName = normalizedName.replace(/QDII([ACI])$/g, 'QDII $1');
        }
        
        // 4. 处理华宝基金：确保括号前后无空格
        if (normalizedName.includes('华宝纳斯达克')) {
          // 移除括号前后的所有空格
          normalizedName = normalizedName.replace(/\s*\(QDII\)\s*/g, '(QDII)');
          
          // 移除 A/C/I 前的空格
          normalizedName = normalizedName.replace(/\s+([ACI])$/g, '$1');
        }
        
        // 计算涨跌幅（基于昨日收益和持仓金额）
        let dailyChange = 0;
        if (fund.totalValue && fund.dailyProfitLoss) {
          dailyChange = (fund.dailyProfitLoss / fund.totalValue) * 100;
        }
        
        return {
          fundName: normalizedName,
          fundCode: fund.fundCode || undefined,
          assetType: fund.assetType === 'nasdaq' ? 'nasdaq' : 'astock',
          dailyChange: dailyChange,
          dailyProfitLoss: fund.dailyProfitLoss,
          profitLoss: typeof fund.profitLoss === 'number' ? fund.profitLoss : undefined,
          profitLossPercent: typeof fund.profitLossPercent === 'number' ? fund.profitLossPercent : undefined,
          totalValue: fund.totalValue || undefined,
          confidence: fund.confidence || 0.8
        };
      });

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
    } catch (error) {
      failed++;
      const errorMsg = `${result.fundName}: ${error instanceof Error ? error.message : '未知错误'}`;
      errors.push(errorMsg);
      console.error(`❌ 更新失败: ${errorMsg}`);
    }
  }

  return { success, failed, errors };
}
