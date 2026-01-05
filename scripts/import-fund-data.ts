/**
 * 导入基金数据脚本
 * 从 NEW_TZZH.txt 导入基金配置和持仓数据到 Supabase
 */

import { FundConfigSupabaseService } from '../services/fundConfigSupabaseService';
import { PositionService } from '../services/positionService';
import { UserService } from '../services/userService';
import { CreatePositionInput } from '../types/database';

// 解析 NEW_TZZH.txt 数据
const rawData = `
摩根纳斯达克100指数(QDII)人民币A ｜51114.10｜-335.90
建信纳斯达克100指数QDII A ｜35763.94｜-536.06
南方纳斯达克100指数发起(QDII) A｜31602.65｜252.65
易方达全球成长精选混合人民币A类｜21387.06｜387.06
易方达全球成长精选混合人民币C类｜20374.38｜374.38
华安纳斯达克100ETF联接(QDII) A｜13822.91｜-7.09
华安纳斯达克100ETF联接(QDII) C ｜12195.99｜-64.01
嘉实纳斯达克100联接(QDII)C人民币｜11538.04｜-261.96
广发纳斯达克100ETF联接(QDII) A｜10065.86｜245.86
南方纳斯达克100指数发起(QDII) C｜10062.90｜-87.10
大成纳斯达克100ETF联接(QDII)A｜4045.87｜45.87
华宝纳斯达克精选股票发起式(QDII) A｜3667.90｜-82.10
景顺长城纳斯达克科技ETF联接A｜3487.57｜-12.43
景顺长城纳斯达克科技ETF联接E｜3096.49｜-3.51
景顺长城纳斯达克科技ETF联接C｜2407.31｜7.31
博时标普500ETF联接(QDII)A｜1958.57｜58.57
博时纳斯达克100A人名币｜1660.16|60.16
华泰博瑞纳斯达克100ETF联接基金(QDII) A|1620.34|20.34
华宝纳斯达克精选股票发起式(QDII) C|1296.62|-3.38
南方纳斯达克100指数发起(QDII) I|30034.16|34.15
`;

interface FundData {
  name: string;
  investmentAmount: number;
  profitLoss: number;
}

/**
 * 解析基金数据
 */
function parseFundData(): FundData[] {
  const lines = rawData.trim().split('\n').filter(line => line.trim());
  const funds: FundData[] = [];

  for (const line of lines) {
    // 支持 ｜ 和 | 两种分隔符
    const parts = line.split(/[｜|]/).map(p => p.trim());
    
    if (parts.length === 3) {
      const name = parts[0];
      const investmentAmount = parseFloat(parts[1]);
      const profitLoss = parseFloat(parts[2]);

      if (name && !isNaN(investmentAmount) && !isNaN(profitLoss)) {
        funds.push({
          name,
          investmentAmount,
          profitLoss
        });
      }
    }
  }

  return funds;
}

/**
 * 导入基金数据
 */
export async function importFundData(): Promise<{
  fundConfigsCreated: number;
  positionsCreated: number;
  errors: string[];
}> {
  const userId = UserService.getUserId();
  const fundConfigService = new FundConfigSupabaseService(userId);
  const positionService = new PositionService(userId);
  
  const funds = parseFundData();
  const errors: string[] = [];
  let fundConfigsCreated = 0;
  let positionsCreated = 0;

  console.log(`📊 准备导入 ${funds.length} 条基金数据...`);

  try {
    // 1. 批量创建基金配置
    console.log('📝 创建基金配置...');
    const fundNames = funds.map(f => ({ name: f.name }));
    const createdConfigs = await fundConfigService.batchCreateFundConfigs(fundNames);
    fundConfigsCreated = createdConfigs.length;
    console.log(`✅ 创建了 ${fundConfigsCreated} 个基金配置`);

    // 2. 创建持仓记录
    console.log('💰 创建持仓记录...');
    for (const fund of funds) {
      try {
        const positionInput: CreatePositionInput = {
          asset_type: 'nasdaq',
          fund_name: fund.name,
          investment_amount: fund.investmentAmount,
          profit_loss: fund.profitLoss
        };

        await positionService.createPosition(positionInput);
        positionsCreated++;
        console.log(`  ✓ ${fund.name}`);
      } catch (error) {
        const errorMsg = `创建持仓失败 [${fund.name}]: ${error instanceof Error ? error.message : '未知错误'}`;
        errors.push(errorMsg);
        console.error(`  ✗ ${errorMsg}`);
      }
    }

    console.log(`\n🎉 导入完成！`);
    console.log(`  - 基金配置: ${fundConfigsCreated} 个`);
    console.log(`  - 持仓记录: ${positionsCreated} 个`);
    if (errors.length > 0) {
      console.log(`  - 错误: ${errors.length} 个`);
    }

  } catch (error) {
    const errorMsg = `导入失败: ${error instanceof Error ? error.message : '未知错误'}`;
    errors.push(errorMsg);
    console.error(`❌ ${errorMsg}`);
  }

  return {
    fundConfigsCreated,
    positionsCreated,
    errors
  };
}

// 如果直接运行此脚本
if (require.main === module) {
  importFundData()
    .then(result => {
      console.log('\n导入结果:', result);
      process.exit(result.errors.length > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('导入失败:', error);
      process.exit(1);
    });
}
