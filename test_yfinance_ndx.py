#!/usr/bin/env python3
"""
使用 yfinance 获取纳斯达克100指数 (^NDX) 的数据
严格要求：
1. Ticker 符号必须是 ^NDX（包含脱字符）
2. 获取 2026-04-08 的数据
"""

import yfinance as yf
import pandas as pd
from datetime import datetime

print("🔍 使用 yfinance 获取纳斯达克100指数数据\n")

# 严格使用 ^NDX 作为 ticker
ticker_symbol = "^NDX"
print(f"Ticker 符号: {ticker_symbol}")

# 创建 Ticker 对象
ticker = yf.Ticker(ticker_symbol)

# 获取 2026-04-08 的数据
# 设置 start="2026-04-08", end="2026-04-09" 以确保获取 8 号的数据
start_date = "2026-04-08"
end_date = "2026-04-09"

print(f"日期范围: {start_date} 到 {end_date}\n")

try:
    # 下载历史数据
    hist = ticker.history(start=start_date, end=end_date)
    
    if hist.empty:
        print("❌ 没有获取到数据")
        print("\n尝试获取最近5天的数据作为参考：")
        hist_recent = ticker.history(period="5d")
        print(hist_recent)
    else:
        print("✅ 成功获取数据！\n")
        print("=" * 80)
        print(f"纳斯达克100指数 ({ticker_symbol}) - 2026年4月8日数据")
        print("=" * 80)
        
        for date, row in hist.iterrows():
            print(f"\n日期: {date.strftime('%Y-%m-%d')}")
            print(f"开盘价 (Open):     {row['Open']:.2f}")
            print(f"最高价 (High):     {row['High']:.2f}")
            print(f"最低价 (Low):      {row['Low']:.2f}")
            print(f"收盘价 (Close):    {row['Close']:.2f}")
            print(f"成交量 (Volume):   {int(row['Volume']):,}")
            
            # 计算涨跌
            if len(hist) > 1 or 'Close' in row:
                print(f"\n📊 价格信息:")
                print(f"   收盘价: {row['Close']:.2f}")
        
        print("\n" + "=" * 80)
        print("完整数据表格:")
        print("=" * 80)
        print(hist.to_string())
        
except Exception as e:
    print(f"❌ 错误: {e}")
    print("\n尝试获取最近的数据：")
    try:
        hist_recent = ticker.history(period="1mo")
        print(f"\n最近一个月的数据（最后5条）:")
        print(hist_recent.tail())
    except Exception as e2:
        print(f"❌ 也无法获取最近数据: {e2}")
