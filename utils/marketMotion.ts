export type MarketMotionVariant = 'gold' | 'nasdaq' | 'aStock';

export interface MotionPoint {
  x: number;
  y: number;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const hexToRgba = (hex: string, alpha: number): string => {
  const normalized = hex.replace('#', '');
  const bigint = parseInt(normalized.length === 3
    ? normalized.split('').map((char) => char + char).join('')
    : normalized, 16);
  const red = (bigint >> 16) & 255;
  const green = (bigint >> 8) & 255;
  const blue = bigint & 255;

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
};

const marketWave = (variant: MarketMotionVariant, t: number, time: number, intensity: number) => {
  if (variant === 'gold') {
    const repair = -10 * t;
    const midPullback = 8 * Math.exp(-Math.pow((t - 0.58) / 0.18, 2));
    const wave = Math.sin(t * Math.PI * 2 + time * 0.72) * 1.5 * intensity;
    return repair + midPullback + wave;
  }

  if (variant === 'nasdaq') {
    const trend = -26 * t;
    const platform = 6 * Math.exp(-Math.pow((t - 0.58) / 0.15, 2));
    const lift = -5 * Math.max(0, t - 0.72);
    const wave = Math.sin(t * Math.PI * 3.1 + time * 1.05) * 1.8 * intensity;
    return trend + platform + lift + wave;
  }

  const surge = -14 * Math.exp(-Math.pow((t - 0.22) / 0.18, 2));
  const pullback = 13 * Math.exp(-Math.pow((t - 0.52) / 0.18, 2));
  const rebound = -10 * Math.exp(-Math.pow((t - 0.78) / 0.18, 2));
  const flatten = 3 * Math.max(0, t - 0.82);
  const wave = Math.sin(t * Math.PI * 4.2 + time * 0.9) * 2.3 * intensity;
  return surge + pullback + rebound + flatten + wave;
};

export const getMarketPoints = (
  variant: MarketMotionVariant,
  width: number,
  height: number,
  time: number,
  intensity = 1,
  yOffset = 0,
  phase = 0
): MotionPoint[] => {
  const count = 76;
  const paddingX = Math.max(18, width * 0.055);
  const usableWidth = Math.max(1, width - paddingX * 2);
  const baseY = variant === 'nasdaq' ? height * 0.63 : variant === 'gold' ? height * 0.56 : height * 0.53;
  const amplitude = variant === 'aStock' ? 1.1 : variant === 'nasdaq' ? 0.9 : 0.75;

  return Array.from({ length: count }, (_, index) => {
    const t = index / (count - 1);
    const x = paddingX + usableWidth * t;
    const motion = marketWave(variant, t, time + phase, intensity * amplitude);
    const y = clamp(baseY + motion + yOffset, height * 0.18, height * 0.78);
    return { x, y };
  });
};

export const drawSmoothPath = (ctx: CanvasRenderingContext2D, points: MotionPoint[]) => {
  if (points.length < 2) return;

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  for (let index = 1; index < points.length - 1; index += 1) {
    const current = points[index];
    const next = points[index + 1];
    const midX = (current.x + next.x) / 2;
    const midY = (current.y + next.y) / 2;
    ctx.quadraticCurveTo(current.x, current.y, midX, midY);
  }

  const last = points[points.length - 1];
  ctx.lineTo(last.x, last.y);
};

export const drawRibbon = (
  ctx: CanvasRenderingContext2D,
  upperPoints: MotionPoint[],
  lowerPoints: MotionPoint[]
) => {
  if (upperPoints.length < 2 || lowerPoints.length < 2) return;

  ctx.beginPath();
  ctx.moveTo(upperPoints[0].x, upperPoints[0].y);

  for (let index = 1; index < upperPoints.length - 1; index += 1) {
    const current = upperPoints[index];
    const next = upperPoints[index + 1];
    ctx.quadraticCurveTo(current.x, current.y, (current.x + next.x) / 2, (current.y + next.y) / 2);
  }

  const upperLast = upperPoints[upperPoints.length - 1];
  ctx.lineTo(upperLast.x, upperLast.y);

  for (let index = lowerPoints.length - 1; index > 1; index -= 1) {
    const current = lowerPoints[index];
    const previous = lowerPoints[index - 1];
    ctx.quadraticCurveTo(current.x, current.y, (current.x + previous.x) / 2, (current.y + previous.y) / 2);
  }

  ctx.lineTo(lowerPoints[0].x, lowerPoints[0].y);
  ctx.closePath();
};

export const drawMarketChannel = (
  ctx: CanvasRenderingContext2D,
  points: MotionPoint[],
  variant: MarketMotionVariant,
  width: number,
  primaryColor: string,
  secondaryColor: string,
  intensity: number,
  hover: boolean
) => {
  const channelWidth = variant === 'gold' ? 5.5 : variant === 'nasdaq' ? 7 : 9;
  const breath = (hover ? 1.2 : 1) * intensity;
  const upperPoints = points.map((point, index) => ({
    x: point.x,
    y: point.y - channelWidth - Math.sin(index * 0.1) * breath,
  }));
  const lowerPoints = points.map((point, index) => ({
    x: point.x,
    y: point.y + channelWidth + Math.cos(index * 0.08) * breath,
  }));

  const fillGradient = ctx.createLinearGradient(0, 0, width, 0);
  fillGradient.addColorStop(0, hexToRgba(primaryColor, 0.035));
  fillGradient.addColorStop(0.5, hexToRgba(secondaryColor, hover ? 0.14 : 0.09));
  fillGradient.addColorStop(1, hexToRgba(primaryColor, hover ? 0.11 : 0.07));
  ctx.fillStyle = fillGradient;
  drawRibbon(ctx, upperPoints, lowerPoints);
  ctx.fill();

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 1;
  ctx.strokeStyle = hexToRgba(primaryColor, hover ? 0.18 : 0.12);
  drawSmoothPath(ctx, upperPoints);
  ctx.stroke();
  ctx.strokeStyle = hexToRgba(secondaryColor, hover ? 0.16 : 0.1);
  drawSmoothPath(ctx, lowerPoints);
  ctx.stroke();
  ctx.restore();
};

export const drawTerminalTicks = (
  ctx: CanvasRenderingContext2D,
  variant: MarketMotionVariant,
  width: number,
  height: number,
  color: string
) => {
  const left = Math.max(18, width * 0.055);
  const tickSet = variant === 'gold'
    ? [0.32, 0.52, 0.68]
    : variant === 'nasdaq'
      ? [0.28, 0.42, 0.58, 0.72]
      : [0.24, 0.39, 0.55, 0.7];

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineWidth = 1;
  ctx.strokeStyle = hexToRgba(color, 0.16);
  tickSet.forEach((ratio, index) => {
    const y = height * ratio;
    const length = 10 + (index % 2) * 7;
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(left + length, y);
    ctx.stroke();
  });

  ctx.strokeStyle = hexToRgba(color, 0.11);
  ctx.beginPath();
  ctx.moveTo(width * 0.18, height * 0.78);
  ctx.lineTo(width * 0.3, height * 0.78);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(width * 0.66, height * 0.79);
  ctx.lineTo(width * 0.8, height * 0.79);
  ctx.stroke();
  ctx.restore();
};

const roundedLabel = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) => {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
};

