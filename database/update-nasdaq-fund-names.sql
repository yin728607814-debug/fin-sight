-- 更新纳斯达克基金名称，使其与招商银行截图格式一致
-- 执行前请备份数据！
-- 执行时间：2026-01-09

-- 重要说明：
-- 1. 摩根基金：括号前后无空格，如 摩根纳斯达克100指数(QDII)人民币A
-- 2. 建信基金：QDII和A之间有空格，如 建信纳斯达克100指数QDII A
-- 3. 南方基金：(QDII)前后有空格，A/C/I前面有空格，如 南方纳斯达克100指数发起 (QDII) A

-- 1. 摩根纳斯达克100指数(QDII)人民币A（括号前后无空格）
UPDATE positions 
SET fund_name = '摩根纳斯达克100指数(QDII)人民币A',
    fund_code = 'QDII'
WHERE fund_name LIKE '%摩根%纳斯达克%' AND fund_name LIKE '%人民币A%';

-- 2. 建信纳斯达克100指数QDII A（QDII和A之间有空格）
UPDATE positions 
SET fund_name = '建信纳斯达克100指数QDII A',
    fund_code = 'QDII'
WHERE fund_name LIKE '%建信%纳斯达克%';

-- 3. 南方纳斯达克100指数发起 (QDII) A（(QDII)前后有空格，A前面有空格）
UPDATE positions 
SET fund_name = '南方纳斯达克100指数发起 (QDII) A',
    fund_code = 'QDII'
WHERE fund_name LIKE '%南方%纳斯达克%' 
  AND (fund_name LIKE '%A' OR fund_name LIKE '% A')
  AND fund_name NOT LIKE '%C%' 
  AND fund_name NOT LIKE '%I%';

-- 4. 南方纳斯达克100指数发起 (QDII) C（(QDII)前后有空格，C前面有空格）
UPDATE positions 
SET fund_name = '南方纳斯达克100指数发起 (QDII) C',
    fund_code = 'QDII'
WHERE fund_name LIKE '%南方%纳斯达克%' 
  AND (fund_name LIKE '%C' OR fund_name LIKE '% C');

-- 5. 南方纳斯达克100指数发起 (QDII) I（(QDII)前后有空格，I前面有空格）
UPDATE positions 
SET fund_name = '南方纳斯达克100指数发起 (QDII) I',
    fund_code = 'QDII'
WHERE fund_name LIKE '%南方%纳斯达克%' 
  AND (fund_name LIKE '%I' OR fund_name LIKE '% I');

-- 验证更新结果
SELECT id, fund_name, fund_code, investment_amount, profit_loss, daily_profit_loss
FROM positions 
WHERE asset_type = 'nasdaq'
ORDER BY fund_name;
