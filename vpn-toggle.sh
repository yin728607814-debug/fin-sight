#!/bin/bash

# VPN 快速切换脚本
# 用法: ./vpn-toggle.sh [on|off|status]

case "$1" in
  "off")
    echo "🔌 关闭小火箭..."
    echo "请手动关闭小火箭（点击菜单栏图标 → 关闭）"
    echo ""
    echo "✅ 现在可以快速和 Kiro 交互了！"
    ;;
  "on")
    echo "🌐 打开小火箭..."
    echo "请手动打开小火箭"
    echo ""
    echo "✅ 现在可以访问被墙服务了！"
    ;;
  "status")
    echo "📊 检查网络状态..."
    if curl -s --max-time 2 https://google.com > /dev/null 2>&1; then
      echo "✅ VPN 已开启（可以访问 Google）"
    else
      echo "❌ VPN 已关闭（无法访问 Google）"
    fi
    ;;
  *)
    echo "VPN 快速切换工具"
    echo ""
    echo "用法:"
    echo "  ./vpn-toggle.sh off     - 关闭 VPN（和 Kiro 交互时）"
    echo "  ./vpn-toggle.sh on      - 打开 VPN（需要访问被墙服务时）"
    echo "  ./vpn-toggle.sh status  - 检查 VPN 状态"
    echo ""
    echo "💡 建议："
    echo "  - 和 Kiro 交互时：关闭 VPN"
    echo "  - 需要访问 Google/Gemini 时：打开 VPN"
    ;;
esac