export const drawHudLabels = (
  ctx: CanvasRenderingContext2D,
  variant: MarketMotionVariant,
  width: number,
  height: number,
  time: number,
  color: string,
  hover: boolean
) => {
  const labels = variant === 'gold'
    ? [
        { text: 'SAFE', x: 0.18, y: 0.22 },
        { text: 'DXY', x: 0.44, y: 0.68 },
        { text: 'RATE', x: 0.62, y: 0.24 },
      ]
    : variant === 'nasdaq'
      ? [
          { text: 'AI', x: 0.18, y: 0.62 },
          { text: 'LIQ', x: 0.45, y: 0.28 },
          { text: 'MOM', x: 0.68, y: 0.62 },
        ]
      : [
          { text: 'POLICY', x: 0.16, y: 0.23 },
          { text: 'FLOW', x: 0.48, y: 0.66 },
          { text: 'SENT', x: 0.68, y: 0.27 },
        ];

  ctx.save();
  ctx.font = '700 9px Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.textBaseline = 'middle';
  labels.forEach((label, index) => {
    const drift = Math.sin(time * (variant === 'aStock' ? 0.9 : 0.55) + index * 1.7) * (variant === 'aStock' ? 1.4 : 0.8);
    const textWidth = ctx.measureText(label.text).width;
    const boxWidth = textWidth + 11;
    const boxHeight = 15;
    const x = width * label.x;
    const y = height * label.y + drift;
    const alpha = (hover ? 0.62 : 0.46) + Math.sin(time * 0.8 + index) * (variant === 'aStock' ? 0.07 : 0.04);

    roundedLabel(ctx, x, y, boxWidth, boxHeight, 7);
    ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0.28, alpha * 0.52)})`;
    ctx.fill();
    ctx.strokeStyle = hexToRgba(color, Math.max(0.1, alpha * 0.22));
    ctx.stroke();
    ctx.fillStyle = hexToRgba(color, Math.max(0.28, alpha));
    ctx.fillText(label.text, x + 5.5, y + boxHeight / 2);
  });
  ctx.restore();
};

export const drawScanCursor = (
  ctx: CanvasRenderingContext2D,
  variant: MarketMotionVariant,
  width: number,
  height: number,
  time: number,
  color: string,
  hover: boolean
) => {
  const duration = variant === 'nasdaq' ? 6.2 : variant === 'gold' ? 8.2 : 7.4;
  const progress = (time % duration) / duration;
  const x = width * (0.08 + progress * 0.84);
  const y1 = height * 0.2;
  const y2 = height * 0.82;
  const gradient = ctx.createLinearGradient(x, y1, x, y2);
  gradient.addColorStop(0, hexToRgba(color, 0));
  gradient.addColorStop(0.5, hexToRgba(color, hover ? 0.24 : 0.16));
  gradient.addColorStop(1, hexToRgba(color, 0));

  ctx.save();
  ctx.strokeStyle = gradient;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y1);
  ctx.lineTo(x, y2);
  ctx.stroke();
  ctx.restore();
};

export const drawTerminalGlow = (
  ctx: CanvasRenderingContext2D,
  endPoint: MotionPoint,
  width: number,
  height: number,
  color: string,
  time: number,
  hover: boolean
) => {
  const pulse = 0.76 + Math.sin(time * 1.7) * 0.18;
  const terminalX = Math.min(width * 0.92, endPoint.x + width * 0.035);
  const terminalY = endPoint.y;
  const glow = ctx.createRadialGradient(terminalX, terminalY, 0, terminalX, terminalY, width * 0.18);
  glow.addColorStop(0, hexToRgba(color, (hover ? 0.2 : 0.13) * pulse));
  glow.addColorStop(0.55, hexToRgba(color, (hover ? 0.08 : 0.045) * pulse));
  glow.addColorStop(1, hexToRgba(color, 0));

  ctx.fillStyle = glow;
  ctx.fillRect(width * 0.68, 0, width * 0.32, height);

  drawGlowDot(ctx, endPoint.x, endPoint.y, color, time, hover ? 1.18 : 0.95);
};

export const drawGlowDot = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  time: number,
  strength = 1
) => {
  const pulse = 0.68 + Math.sin(time * 2.4) * 0.18;
  const glowRadius = 10 + pulse * 4 * strength;
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, glowRadius);
  gradient.addColorStop(0, hexToRgba(color, 0.34 * strength));
  gradient.addColorStop(0.42, hexToRgba(color, 0.16 * strength));
  gradient.addColorStop(1, hexToRgba(color, 0));

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = hexToRgba(color, 0.88);
  ctx.beginPath();
  ctx.arc(x, y, 2.8 + pulse * 0.45, 0, Math.PI * 2);
  ctx.fill();
};
