/**
 * Cloudflare Pages Function: Gemini AI 分析代理
 * 确保 API 密钥不暴露到前端
 */

interface Env {
  GEMINI_API_KEY?: string;
  VITE_GEMINI_API_KEY?: string;
}

// Gemini 模型列表（按优先级排序）
const GEMINI_MODELS = [
  { model: 'gemini-3-pro-preview', version: 'v1beta' },
  { model: 'gemini-3-flash-preview', version: 'v1beta' },
  { model: 'gemini-2.5-pro', version: 'v1' },
  { model: 'gemini-2.5-flash', version: 'v1' },
  { model: 'gemini-2.0-flash', version: 'v1' },
];

/**
 * 调用 Gemini API（带自动降级）
 */
async function callGeminiWithFallback(
  apiKey: string,
  prompt: string,
  temperature: number = 0.7,
  maxOutputTokens: number = 2048
): Promise<string> {
  let lastError: Error | null = null;

  for (let i = 0; i < GEMINI_MODELS.length; i++) {
    const { model, version } = GEMINI_MODELS[i];
    
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: prompt }]
            }],
            generationConfig: {
              temperature,
              maxOutputTokens
            }
          })
        }
      );

      if (!response.ok) {
        const status = response.status;
        // 503 (服务过载)、429 (配额限制) 时尝试下一个模型
        if (status === 503 || status === 429) {
          console.log(`⚠️ ${model} 不可用 (${status})，尝试下一个模型...`);
          
          // 如果不是最后一个模型，等待3秒后再尝试下一个
          if (i < GEMINI_MODELS.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 3000));
          }
          continue;
        }
        
        throw new Error(`API request failed: ${status}`);
      }

      const data = await response.json();
      const responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (responseText) {
        if (model !== GEMINI_MODELS[0].model) {
          console.log(`ℹ️ 使用备用模型: ${model} (${version})`);
        }
        return responseText;
      }
    } catch (error: any) {
      lastError = error;
      console.error(`❌ ${model} 调用失败:`, error.message);
      
      // 如果不是最后一个模型，继续尝试
      if (i < GEMINI_MODELS.length - 1) {
        continue;
      }
    }
  }

  // 所有模型都失败
  throw lastError || new Error('所有 Gemini 模型都不可用');
}

export async function onRequest(context: { request: Request; env: Env }) {
  // 设置 CORS 头
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  // 处理 OPTIONS 预检请求
  if (context.request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  // 只允许 POST 请求
  if (context.request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: corsHeaders
    });
  }

  try {
    // 获取 API 密钥 - 优先使用 VITE_ 前缀
    const apiKey = context.env.VITE_GEMINI_API_KEY || context.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
        status: 500,
        headers: corsHeaders
      });
    }

    // 解析请求体
    const body = await context.request.json();
    const { prompt, temperature = 0.7, maxOutputTokens = 2048 } = body;

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), {
        status: 400,
        headers: corsHeaders
      });
    }

    console.log('📡 开始 Gemini AI 分析');

    // 调用 Gemini API
    const responseText = await callGeminiWithFallback(
      apiKey,
      prompt,
      temperature,
      maxOutputTokens
    );

    console.log('✅ Gemini AI 分析完成');

    return new Response(JSON.stringify({
      success: true,
      data: responseText
    }), {
      status: 200,
      headers: corsHeaders
    });

  } catch (error: any) {
    console.error('❌ Gemini AI 分析失败:', error);

    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Analysis failed'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}
