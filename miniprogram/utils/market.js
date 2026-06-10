const config = require('./config');
const { request } = require('./request');

const ASSET_META = {
  gold: {
    title: '现货黄金',
    subtitle: '战略防守底仓 · XAU / GC=F',
    symbol: 'gold',
    color: '#ebc474',
    unit: 'USD/oz',
    newsPaths: [
      { path: '/eastmoney-gold-proxy', params: {} },
      { path: '/sina-news-proxy', params: { category: 'gold', num: 40 } }
    ]
  },
  nasdaq: {
    title: '纳斯达克100',
    subtitle: '长期定投观察 · NDX',
    symbol: 'nasdaq',
    color: '#65d7ff',
    unit: '点',
    newsPaths: [
      { path: '/eastmoney-news-proxy', params: { category: 'usstock' } },
      { path: '/sina-news-proxy', params: { category: 'nasdaq', num: 40 } }
    ]
  }
};

function configured() {
  return !!config.apiBaseUrl;
}

function isDemoMode() {
  return config.useDemoMarketData === true;
}

function endpoint(path) {
  return `${config.apiBaseUrl.replace(/\/$/, '')}${path}`;
}

function normalizeArticle(article, index, asset) {
  const source = typeof article.source === 'string'
    ? article.source
    : (article.source && article.source.name) || '财经新闻';

  return {
    id: `${asset}_${index}_${hash(article.url || article.title || String(index))}`,
    title: article.title || '未命名新闻',
    content: article.content || article.description || article.summary || article.title || '',
    source,
    publishedAt: article.publishedAt || new Date().toISOString(),
    url: article.url || '',
    relevanceScore: scoreNews(article.title || '', article.description || article.content || '', asset)
  };
}

function hash(input) {
  let value = 0;
  for (let i = 0; i < input.length; i += 1) {
    value = ((value << 5) - value) + input.charCodeAt(i);
    value |= 0;
  }
  return Math.abs(value).toString(36);
}

function scoreNews(title, content, asset) {
  const text = `${title} ${content}`.toLowerCase();
  const keywords = asset === 'gold'
    ? ['黄金', '金价', '贵金属', '美联储', '避险', '美元', '通胀', '降息', 'gold', 'xau']
    : ['纳斯达克', '美股', '科技股', 'ai', '英伟达', '苹果', '微软', '利率', 'nasdaq', 'ndx'];

  const hits = keywords.reduce((count, word) => count + (text.includes(word.toLowerCase()) ? 1 : 0), 0);
  return Math.min(1, hits / 4);
}

function dedupe(news) {
  const seen = {};
  return news.filter((item) => {
    const key = item.url || item.title;
    if (!key || seen[key]) return false;
    seen[key] = true;
    return true;
  });
}

async function fetchNews(asset, limit) {
  const meta = ASSET_META[asset];
  if (isDemoMode() || !configured()) {
    return demoNews(asset).slice(0, limit);
  }

  const results = await Promise.all(meta.newsPaths.map((source) => {
    return request({
      url: endpoint(source.path),
      method: 'GET',
      data: source.params,
      timeout: 20000
    }).catch(() => ({ articles: [] }));
  }));

  const all = [];
  results.forEach((result) => {
    const articles = result.articles || [];
    articles.forEach((article) => all.push(article));
  });

  const normalized = dedupe(all.map((article, index) => normalizeArticle(article, index, asset)))
    .sort((a, b) => b.relevanceScore - a.relevanceScore);

  if (normalized.length === 0) {
    return demoNews(asset).slice(0, limit);
  }

  return normalized.slice(0, limit);
}

