/**
 * Netlify函数 - 新浪财经股票/指数API代理
 * 获取A股指数（上证指数）真实历史价格数据 + 实时数据
 */

const https = require('https');

/**
 * 获取实时行情数据
 */
function fetchRealtimeData(symbol) {
  return new Promise((resolve, reject) => {
    // 新浪实时行情API
    // 格式: https://hq.sinajs.cn/list=s_sh000001
    // s_ 前缀表示简化数据，包含：名称,当前价,涨跌额,涨跌幅,成交量,成交额
    const realtimeUrl = `https://hq.sinajs.cn/list=s_${symbol}`;
    
    console.log('🔴 请求实时行情API:', realtimeUrl);
    
    https.get(realtimeUrl, {
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
          console.log('✅ 实时行情API响应:', data);
          
          // 解析实时数据
          // 格式: var hq_str_s_sh000001="上证指数,3211.9763,8.8163,0.28,1238888,14108666";
          // 字段: 名称,当前价,涨跌额,涨跌幅,成交量(手),成交额(万元)
          const match = data.match(/="([^"]+)"/);
          if (!match) {
            console.log('⚠️ 无法解析实时数据，可能是非交易时间');
            resolve(null);
            return;
          }
          
          const fields = match[1].split(',');
          if (fields.length < 6) {
            console.log('⚠️ 实时数据字段不完整');
            resolve(null);
            return;
          }
          
          const current = parseFloat(fields[1]);
          const change = parseFloat(fields[2]);
          const changePercent = parseFloat(fields[3]);
          
          if (isNaN(current) || current === 0) {
            console.log('⚠️ 实时价格无效，可能是非交易时间');
            resolve(null);
            return;
          }
          
          console.log('✅ 实时数据解析成功:', { current, change, changePercent });
          
          resolve({
            current,
            change,
            changePercent,
            name: fields[0]
          });
        } catch (error) {
          console.error('❌ 解析实时数据失败:', error);
          resolve(null); // 实时数据失败不影响历史数据
        }
      });
    }).on('error', (error) => {
      console.error('❌ 实时行情API请求失败:', error);
      resolve(null); // 实时数据失败不影响历史数据
    });
  });
}

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
    // 获取更多数据以确保有足够的工作日数据
    const historyUrl = `https://money.finance.sina.com.cn/quotes_service/api/json_v2.php/CN_MarketData.getKLineData?symbol=${symbol}&scale=240&ma=no&datalen=15`;
    
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
        
        res.on('end', async () => {
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
              });
            
            // 过滤掉周末数据，只保留工作日
            const weekdayData = priceData.filter(item => {
              const date = new Date(item.date);
              const dayOfWeek = date.getDay();
              return dayOfWeek !== 0 && dayOfWeek !== 6; // 0=周日, 6=周六
            });
            
            // 获取实时数据
            const realtimeData = await fetchRealtimeData(symbol);
            
            // 获取今天的日期
            const today = new Date();
            const todayStr = today.toISOString().split('T')[0]; // 格式: 2026-01-12
            const todayDayOfWeek = today.getDay();
            const isTradingDay = todayDayOfWeek !== 0 && todayDayOfWeek !== 6; // 不是周末
            
            console.log('📅 今天日期:', todayStr, '星期' + ['日','一','二','三','四','五','六'][todayDayOfWeek], '是否交易日:', isTradingDay);
            
            // 检查历史数据中是否已有今天的数据
            const hasTodayData = weekdayData.some(item => item.date === todayStr);
            
            console.log('📊 历史数据中是否有今天:', hasTodayData);
            
            // 如果是交易日且有实时数据且历史数据中没有今天的数据，则添加今天的实时数据
            if (isTradingDay && realtimeData && !hasTodayData) {
              console.log('➕ 添加今天的实时数据到历史数据');
              
              // 获取昨天的收盘价作为今天的开盘价参考
              const yesterdayClose = weekdayData.length > 0 
                ? parseFloat(weekdayData[weekdayData.length - 1].close)
                : realtimeData.current;
              
              // 构造今天的数据点
              const todayData = {
                date: todayStr,
                open: yesterdayClose.toFixed(2), // 使用昨天收盘价作为开盘价（实时API不提供开盘价）
                high: realtimeData.current.toFixed(2), // 使用当前价作为最高价（简化处理）
                low: realtimeData.current.toFixed(2), // 使用当前价作为最低价（简化处理）
                close: realtimeData.current.toFixed(2),
                volume: '0', // 实时API不提供成交量
                change: realtimeData.change.toFixed(2),
                changePercent: realtimeData.changePercent.toFixed(2)
              };
              
              weekdayData.push(todayData);
              
              console.log('✅ 今天的数据已添加:', todayData);
            }
            
            // 只取最近5个工作日
            const recentData = weekdayData.slice(-5);
            
            if (recentData.length === 0) {
              throw new Error('没有有效的历史数据');
            }
            
            // 获取最新数据
            const latestData = recentData[recentData.length - 1];
            
            console.log('✅ 历史数据转换完成:', {
              总条数: recentData.length,
              最新日期: latestData.date,
              最新价格: latestData.close,
              数据日期列表: recentData.map(d => d.date).join(', ')
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
                prevClose: recentData.length > 1 ? recentData[recentData.length - 2].close : latestData.open,
                change: latestData.change,
                changePercent: latestData.changePercent,
                date: latestData.date,
                time: '15:00:00',
                priceData: recentData
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
