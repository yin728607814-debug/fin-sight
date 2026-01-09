/**
 * Netlify函数 - 新浪财经股票/指数API代理
 * 获取A股指数（上证指数）真实历史价格数据
 */

const https = require('https');

exports.handler = async (event, _context) => {
  // 处理CORS预检请求
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      },
      body: ''
    };
  }

  try {
    // 获取查询参数
    const { symbol = 'sh000001', range = '5d' } = event.queryStringParameters || {};
    
    console.log('📊 获取新浪财经股票历史数据:', { symbol, range });
    
    // 使用新浪财经历史数据API
    // 格式: https://money.finance.sina.com.cn/quotes_service/api/json_v2.php/CN_MarketData.getKLineData?symbol=sh000001&scale=240&ma=no&datalen=5
    // scale: 5=5分钟, 15=15分钟, 30=30分钟, 60=60分钟, 240=日线
    // datalen: 返回数据条数
    const historyUrl = `https://money.finance.sina.com.cn/quotes_service/api/json_v2.php/CN_MarketData.getKLineData?symbol=${symbol}&scale=240&ma=no&datalen=10`;
    
    console.log('🌐 请求历史数据API:', historyUrl);
    
    return new Promise((resolve, reject) => {
      https.get(historyUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://finance.sina.com.cn/'
        }
      }, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            console.log('✅ 新浪财经历史数据API响应:', data.substring(0, 300));
            
            // 解析JSON数据
            const historyData = JSON.parse(data);
            
            if (!Array.isArray(historyData) || historyData.length === 0) {
              throw new Error('历史数据格式错误或为空');
            }
            
            console.log('📊 解析到历史数据:', historyData.length, '条');
            
            // 转换为标准格式
            const priceData = historyData
              .filter(item => item && item.day) // 过滤无效数据
              .map(item => {
                const open = parseFloat(item.open);
                const high = parseFloat(item.high);
                const low = parseFloat(item.low);
                const close = parseFloat(item.close);
                const volume = parseFloat(item.volume) || 0;
                
                return {
                  date: item.day, // 格式: 2026-01-09
                  open: open.toFixed(2),
                  high: high.toFixed(2),
                  low: low.toFixed(2),
                  close: close.toFixed(2),
                  volume: volume.toString(),
                  change: (close - open).toFixed(2),
                  changePercent: ((close - open) / open * 100).toFixed(2)
                };
              })
              .slice(-5); // 只取最近5天
            
            if (priceData.length === 0) {
              throw new Error('没有有效的历史数据');
            }
            
            // 获取最新数据
            const latestData = priceData[priceData.length - 1];
            
            console.log('✅ 历史数据转换完成:', {
              总条数: priceData.length,
              最新日期: latestData.date,
              最新价格: latestData.close
            });
            
            resolve({
              statusCode: 200,
              headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                symbol: symbol,
                name: '上证指数',
                current: latestData.close,
                open: latestData.open,
                high: latestData.high,
                low: latestData.low,
                prevClose: priceData.length > 1 ? priceData[priceData.length - 2].close : latestData.open,
                change: latestData.change,
                changePercent: latestData.changePercent,
                date: latestData.date,
                time: '15:00:00',
                priceData: priceData
              })
            });
          } catch (parseError) {
            console.error('❌ 解析新浪财经历史数据失败:', parseError);
            console.error('原始数据:', data.substring(0, 500));
            reject({
              statusCode: 500,
              headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                error: '解析历史数据失败',
                message: parseError.message,
                rawData: data.substring(0, 200)
              })
            });
          }
        });
      }).on('error', (error) => {
        console.error('❌ 新浪财经历史数据API请求失败:', error);
        reject({
          statusCode: 500,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            error: '请求历史数据失败',
            message: error.message
          })
        });
      });
    });
  } catch (error) {
    console.error('❌ 新浪财经股票代理失败:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: '获取股票数据失败',
        message: error.message
      })
    };
  }
};
