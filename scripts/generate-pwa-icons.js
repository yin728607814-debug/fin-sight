/**
 * 生成PWA图标
 * 使用Canvas API创建192x192和512x512的PNG图标
 */

const fs = require('fs');
const { createCanvas } = require('canvas');

function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // 背景渐变
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#10b981'); // 绿色
  gradient.addColorStop(1, '#059669'); // 深绿色
  
  // 绘制圆角矩形背景
  const radius = size * 0.2;
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.lineTo(size - radius, 0);
  ctx.quadraticCurveTo(size, 0, size, radius);
  ctx.lineTo(size, size - radius);
  ctx.quadraticCurveTo(size, size, size - radius, size);
  ctx.lineTo(radius, size);
  ctx.quadraticCurveTo(0, size, 0, size - radius);
  ctx.lineTo(0, radius);
  ctx.quadraticCurveTo(0, 0, radius, 0);
  ctx.closePath();
  ctx.fill();
  
  // 绘制图表图标
  const center = size / 2;
  const barWidth = size * 0.08;
  const barGap = size * 0.05;
  const baseY = center + size * 0.2;
  
  // 白色半透明柱状图
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  
  // 三个柱子（不同高度）
  const bars = [
    { x: center - barWidth * 1.5 - barGap, height: size * 0.4 },
    { x: center - barWidth * 0.5, height: size * 0.25 },
    { x: center + barWidth * 0.5 + barGap, height: size * 0.35 }
  ];
  
  bars.forEach(bar => {
    ctx.fillRect(bar.x, baseY - bar.height, barWidth, bar.height);
  });
  
  // 底部基线
  ctx.fillRect(center - size * 0.25, baseY, size * 0.5, size * 0.03);
  
  // 装饰圆点
  ctx.fillStyle = '#10b981';
  const dotRadius = size * 0.015;
  const dotY = baseY + size * 0.08;
  
  [-0.15, -0.05, 0.05, 0.15].forEach(offset => {
    ctx.beginPath();
    ctx.arc(center + size * offset, dotY, dotRadius, 0, Math.PI * 2);
    ctx.fill();
  });
  
  return canvas;
}

// 生成192x192图标
console.log('生成 192x192 图标...');
const icon192 = generateIcon(192);
const buffer192 = icon192.toBuffer('image/png');
fs.writeFileSync('public/icon-192.png', buffer192);
console.log('✅ icon-192.png 已生成');

// 生成512x512图标
console.log('生成 512x512 图标...');
const icon512 = generateIcon(512);
const buffer512 = icon512.toBuffer('image/png');
fs.writeFileSync('public/icon-512.png', buffer512);
console.log('✅ icon-512.png 已生成');

console.log('\n🎉 PWA图标生成完成！');
console.log('图标位置：');
console.log('  - public/icon-192.png');
console.log('  - public/icon-512.png');
