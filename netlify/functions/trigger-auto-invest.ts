/**
 * Netlify Function: 手动触发定投执行
 * 
 * 使用方法：
 * 1. 手动访问：https://your-site.netlify.app/.netlify/functions/trigger-auto-invest?token=YOUR_SECRET
 * 2. 配合 GitHub Actions 定时触发
 * 3. 使用外部 Cron 服务（如 cron-job.org）
 */

import type { Handler, HandlerEvent } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const handler: Handler = async (event: HandlerEvent) => {
  console.log('定投任务开始执行...');
  
  // 简单的认证保护（可选）
  const token = event.queryStringParameters?.token;
  const expectedToken = process.env.AUTO_INVEST_TOKEN;
  
  // 如果设置了 token，则验证
  if (expectedToken && token !== expectedToken) {
    return {
      statusCode: 403,
      body: JSON.stringify({ error: 'Unauthorized' })
    };
  }

  try {
    // 初始化 Supabase 客户端
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase 配置缺失');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 获取今天的日期
    const today = new Date().toISOString().split('T')[0];
    console.log(`检查日期: ${today}`);

    // 查询所有到期的定投计划
    const { data: positions, error: fetchError } = await supabase
      .from('positions')
      .select('*')
      .eq('auto_invest_enabled', true)
      .lte('auto_invest_next_date', today);

    if (fetchError) {
      throw new Error(`查询定投计划失败: ${fetchError.message}`);
    }

    if (!positions || positions.length === 0) {
      console.log('没有需要执行的定投计划');
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: true,
          message: '没有需要执行的定投计划',
          executed: 0
        })
      };
    }

    console.log(`找到 ${positions.length} 个需要执行的定投计划`);

    // 执行每个定投计划
    const results = [];
    for (const position of positions) {
      try {
        // 计算新的持仓金额
        const currentInvestment = parseFloat(position.investment_amount);
        const autoInvestAmount = parseFloat(position.auto_invest_amount);
        
        const newInvestment = currentInvestment + autoInvestAmount;

        // 计算下次执行日期
        const nextDate = calculateNextDate(position.auto_invest_frequency);

        // 更新持仓
        const { error: updateError } = await supabase
          .from('positions')
          .update({
            investment_amount: newInvestment,
            auto_invest_last_executed_date: today,
            auto_invest_next_date: nextDate,
            updated_at: new Date().toISOString()
          })
          .eq('id', position.id);

        if (updateError) {
          throw new Error(`更新持仓失败: ${updateError.message}`);
        }

        const result = {
          fundName: position.fund_name,
          oldInvestment: currentInvestment,
          autoInvestAmount: autoInvestAmount,
          newInvestment: newInvestment,
          nextDate: nextDate,
          success: true
        };

        results.push(result);
        console.log(`定投执行成功: ${position.fund_name} - ¥${currentInvestment} + ¥${autoInvestAmount} = ¥${newInvestment}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '未知错误';
        results.push({
          fundName: position.fund_name,
          success: false,
          error: errorMessage
        });
        console.error(`定投执行失败: ${position.fund_name} - ${errorMessage}`);
      }
    }

    // 统计结果
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    console.log(`定投执行完成: 成功 ${successCount} 个, 失败 ${failCount} 个`);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        message: `定投执行完成: 成功 ${successCount} 个, 失败 ${failCount} 个`,
        executed: successCount,
        failed: failCount,
        results: results
      })
    };
  } catch (error) {
    console.error('定投任务执行失败:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      })
    };
  }
};

/**
 * 计算下次执行日期
 */
function calculateNextDate(frequency: string): string {
  const today = new Date();
  const nextDate = new Date(today);

  switch (frequency) {
    case 'daily':
      nextDate.setDate(today.getDate() + 1);
      break;
    case 'weekly':
      nextDate.setDate(today.getDate() + 7);
      break;
    case 'monthly':
      nextDate.setMonth(today.getMonth() + 1);
      break;
    case 'quarterly':
      nextDate.setMonth(today.getMonth() + 3);
      break;
    default:
      nextDate.setMonth(today.getMonth() + 1);
  }

  return nextDate.toISOString().split('T')[0];
}

export { handler };
