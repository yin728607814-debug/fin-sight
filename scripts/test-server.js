/**
 * 本地测试服务器 - 模拟 Cloudflare Functions
 * 使用方法：node scripts/test-server.js
 */

import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// 简化的重试函数
async function fetchWithRetry(url, options) {
  try {
    const response = await fetch(url, options);
    if (response.ok) {
      return response;
    }
    // 第一次失败，等待500ms后重试一次
    await new Promise(resolve => setTimeout(resolve, 500));
    return await fetch(url, options);
  } catch (error) {
    // 网络错误，等待500ms后重试一次
    await new Promise(resolve => setTimeout(resolve, 500));
    return await fetch(url, options);
  }
}

// 新浪新闻代理
app.get('/sina-news-proxy', async (req, res) => {
  try {
    const category = req.query.category || 'finance';
    const num = parseInt(req.query.num || '50');

    const categoryConfig = {
      'finance': { pageid: '153', lid: '2509', name: '财经要闻' },
      'stock': { pageid: '153', lid: '2509', name: '财经要闻' },
      'usstock': { pageid: '153', lid: '2509', name: '财经要闻' },
      'nasdaq': { pageid: '153', lid: '2509', name: '财经要闻' },
      'gold': { pageid: '153', lid: '2509', name: '财经要闻' }
    };

    const config = categoryConfig[category] || categoryConfig['finance'];

    console.log(`📰 新浪财经新闻: ${config.name}, 请求 ${num} 条`);

    const allArticles = [];
    const perPage = 50;
    const pages = Math.ceil(num / perPage);

    // 并行请求前3页
    const firstBatchPages = Math.min(pages, 3);
    const firstBatchPromises = [];

    console.log(`⚡ 并行请求前 ${firstBatchPages} 页...`);

    for (let page = 1; page <= firstBatchPages; page++) {
      const apiUrl = `https://feed.mix.sina.com.cn/api/roll/get?pageid=${config.pageid}&lid=${config.lid}&k=&num=${perPage}&page=${page}`;
      
      firstBatchPromises.push(
        fetchWithRetry(apiUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Referer': 'https://finance.sina.com.cn/',
            'Accept': 'application/json'
          }
        })
        .then(response => response.json())
        .then(data => ({ page, data }))
        .catch(error => ({ page, error }))
      );
    }

    // 等待第一批请求完成
    const firstBatchResults = await Promise.all(firstBatchPromises);
    
    for (const result of firstBatchResults.sort((a, b) => a.page - b.page)) {
      if (result.error) {
        console.error(`❌ 第${result.page}页错误:`, result.error.message);
        continue;
      }

      const data = result.data;
      if (data.result?.status?.code !== 0) {
        console.error(`❌ 第${result.page}页失败:`, data.result?.status?.msg);
        continue;
      }

      const pageArticles = data.result?.data || [];
      if (pageArticles.length > 0) {
        console.log(`✅ 第${result.page}页: ${pageArticles.length} 条`);
        allArticles.push(...pageArticles);
      }
    }

    // 如果还需要更多页面，串行请求
    if (pages > firstBatchPages && allArticles.length < num) {
      console.log(`🔄 串行请求剩余 ${pages - firstBatchPages} 页...`);
      
      for (let page = firstBatchPages + 1; page <= pages; page++) {
        const apiUrl = `https://feed.mix.sina.com.cn/api/roll/get?pageid=${config.pageid}&lid=${config.lid}&k=&num=${perPage}&page=${page}`;

        try {
          const response = await fetchWithRetry(apiUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
              'Referer': 'https://finance.sina.com.cn/',
              'Accept': 'application/json'
            }
          });

          const data = await response.json();

          if (data.result?.status?.code !== 0) {
            console.error(`❌ 第${page}页失败:`, data.result?.status?.msg);
            break;
          }

          const pageArticles = data.result?.data || [];
          if (pageArticles.length === 0) {
            break;
          }

          console.log(`✅ 第${page}页: ${pageArticles.length} 条`);
          allArticles.push(...pageArticles);

          if (allArticles.length >= num) break;

          // 减少延迟到100ms
          if (page < pages) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        } catch (error) {
          console.error(`❌ 第${page}页错误:`, error.message);
          break;
        }
      }
    }

    if (allArticles.length === 0) {
      throw new Error('未获取到任何新闻数据');
    }

    console.log(`✅ 总计获取 ${allArticles.length} 条新闻\n`);

    const articles = allArticles.map(item => ({
      title: item.title,
      description: item.intro || item.summary || item.title,
      content: item.intro || item.summary || item.title,
      url: item.url,
      source: {
        id: 'sina-finance',
        name: item.media_name || item.source || '新浪财经'
      },
      author: item.author || null,
      publishedAt: new Date(parseInt(item.ctime || item.intime) * 1000).toISOString(),
      urlToImage: item.img || item.thumb || null,
      image: item.img || item.thumb || null
    }));

    res.json({
      status: 'ok',
      totalResults: articles.length,
      articles
    });

  } catch (error) {
    console.error('❌ 新浪财经错误:', error);

    res.json({
      status: 'error',
      message: error.message || '获取新闻失败',
      articles: []
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 测试服务器运行在 http://localhost:${PORT}`);
  console.log(`📡 新浪新闻代理: http://localhost:${PORT}/sina-news-proxy?num=50`);
  console.log('\n按 Ctrl+C 停止服务器\n');
});