async function fetchPrices(asset) {
  if (isDemoMode() || !configured()) {
    return demoPrices(asset);
  }

  const path = asset === 'nasdaq' ? '/alpha-vantage-proxy' : '/yahoo-finance-proxy';
  const params = asset === 'nasdaq'
    ? { symbol: 'nasdaq', days: 5, source: 'yfinance', _t: Date.now() }
    : { symbol: 'gold', range: '5d', interval: '1d', _t: Date.now() };

  const data = await request({
    url: endpoint(path),
    method: 'GET',
    data: params,
    timeout: 20000
  }).catch(() => ({ priceData: demoPrices(asset) }));

  return (data.priceData || []).slice(-5);
}

async function analyzeOverall(asset, news) {
  if (isDemoMode()) {
    return demoAnalysis(asset, news);
  }

  if (!configured()) {
    return localAnalysis(asset, news);
  }

  const prompt = buildPrompt(asset, news);
  const data = await request({
    url: endpoint('/gemini-analysis'),
    method: 'POST',
    data: {
      prompt,
      temperature: 0.2,
      maxOutputTokens: 4096
    },
    header: { 'Content-Type': 'application/json' },
    timeout: 120000
  }).catch(() => null);

  if (!data || !data.success || !data.data) {
    return localAnalysis(asset, news);
  }

  const parsed = parseJson(data.data);
  if (!parsed) {
    return localAnalysis(asset, news);
  }

  return {
    assetType: asset,
    impact: normalizeImpact(parsed.impact),
    confidence: clamp(Number(parsed.confidence || 0.68), 0.1, 0.99),
    summary: parsed.summary || 'AI 已完成综合分析，但摘要字段为空。',
    investmentAdvice: parsed.investmentAdvice || parsed.advice || '维持纪律化观察，控制仓位，等待更明确的价格与宏观信号。',
    keyFactors: Array.isArray(parsed.keyFactors) ? parsed.keyFactors.slice(0, 4) : [],
    riskLevel: ['low', 'medium', 'high'].includes(parsed.riskLevel) ? parsed.riskLevel : 'medium',
    timeHorizon: ['short', 'medium', 'long'].includes(parsed.timeHorizon) ? parsed.timeHorizon : 'medium',
    predictedTrend: parsed.predictedTrend || '短期走势仍取决于宏观数据、利率预期和风险偏好变化。',
    analyzedNewsCount: news.length,
    timestamp: new Date().toISOString()
  };
}

function buildPrompt(asset, news) {
  const meta = ASSET_META[asset];
  const newsText = news.slice(0, 20).map((item, index) => {
    const content = (item.content || item.title || '').slice(0, 180);
    return `[${index + 1}] ${item.title}\n${content}`;
  }).join('\n\n');

  const strategy = asset === 'gold'
    ? '用户将黄金视为战略防守底仓，偏保守。除非宏观复苏与纳指趋势/回调条件共同确认，或黄金上涨逻辑明显逆转，否则默认建议保持黄金仓位，避免被单日噪音影响。'
    : '用户对纳斯达克100采取长期定投策略。分析应关注是否继续定投、是否需要调整节奏、估值与宏观风险对长期买入的影响。';

  return `你是专业金融分析师，请基于以下新闻分析${meta.title}。当前日期为${new Date().toLocaleDateString('zh-CN')}。

投资策略背景：${strategy}

新闻：
${newsText}

只返回 JSON，不要 markdown：
{
  "impact": "positive/negative/neutral/mixed",
  "confidence": 0.75,
  "summary": "180-260字综合分析",
  "investmentAdvice": "140-220字投资建议",
  "keyFactors": ["因素1", "因素2", "因素3", "因素4"],
  "riskLevel": "low/medium/high",
  "timeHorizon": "short/medium/long",
  "predictedTrend": "120-200字趋势预测"
}`;
}

function parseJson(text) {
  const cleaned = String(text).replace(/```json/gi, '').replace(/```/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start < 0 || end <= start) return null;

  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch (error) {
    return null;
  }
}

