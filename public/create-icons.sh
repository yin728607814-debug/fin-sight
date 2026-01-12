#!/bin/bash
# 使用ImageMagick创建图标的脚本
# 如果没有ImageMagick，请手动创建或使用在线工具

# 创建192x192图标
convert -size 192x192 xc:none \
  -draw "fill '#10b981' roundrectangle 0,0 192,192 38,38" \
  -draw "fill white rectangle 40,60 80,140" \
  -draw "fill white rectangle 96,80 136,140" \
  -draw "fill white rectangle 152,100 192,140" \
  -draw "fill white rectangle 40,152 192,160" \
  icon-192.png

# 创建512x512图标
convert -size 512x512 xc:none \
  -draw "fill '#10b981' roundrectangle 0,0 512,512 102,102" \
  -draw "fill white rectangle 106,160 213,373" \
  -draw "fill white rectangle 256,213 363,373" \
  -draw "fill white rectangle 405,267 512,373" \
  -draw "fill white rectangle 106,405 512,427" \
  icon-512.png

echo "图标创建完成！"
