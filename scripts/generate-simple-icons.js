/**
 * 生成简单的PWA图标（使用纯JavaScript，无需额外依赖）
 * 创建SVG然后转换为PNG
 */

import fs from 'fs';
import { exec } from 'child_process';

// 创建SVG图标
function createSVG(size) {
  const radius = size * 0.2;
  const center = size / 2;
  const barWidth = size * 0.08;
  const barGap = size * 0.05;
  const baseY = center + size * 0.2;
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#10b981;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#059669;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- 圆角矩形背景 -->
  <rect width="${size}" height="${size}" rx="${radius}" fill="url(#grad1)"/>
  
  <!-- 柱状图 -->
  <g fill="rgba(255, 255, 255, 0.95)">
    <!-- 左柱 -->
    <rect x="${center - barWidth * 1.5 - barGap}" y="${baseY - size * 0.4}" 
          width="${barWidth}" height="${size * 0.4}"/>
    <!-- 中柱 -->
    <rect x="${center - barWidth * 0.5}" y="${baseY - size * 0.25}" 
          width="${barWidth}" height="${size * 0.25}"/>
    <!-- 右柱 -->
    <rect x="${center + barWidth * 0.5 + barGap}" y="${baseY - size * 0.35}" 
          width="${barWidth}" height="${size * 0.35}"/>
    <!-- 底线 -->
    <rect x="${center - size * 0.25}" y="${baseY}" 
          width="${size * 0.5}" height="${size * 0.03}"/>
  </g>
  
  <!-- 装饰圆点 -->
  <g fill="#10b981">
    <circle cx="${center - size * 0.15}" cy="${baseY + size * 0.08}" r="${size * 0.015}"/>
    <circle cx="${center - size * 0.05}" cy="${baseY + size * 0.08}" r="${size * 0.015}"/>
    <circle cx="${center + size * 0.05}" cy="${baseY + size * 0.08}" r="${size * 0.015}"/>
    <circle cx="${center + size * 0.15}" cy="${baseY + size * 0.08}" r="${size * 0.015}"/>
  </g>
</svg>`;
}

// 保存SVG文件
console.log('生成SVG图标...');
const svg192 = createSVG(192);
const svg512 = createSVG(512);

fs.writeFileSync('public/icon-192.svg', svg192);
fs.writeFileSync('public/icon-512.svg', svg512);
console.log('✅ SVG图标已生成');

// 尝试使用系统工具转换为PNG
console.log('\n尝试转换为PNG...');

// 检查是否有可用的转换工具
const commands = [
  // ImageMagick
  'convert public/icon-192.svg public/icon-192.png && convert public/icon-512.svg public/icon-512.png',
  // rsvg-convert
  'rsvg-convert -w 192 -h 192 public/icon-192.svg > public/icon-192.png && rsvg-convert -w 512 -h 512 public/icon-512.svg > public/icon-512.png',
  // inkscape
  'inkscape public/icon-192.svg --export-filename=public/icon-192.png && inkscape public/icon-512.svg --export-filename=public/icon-512.png'
];

let converted = false;

function tryConvert(index) {
  if (index >= commands.length) {
    console.log('\n⚠️  无法自动转换为PNG');
    console.log('但是SVG图标已生成，可以：');
    console.log('1. 手动使用在线工具转换：https://cloudconvert.com/svg-to-png');
    console.log('2. 或者在浏览器中打开 scripts/generate-icons.html');
    console.log('3. SVG文件位置：');
    console.log('   - public/icon-192.svg');
    console.log('   - public/icon-512.svg');
    return;
  }
  
  exec(commands[index], (error) => {
    if (!error) {
      console.log('✅ PNG图标已生成');
      console.log('图标位置：');
      console.log('  - public/icon-192.png');
      console.log('  - public/icon-512.png');
      converted = true;
    } else {
      tryConvert(index + 1);
    }
  });
}

tryConvert(0);

// 等待2秒后检查结果
setTimeout(() => {
  if (!converted) {
    console.log('\n💡 提示：你也可以直接使用SVG图标');
    console.log('   只需在 manifest.json 中将 .png 改为 .svg 即可');
  }
}, 2000);
