#!/bin/bash

# 网络连接测试脚本
# 用于验证 VPN 分流配置是否正确

echo "🧪 开始测试网络配置..."
echo "================================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试函数
test_url() {
    local name=$1
    local url=$2
    local expected=$3
    
    echo -n "测试 $name ... "
    
    response=$(curl -I -s -m 5 "$url" 2>&1 | head -n 1)
    
    if [[ $response == *"200"* ]] || [[ $response == *"301"* ]] || [[ $response == *"302"* ]] || [[ $response == *"403"* ]]; then
        echo -e "${GREEN}✅ 可访问${NC}"
        echo "   响应: $response"
        return 0
    else
        echo -e "${RED}❌ 无法访问${NC}"
        echo "   错误: $response"
        return 1
    fi
}

echo "1️⃣  测试 AI 服务 (应该可访问)"
echo "--------------------------------"
test_url "Gemini API" "https://generativelanguage.googleapis.com" "proxy"
test_url "Google APIs" "https://www.googleapis.com" "proxy"
echo ""

echo "2️⃣  测试数据库服务 (应该可访问)"
echo "--------------------------------"
test_url "Supabase" "https://bhedgcynaclprbztcmcl.supabase.co" "direct"
echo ""

echo "3️⃣  测试代码托管 (应该可访问)"
echo "--------------------------------"
test_url "GitHub" "https://github.com" "direct"
test_url "GitHub API" "https://api.github.com" "direct"
echo ""

echo "4️⃣  测试汇率 API (应该可访问)"
echo "--------------------------------"
test_url "ExchangeRate-API" "https://api.exchangerate-api.com/v4/latest/USD" "direct"
test_url "Frankfurter" "https://api.frankfurter.app/latest" "direct"
echo ""

echo "5️⃣  测试部署平台 (应该可访问)"
echo "--------------------------------"
test_url "Netlify" "https://fantastic-sfogliatella-d01eac.netlify.app" "direct"
echo ""

echo "6️⃣  测试金融数据 (应该可访问)"
echo "--------------------------------"
test_url "Yahoo Finance" "https://query2.finance.yahoo.com" "direct"
echo ""

echo "================================"
echo "✅ 测试完成！"
echo ""
echo "💡 提示："
echo "   - 如果所有服务都可访问，说明配置正确"
echo "   - 如果 Gemini 无法访问，需要开启 VPN"
echo "   - 如果 Supabase/GitHub 无法访问，检查是否被 VPN 阻断"
echo "   - 建议使用 Clash 等工具配置分流规则"
echo ""
