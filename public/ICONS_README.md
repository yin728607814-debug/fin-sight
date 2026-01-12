# PWA图标生成说明

PWA需要两个尺寸的图标：
- `icon-192.png` (192x192像素)
- `icon-512.png` (512x512像素)

## 方法1：使用在线工具（推荐）

1. 访问 https://www.pwabuilder.com/imageGenerator
2. 上传任意正方形图片（建议1024x1024）
3. 下载生成的图标包
4. 将 `icon-192.png` 和 `icon-512.png` 放到 `public/` 目录

## 方法2：使用浏览器生成

1. 在浏览器中打开 `scripts/generate-icons.html`
2. 点击下载链接保存图标
3. 将图标重命名并放到 `public/` 目录

## 方法3：使用现有图片

如果你有项目logo或任何正方形图片：
1. 使用图片编辑工具调整为192x192和512x512
2. 保存为PNG格式
3. 命名为 `icon-192.png` 和 `icon-512.png`
4. 放到 `public/` 目录

## 方法4：使用ImageMagick（需要安装）

```bash
cd public
./create-icons.sh
```

## 临时方案

如果暂时没有图标，可以：
1. 复制任何现有的PNG图片
2. 重命名为 `icon-192.png` 和 `icon-512.png`
3. PWA仍然可以正常工作，只是图标可能不太美观

## 图标设计建议

- 使用简单的图形，避免复杂细节
- 使用高对比度的颜色
- 确保在小尺寸下仍然清晰可辨
- 建议使用品牌色（当前主题色：#10b981 绿色）
