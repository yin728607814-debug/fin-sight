import React, { useEffect, useRef, useState } from 'react';
import {
  MarketMotionVariant,
  drawHudLabels,
  drawMarketChannel,
  drawScanCursor,
  drawSmoothPath,
  drawTerminalGlow,
  drawTerminalTicks,
  getMarketPoints,
  hexToRgba,
} from '../utils/marketMotion';

interface AnimatedMarketMotionChartProps {
  variant: MarketMotionVariant;
  primaryColor: string;
  secondaryColor: string;
  glowColor: string;
  status: string;
  intensity?: number;
  hover?: boolean;
}

const useReducedMotion = () => {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = () => setReducedMotion(media.matches);
    handleChange();
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);

  return reducedMotion;
};

const drawMotionFrame = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  props: Required<Pick<AnimatedMarketMotionChartProps, 'variant' | 'primaryColor' | 'secondaryColor' | 'glowColor' | 'intensity' | 'hover'>>
) => {
  const activeIntensity = props.intensity * (props.hover ? 1.22 : 1);
  ctx.clearRect(0, 0, width, height);

  const mistShift = (Math.sin(time * 0.26) + 1) / 2;
  const mistX = width * (0.18 + mistShift * 0.64);
  const mistY = height * (props.variant === 'aStock' ? 0.42 + Math.sin(time * 0.58) * 0.04 : 0.45);
  const mist = ctx.createRadialGradient(mistX, mistY, 4, mistX, mistY, width * 0.54);
  mist.addColorStop(0, hexToRgba(props.glowColor, 0.12 * activeIntensity));
  mist.addColorStop(0.42, hexToRgba(props.primaryColor, 0.045 * activeIntensity));
  mist.addColorStop(1, hexToRgba(props.primaryColor, 0));
  ctx.fillStyle = mist;
  ctx.fillRect(0, 0, width, height);

  if (props.variant === 'aStock') {
    const bandY = height * (0.48 + Math.sin(time * 0.44) * 0.025);
    const band = ctx.createLinearGradient(0, bandY - 12, 0, bandY + 12);
    band.addColorStop(0, hexToRgba(props.primaryColor, 0));
    band.addColorStop(0.5, hexToRgba(props.primaryColor, 0.055 * activeIntensity));
    band.addColorStop(1, hexToRgba(props.primaryColor, 0));
    ctx.fillStyle = band;
    ctx.fillRect(0, bandY - 12, width, 24);
  }

  const mainPoints = getMarketPoints(props.variant, width, height, time, activeIntensity);
  drawTerminalTicks(ctx, props.variant, width, height, props.primaryColor);
  drawMarketChannel(
    ctx,
    mainPoints,
    props.variant,
    width,
    props.primaryColor,
    props.secondaryColor,
    activeIntensity,
    props.hover
  );

  const shadows = [
    { offset: 4, phase: 0.9, alpha: 0.12 },
    { offset: -3, phase: 1.8, alpha: 0.08 },
  ];

  shadows.forEach((shadow) => {
    const points = getMarketPoints(props.variant, width, height, time, activeIntensity * 0.72, shadow.offset, shadow.phase);
    ctx.strokeStyle = hexToRgba(props.primaryColor, shadow.alpha);
    ctx.lineWidth = 1.25;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    drawSmoothPath(ctx, points);
    ctx.stroke();
  });

  ctx.save();
  ctx.shadowColor = hexToRgba(props.primaryColor, props.hover ? 0.34 : 0.22);
  ctx.shadowBlur = props.hover ? 10 : 6;
  const lineGradient = ctx.createLinearGradient(0, 0, width, 0);
  lineGradient.addColorStop(0, props.primaryColor);
  lineGradient.addColorStop(0.62, props.secondaryColor);
  lineGradient.addColorStop(1, props.glowColor);
  ctx.strokeStyle = lineGradient;
  ctx.lineWidth = props.hover ? 2.75 : 2.45;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  drawSmoothPath(ctx, mainPoints);
  ctx.stroke();
  ctx.restore();

  drawHudLabels(ctx, props.variant, width, height, time, props.primaryColor, props.hover);
  drawScanCursor(ctx, props.variant, width, height, time, props.glowColor, props.hover);

  const lastPoint = mainPoints[mainPoints.length - 1];
  if (lastPoint) {
    drawTerminalGlow(ctx, lastPoint, width, height, props.glowColor, time, props.hover);
  }
};

export const AnimatedMarketMotionChart: React.FC<AnimatedMarketMotionChartProps> = ({
  variant,
  primaryColor,
  secondaryColor,
  glowColor,
  status,
  intensity = 1,
  hover = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number | null>(null);
  const sizeRef = useRef({ width: 0, height: 0 });
  const hoverRef = useRef(hover);
  const [isHovered, setIsHovered] = useState(false);
  const reducedMotion = useReducedMotion();
  const effectiveHover = hover || isHovered;

  useEffect(() => {
    hoverRef.current = effectiveHover;
  }, [effectiveHover]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      sizeRef.current = { width: rect.width, height: rect.height };
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    const render = (timestamp: number) => {
      const { width, height } = sizeRef.current;
      if (width > 0 && height > 0) {
        drawMotionFrame(context, width, height, reducedMotion ? 0 : timestamp / 1000, {
          variant,
          primaryColor,
          secondaryColor,
          glowColor,
          intensity,
          hover: hoverRef.current,
        });
      }

      if (!reducedMotion) {
        frameRef.current = requestAnimationFrame(render);
      }
    };

    render(0);

    return () => {
      observer.disconnect();
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [variant, primaryColor, secondaryColor, glowColor, intensity, reducedMotion]);

  return (
    <div
      className={`animated-market-motion motion-${variant}`}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
    >
      <span className="terminal-status-chip"><i />{status}</span>
      <canvas ref={canvasRef} aria-hidden="true" />
    </div>
  );
};
