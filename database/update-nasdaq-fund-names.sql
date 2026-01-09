-- 更新纳斯达克基金名称以匹配招商银行截图格式
-- 执行时间：2026-01-09

-- 1. 摩根纳斯达克100指数人民币A
UPDATE positions 
SET fund_name = '摩根纳斯达克100指数(QDII)人民币A',
    fund_code = 'QDII'
WHERE fund_name = '摩根纳斯达克100指数人民币A' 
   OR fund_name LIKE '%摩根纳斯达克100%人民币A%';

-- 2. 建信纳斯达克100指数QDIIA（名称已经正确，只需确保代码）
UPDATE positions 
SET fund_code = 'QDIIA'
WHERE fund_name = '建信纳斯达克100指数QDIIA';

-- 3. 南方纳斯达克100指数发起A
UPDATE positions 
SET fund_name = '南方纳斯达克100指数发起（QDII）A',
    fund_code = 'QDII'
WHERE fund_name = '南方纳斯达克100指数发起A'
   OR fund_name LIKE '%南方纳斯达克100%发起%A'
   AND fund_name NOT LIKE '%C';

-- 4. 嘉实纳斯达克100联接C人民币
UPDATE positions 
SET fund_name = '嘉实纳斯达克100联接(QDII)C人民币',
    fund_code = 'QDII'
WHERE fund_name = '嘉实纳斯达克100联接C人民币'
   OR fund_name LIKE '%嘉实纳斯达克100%联接%C%';

-- 5. 南方纳斯达克100指数发起C
UPDATE positions 
SET fund_name = '南方纳斯达克100指数发起（QDII）C',
    fund_code = 'QDII'
WHERE fund_name = '南方纳斯达克100指数发起C'
   OR fund_name LIKE '%南方纳斯达克100%发起%C';

-- 6. 广发纳斯达克100ETF联接A
UPDATE positions 
SET fund_name = '广发纳斯达克100ETF联接(QDII)A',
    fund_code = 'QDII'
WHERE fund_name = '广发纳斯达克100ETF联接A'
   OR fund_name LIKE '%广发纳斯达克100%ETF%联接%A';

-- 7. 大成纳斯达克100ETF联接A（如果存在）
UPDATE positions 
SET fund_name = '大成纳斯达克100ETF联接(QDII)A',
    fund_code = 'QDII'
WHERE fund_name LIKE '%大成纳斯达克100%ETF%联接%A';

-- 8. 景顺长城纳斯达克科技ETF联接A（如果存在）
UPDATE positions 
SET fund_name = '景顺长城纳斯达克科技ETF联接A',
    fund_code = 'ETF'
WHERE fund_name LIKE '%景顺长城纳斯达克%科技%ETF%联接%A';

-- 9. 景顺长城纳斯达克科技ETF联接E（如果存在）
UPDATE positions 
SET fund_name = '景顺长城纳斯达克科技ETF联接E',
    fund_code = 'ETF'
WHERE fund_name LIKE '%景顺长城纳斯达克%科技%ETF%联接%E';

-- 10. 景顺长城纳斯达克科技ETF联接C（如果存在）
UPDATE positions 
SET fund_name = '景顺长城纳斯达克科技ETF联接C',
    fund_code = 'ETF'
WHERE fund_name LIKE '%景顺长城纳斯达克%科技%ETF%联接%C';

-- 11. 华宝纳斯达克精选股票发起式A（如果存在）
UPDATE positions 
SET fund_name = '华宝纳斯达克精选股票发起式（QDII）A',
    fund_code = 'QDII'
WHERE fund_name LIKE '%华宝纳斯达克%精选%股票%发起%A';

-- 12. 博时标普500ETF联接A（如果存在）
UPDATE positions 
SET fund_name = '博时标普500ETF联接(QDII)A',
    fund_code = 'QDII'
WHERE fund_name LIKE '%博时标普500%ETF%联接%A';

-- 13. 博时纳斯达克100A人民币（如果存在）
UPDATE positions 
SET fund_name = '博时纳斯达克100A人民币',
    fund_code = 'A'
WHERE fund_name LIKE '%博时纳斯达克100%A%人民币%';

-- 查询更新后的结果
SELECT id, fund_name, fund_code, asset_type, investment_amount, profit_loss, daily_profit_loss
FROM positions
WHERE asset_type = 'nasdaq'
ORDER BY fund_name;