function normalizeImpact(impact) {
  return ['positive', 'negative', 'neutral', 'mixed'].includes(impact) ? impact : 'neutral';
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function localAnalysis(asset, news) {
  const positiveWords = asset === 'gold'
    ? ['避险', '降息', '通胀', '地缘', '美元走弱', '买入', '上涨']
    : ['科技', '增长', 'ai', '盈利', '降息', '上涨', '突破'];
  const negativeWords = asset === 'gold'
    ? ['美元走强', '加息', '风险偏好', '下跌', '获利了结']
    : ['加息', '估值', '回调', '下跌', '衰退', '监管'];

  const text = news.map((item) => `${item.title} ${item.content}`).join(' ').toLowerCase();
  const pos = positiveWords.filter((word) => text.includes(word.toLowerCase())).length;
  const neg = negativeWords.filter((word) => text.includes(word.toLowerCase())).length;
  const impact = pos > neg + 1 ? 'positive' : neg > pos + 1 ? 'negative' : (pos && neg ? 'mixed' : 'neutral');
  const meta = ASSET_META[asset];

  return {
    assetType: asset,
    impact,
    confidence: 0.58,
    summary: `${meta.title}当前新闻信号以${impactLabel(impact)}为主。由于这是小程序本地降级分析，结论主要来自新闻标题与关键词，适合作为快速观察，不应替代完整 AI 分析。`,
    investmentAdvice: asset === 'gold'
      ? '黄金仍按防守底仓处理。若没有看到宏观复苏、避险退潮与黄金趋势转弱同时出现，优先保持仓位，减少短线追涨杀跌。'
      : '纳斯达克继续按长期定投框架观察。若短期波动放大，可降低单次买入金额或分批执行，避免一次性追高。',
    keyFactors: news.slice(0, 4).map((item) => item.title),
    riskLevel: impact === 'negative' ? 'high' : 'medium',
    timeHorizon: 'medium',
    predictedTrend: '短线仍可能受利率预期、美元走势、科技股风险偏好和宏观数据扰动，中期需要等待更多确认信号。',
    analyzedNewsCount: news.length,
    timestamp: new Date().toISOString()
  };
}

function impactLabel(impact) {
  return {
    positive: '偏利好',
    negative: '偏利空',
    neutral: '中性',
    mixed: '分化'
  }[impact] || '中性';
}

function demoNews(asset) {
  if (asset === 'gold') {
    return [
      normalizeArticle({ title: '市场关注利率路径 黄金避险需求维持韧性', description: '美元与实际利率变化继续影响金价表现。', source: '演示数据', publishedAt: '2026-05-26T08:00:00Z' }, 1, asset),
      normalizeArticle({ title: '央行购金节奏平稳 防守配置仍获关注', description: '长期储备需求对贵金属形成支撑。', source: '演示数据', publishedAt: '2026-05-25T08:00:00Z' }, 2, asset),
      normalizeArticle({ title: '地缘风险波动升温 资金偏好短线反复', description: '避险交易与获利回吐交替出现。', source: '演示数据', publishedAt: '2026-05-24T08:00:00Z' }, 3, asset),
      normalizeArticle({ title: '美元指数震荡 黄金进入区间整理阶段', description: '市场等待更明确的宏观信号。', source: '演示数据', publishedAt: '2026-05-23T08:00:00Z' }, 4, asset)
    ];
  }

  return [
    normalizeArticle({ title: '大型科技股盈利预期改善 纳指保持强势震荡', description: 'AI 资本开支与盈利兑现成为市场焦点。', source: '演示数据', publishedAt: '2026-05-26T08:00:00Z' }, 1, asset),
    normalizeArticle({ title: '利率预期影响估值 投资者关注通胀数据', description: '市场等待更多宏观信号确认趋势。', source: '演示数据', publishedAt: '2026-05-25T08:00:00Z' }, 2, asset),
    normalizeArticle({ title: '云计算与芯片需求稳定 科技龙头获得支撑', description: '高质量盈利继续支持长期配置逻辑。', source: '演示数据', publishedAt: '2026-05-24T08:00:00Z' }, 3, asset),
    normalizeArticle({ title: '高位波动放大 定投节奏受到市场关注', description: '分批执行可平衡短期回撤风险。', source: '演示数据', publishedAt: '2026-05-23T08:00:00Z' }, 4, asset)
  ];
}

function demoPrices(asset) {
  const values = asset === 'gold'
    ? [4348, 4371, 4354, 4392, 4384]
    : [21680, 21842, 21734, 22006, 22118];
  return values.map((close, item) => {
    const previous = item === 0 ? close : values[item - 1];
    return {
      date: `05-${String(21 + item).padStart(2, '0')}`,
      open: close - 10,
      high: close + 24,
      low: close - 28,
      close,
      change: close - previous,
      changePercent: previous ? ((close - previous) / previous) * 100 : 0
    };
  });
}

function demoAnalysis(asset, news) {
  if (asset === 'gold') {
    return {
      assetType: asset,
      impact: 'mixed',
      confidence: 0.78,
      summary: '黄金正在利率预期与避险需求之间反复拉锯。美元和实际利率短线偏强，使金价上行节奏受限；但央行购金、地缘风险以及组合防守需求仍在提供底部支撑。当前更像高位震荡整理，而非趋势逻辑反转，适合观察突破方向并保持配置纪律。',
      investmentAdvice: '黄金仍按战略防守底仓处理。现阶段建议维持既有配置比例，不因单日波动频繁调整，也不在情绪升温时追价加仓。后续重点观察实际利率、美元走势与风险事件是否共同转向；若支撑逻辑仍在，继续把黄金作为组合缓冲资产。',
      keyFactors: ['实际利率与美元走势的短期压制', '央行储备需求对价格的中期支撑', '地缘风险对避险情绪的反复推动', '高位整理阶段的波动放大'],
      riskLevel: 'medium',
      timeHorizon: 'medium',
      predictedTrend: '短期价格可能保持宽幅震荡，回撤与修复交替出现。中期若实际利率回落或避险需求再度强化，黄金仍有机会重新测试区间上沿；若美元持续走强，则需要防范整理时间延长。',
      analyzedNewsCount: news.length,
      timestamp: '2026-05-26T08:00:00Z'
    };
  }

  return {
    assetType: asset,
    impact: 'positive',
    confidence: 0.81,
    summary: '纳斯达克100仍由大型科技股盈利与 AI 投资周期支撑，趋势维持偏强。短线估值已不便宜，利率预期变化容易带来更明显的回撤，但龙头公司的现金流与资本开支计划仍为指数提供结构性动力，当前适合用长期视角处理波动。',
    investmentAdvice: '继续遵守长期定投框架，采用固定节奏或回撤分批方式参与，避免在连续上冲后一次性扩大仓位。对于长期资金，重点不是精准择时，而是控制单次投入与保留补仓余量，在波动中持续积累优质科技资产敞口。',
    keyFactors: ['科技龙头盈利与现金流表现', 'AI 基础设施投入的兑现速度', '美债收益率对高估值板块的影响', '高位波动下定投节奏的执行'],
    riskLevel: 'medium',
    timeHorizon: 'long',
    predictedTrend: '短期指数可能在新高附近反复消化估值，波动率仍偏高。中长期若盈利兑现保持稳定，趋势仍偏上行；需要防范利率突然上升或科技投入回报低于预期带来的阶段性回撤。',
    analyzedNewsCount: news.length,
    timestamp: '2026-05-26T08:00:00Z'
  };
}

function computeSentiment(analysis) {
  if (!analysis) return 50;
  const base = {
    positive: 72,
    mixed: 56,
    neutral: 50,
    negative: 34
  }[analysis.impact] || 50;

  const adjustment = Math.round((analysis.confidence - 0.5) * 20);
  return clamp(base + adjustment, 0, 100);
}

module.exports = {
  ASSET_META,
  isDemoMode,
  fetchNews,
  fetchPrices,
  analyzeOverall,
  computeSentiment,
  impactLabel
};
