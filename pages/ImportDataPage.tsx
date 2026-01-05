/**
 * 数据导入页面
 * 用于导入 NEW_TZZH.txt 中的基金配置和持仓数据
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { FundConfigSupabaseService } from '../services/fundConfigSupabaseService';
import { PositionService } from '../services/positionService';
import { UserService } from '../services/userService';
import { CreatePositionInput } from '../types/database';

const ImportDataPage: React.FC = () => {
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{
    fundConfigsCreated: number;
    positionsCreated: number;
    errors: string[];
  } | null>(null);

  // 基金数据
  const fundDataText = `摩根纳斯达克100指数(QDII)人民币A ｜51114.10｜-335.90
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
南方纳斯达克100指数发起(QDII) I|30034.16|34.15`;

  /**
   * 解析基金数据
   */
  const parseFundData = () => {
    const lines = fundDataText.trim().split('\n').filter(line => line.trim());
    const funds: Array<{ name: string; investmentAmount: number; profitLoss: number }> = [];

    for (const line of lines) {
      const parts = line.split(/[｜|]/).map(p => p.trim());
      
      if (parts.length === 3) {
        const name = parts[0];
        const investmentAmount = parseFloat(parts[1]);
        const profitLoss = parseFloat(parts[2]);

        if (name && !isNaN(investmentAmount) && !isNaN(profitLoss)) {
          funds.push({ name, investmentAmount, profitLoss });
        }
      }
    }

    return funds;
  };

  /**
   * 执行导入
   */
  const handleImport = async () => {
    setImporting(true);
    setResult(null);

    try {
      const userId = UserService.getUserId();
      const fundConfigService = new FundConfigSupabaseService(userId);
      const positionService = new PositionService(userId);
      
      const funds = parseFundData();
      const errors: string[] = [];
      let fundConfigsCreated = 0;
      let positionsCreated = 0;

      // 1. 批量创建基金配置
      const fundNames = funds.map(f => ({ name: f.name }));
      const createdConfigs = await fundConfigService.batchCreateFundConfigs(fundNames);
      fundConfigsCreated = createdConfigs.length;

      // 2. 创建持仓记录
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
        } catch (error) {
          errors.push(`${fund.name}: ${error instanceof Error ? error.message : '未知错误'}`);
        }
      }

      setResult({
        fundConfigsCreated,
        positionsCreated,
        errors
      });

    } catch (error) {
      setResult({
        fundConfigsCreated: 0,
        positionsCreated: 0,
        errors: [error instanceof Error ? error.message : '导入失败']
      });
    } finally {
      setImporting(false);
    }
  };

  const funds = parseFundData();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* 标题 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">
              导入基金数据
            </h1>
            <Link
              to="/portfolio"
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              返回投资组合
            </Link>
          </div>
          <p className="text-gray-600">
            从 NEW_TZZH.txt 导入基金配置和持仓数据到 Supabase
          </p>
        </div>

        {/* 数据预览 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            数据预览 ({funds.length} 条)
          </h2>
          <div className="max-h-96 overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    基金名称
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    持仓金额
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    持仓收益
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {funds.map((fund, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {fund.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900">
                      ¥{fund.investmentAmount.toFixed(2)}
                    </td>
                    <td className={`px-4 py-3 text-sm text-right font-semibold ${
                      fund.profitLoss >= 0 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {fund.profitLoss >= 0 ? '+' : ''}¥{fund.profitLoss.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 导入按钮 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <button
            onClick={handleImport}
            disabled={importing}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {importing ? '导入中...' : '开始导入'}
          </button>
        </div>

        {/* 导入结果 */}
        {result && (
          <div className={`rounded-lg shadow-sm p-6 ${
            result.errors.length > 0 ? 'bg-yellow-50 border border-yellow-200' : 'bg-green-50 border border-green-200'
          }`}>
            <h2 className="text-xl font-bold mb-4 text-gray-900">
              导入结果
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-700">基金配置创建:</span>
                <span className="font-semibold text-gray-900">{result.fundConfigsCreated} 个</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">持仓记录创建:</span>
                <span className="font-semibold text-gray-900">{result.positionsCreated} 个</span>
              </div>
              {result.errors.length > 0 && (
                <div className="mt-4">
                  <div className="font-semibold text-yellow-800 mb-2">
                    错误 ({result.errors.length}):
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {result.errors.map((error, index) => (
                      <div key={index} className="text-xs text-yellow-700 bg-yellow-100 rounded px-2 py-1">
                        {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {result.errors.length === 0 && (
              <div className="mt-4">
                <Link
                  to="/portfolio"
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  查看投资组合
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportDataPage;
