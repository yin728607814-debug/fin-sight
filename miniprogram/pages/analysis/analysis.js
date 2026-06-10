const auth = require('../../utils/auth');
const market = require('../../utils/market');

Page({
  data: {
    asset: 'gold',
    meta: market.ASSET_META.gold,
    demoMode: market.isDemoMode(),
    loading: false,
    error: '',
    news: [],
    priceData: [],
    priceLabels: [],
    priceTrendText: '',
    priceTrendClass: 'flat',
    analysis: null,
    sentiment: 50,
    impactText: '中性',
    confidenceText: '0%',
    riskText: '中等',
    latestPriceText: '',
    updatedAt: ''
  },

  onLoad(options) {
    const session = auth.requireLogin();
    if (!session) return;

    const asset = options.asset === 'nasdaq' ? 'nasdaq' : 'gold';
    const meta = market.ASSET_META[asset];
    this.setData({ asset, meta });
    wx.setNavigationBarTitle({ title: meta.title });
    this.loadData();
  },

  onPullDownRefresh() {
    this.loadData().finally(() => wx.stopPullDownRefresh());
  },

  async loadData() {
    if (this.data.loading) return;

    const { asset } = this.data;

    this.setData({ loading: true, error: '' });
    try {
      const newsPromise = market.fetchNews(asset, 20);
      const pricePromise = market.fetchPrices(asset);
      const news = await newsPromise;
      const priceData = await pricePromise;
      const analysis = await market.analyzeOverall(asset, news);

      const sentiment = market.computeSentiment(analysis);
      const decoratedNews = news.map((item) => ({
        ...item,
        publishedText: formatDate(item.publishedAt)
      }));

      const priceTrend = buildPriceTrend(priceData);

      this.setData({
        news: decoratedNews,
        priceData,
        priceLabels: priceTrend.labels,
        priceTrendText: priceTrend.text,
        priceTrendClass: priceTrend.className,
        analysis,
        sentiment,
        impactText: market.impactLabel(analysis.impact),
        confidenceText: `${Math.round((analysis.confidence || 0) * 100)}%`,
        riskText: riskLabel(analysis.riskLevel),
        latestPriceText: latestPriceText(priceData, this.data.meta.unit),
        updatedAt: formatDate(analysis.timestamp, true)
      }, () => {
        wx.nextTick(() => this.drawPriceChart(priceData));
      });
    } catch (error) {
      this.setData({ error: error.message || '加载失败，请稍后重试' });
    } finally {
      this.setData({ loading: false });
    }
  },

  goHome() {
    wx.navigateBack({
      fail() {
        wx.reLaunch({ url: '/pages/home/home' });
      }
    });
  },

  openNews(event) {
    const url = event.currentTarget.dataset.url;
    if (!url) return;

    wx.setClipboardData({
      data: url,
      success() {
        wx.showToast({ title: '链接已复制', icon: 'success' });
      }
    });
  },

  drawPriceChart(priceData) {
    if (!priceData || priceData.length === 0) return;

    wx.createSelectorQuery()
      .in(this)
      .select('#priceChart')
      .fields({ node: true, size: true })
      .exec((results) => {
        const canvasInfo = results && results[0];
        if (!canvasInfo || !canvasInfo.node || !canvasInfo.width || !canvasInfo.height) {
          setTimeout(() => this.drawPriceChart(priceData), 60);
          return;
        }
        drawPriceChart(canvasInfo, priceData, this.data.asset);
      });
  }
});

function buildPriceTrend(priceData) {
  if (!priceData || priceData.length === 0) {
    return { labels: [], text: '', className: 'flat' };
  }

  const first = Number(priceData[0].close || 0);
  const last = Number(priceData[priceData.length - 1].close || 0);
  const change = first ? ((last - first) / first) * 100 : 0;
  const className = change > 0 ? 'positive' : change < 0 ? 'negative' : 'flat';
  const sign = change > 0 ? '+' : '';

  return {
    labels: priceData.map((item) => shortDate(item.date)),
    text: `${sign}${change.toFixed(2)}%`,
    className
  };
}

function drawPriceChart(canvasInfo, priceData, asset) {
  const color = asset === 'gold' ? '#ebc474' : '#65d7ff';
  const colorFade = asset === 'gold' ? 'rgba(235, 196, 116, 0.02)' : 'rgba(101, 215, 255, 0.02)';
  const colorFill = asset === 'gold' ? 'rgba(235, 196, 116, 0.18)' : 'rgba(101, 215, 255, 0.18)';
  const canvas = canvasInfo.node;
  const width = canvasInfo.width;
  const height = canvasInfo.height;
  const pixelRatio = wx.getWindowInfo ? wx.getWindowInfo().pixelRatio : wx.getSystemInfoSync().pixelRatio;
  const ctx = canvas.getContext('2d');
  canvas.width = width * pixelRatio;
  canvas.height = height * pixelRatio;
  ctx.scale(pixelRatio, pixelRatio);
  const closes = priceData.map((item) => Number(item.close || 0));
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const span = Math.max(1, max - min);
  const padding = { top: 16, right: 12, bottom: 10, left: 12 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const spacing = priceData.length > 1 ? chartWidth / (priceData.length - 1) : 0;
  const points = closes.map((close, index) => ({
    x: padding.left + spacing * index,
    y: padding.top + ((max - close) / span) * chartHeight
  }));

  ctx.lineWidth = 1;
  ctx.strokeStyle = '#182536';
  [0, 0.5, 1].forEach((ratio) => {
    const y = padding.top + chartHeight * ratio;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();
  });

  if (points.length === 1) {
    points[0].y = padding.top + chartHeight / 2;
  }

  ctx.beginPath();
  ctx.moveTo(points[0].x, height - padding.bottom);
  ctx.lineTo(points[0].x, points[0].y);
  traceCurve(ctx, points);
  ctx.lineTo(points[points.length - 1].x, height - padding.bottom);
  ctx.closePath();
  const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
  gradient.addColorStop(0, colorFill);
  gradient.addColorStop(1, colorFade);
  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  traceCurve(ctx, points);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();

  points.forEach((point, index) => {
    ctx.beginPath();
    ctx.arc(point.x, point.y, index === points.length - 1 ? 4 : 3, 0, Math.PI * 2);
    ctx.fillStyle = '#101724';
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
  });
}

function traceCurve(ctx, points) {
  if (points.length < 2) return;

  points.forEach((point, index) => {
    if (index === 0) return;
    const previous = points[index - 1];
    const midpointX = (previous.x + point.x) / 2;
    const midpointY = (previous.y + point.y) / 2;
    ctx.quadraticCurveTo(previous.x, previous.y, midpointX, midpointY);
    if (index === points.length - 1) {
      ctx.quadraticCurveTo(point.x, point.y, point.x, point.y);
    }
  });
}

function latestPriceText(priceData, unit) {
  if (!priceData || priceData.length === 0) return '';

  const latest = priceData[priceData.length - 1];
  const close = Number(latest.close || 0);
  const changePercent = Number(latest.changePercent || 0);
  const sign = changePercent > 0 ? '+' : '';
  return `${close.toFixed(2)} ${unit} ${sign}${changePercent.toFixed(2)}%`;
}

function riskLabel(risk) {
  return {
    low: '低',
    medium: '中等',
    high: '高'
  }[risk] || '中等';
}

function shortDate(value) {
  if (!value) return '';
  const text = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(5, 10);
  return text.slice(0, 5);
}

function formatDate(value, withTime) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);

  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  if (!withTime) return `${month}-${day}`;

  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${month}-${day} ${hour}:${minute}`;
}
