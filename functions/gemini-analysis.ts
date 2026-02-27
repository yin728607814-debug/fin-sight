/**
 * Cloudflare Pages Function: Gemini AI 分析代理
 */

interface Env {
  VITE_GEMINI_API_KEY?: string;
  GEMINI_API_KEY?: string;
}

export async function onRequest(context: { request: Request; env: Env }) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (context.request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (context.request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: corsHeaders
    });
  }

  try {
    const apiKey = context.env.VITE_GEMINI_API_KEY || context.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return new Response(JSON.stringify({ 
        error: 'API key not configured',
        debug: {
          hasViteKey: !!context.env.VITE_GEMINI_API_KEY,
          hasKey: !!context.env.GEMINI_API_KEY
        }
      }), {
        status: 500,
        headers: corsHeaders
      });
    }

    const body = await context.request.json();
    const { prompt, temperature = 0.7, maxOutputTokens = 2048, images } = body;

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // 使用 gemini-3-pro-preview 模型（Gemini 3 Pro）
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-preview:generateContent?key=${apiKey}`;
    
    // 构建请求内容
    const parts: any[] = [{ text: prompt }];
    
    // 如果有图片，添加到请求中
    if (images && Array.isArray(images) && images.length > 0) {
      images.forEach((imageBase64: string) => {
        // 提取 base64 数据（移除 data:image/xxx;base64, 前缀）
        const base64Data = imageBase64.split(',')[1] || imageBase64;
        const mimeType = imageBase64.match(/data:(image\/[^;]+);/)?.[1] || 'image/jpeg';
        
        parts.push({
          inline_data: {
            mime_type: mimeType,
            data: base64Data
          }
        });
      });
    }
    
    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { temperature, maxOutputTokens }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Gemini API error',
        details: data,
        status: response.status
      }), {
        status: response.status,
        headers: corsHeaders
      });
    }

    const responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    return new Response(JSON.stringify({
      success: true,
      data: responseText || data
    }), {
      status: 200,
      headers: corsHeaders
    });

  } catch (error: any) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}
