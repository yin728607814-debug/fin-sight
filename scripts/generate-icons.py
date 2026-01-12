#!/usr/bin/env python3
"""
生成PWA图标 - 使用PIL/Pillow
如果没有安装Pillow: pip3 install Pillow
"""

try:
    from PIL import Image, ImageDraw
    import os
    
    def create_icon(size):
        # 创建图像
        img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        
        # 绘制圆角矩形背景（渐变效果用纯色代替）
        radius = int(size * 0.2)
        draw.rounded_rectangle(
            [(0, 0), (size, size)],
            radius=radius,
            fill='#10b981'
        )
        
        # 绘制柱状图
        center = size // 2
        bar_width = int(size * 0.08)
        bar_gap = int(size * 0.05)
        base_y = int(center + size * 0.2)
        
        # 白色柱子
        bars = [
            (center - int(bar_width * 1.5) - bar_gap, int(size * 0.4)),
            (center - int(bar_width * 0.5), int(size * 0.25)),
            (center + int(bar_width * 0.5) + bar_gap, int(size * 0.35))
        ]
        
        for x, height in bars:
            draw.rectangle(
                [(x, base_y - height), (x + bar_width, base_y)],
                fill=(255, 255, 255, 242)  # 95% opacity
            )
        
        # 底部线
        draw.rectangle(
            [(center - int(size * 0.25), base_y), 
             (center + int(size * 0.25), base_y + int(size * 0.03))],
            fill=(255, 255, 255, 242)
        )
        
        # 装饰圆点
        dot_radius = int(size * 0.015)
        dot_y = base_y + int(size * 0.08)
        
        for offset in [-0.15, -0.05, 0.05, 0.15]:
            x = center + int(size * offset)
            draw.ellipse(
                [(x - dot_radius, dot_y - dot_radius),
                 (x + dot_radius, dot_y + dot_radius)],
                fill='#10b981'
            )
        
        return img
    
    # 生成图标
    print('生成 192x192 图标...')
    icon192 = create_icon(192)
    icon192.save('public/icon-192.png', 'PNG')
    print('✅ icon-192.png 已生成')
    
    print('生成 512x512 图标...')
    icon512 = create_icon(512)
    icon512.save('public/icon-512.png', 'PNG')
    print('✅ icon-512.png 已生成')
    
    print('\n🎉 PWA图标生成完成！')
    print('图标位置：')
    print('  - public/icon-192.png')
    print('  - public/icon-512.png')
    
except ImportError:
    print('❌ 未安装Pillow库')
    print('请运行: pip3 install Pillow')
    print('或者在浏览器中打开 scripts/svg-to-png.html 手动生成')
