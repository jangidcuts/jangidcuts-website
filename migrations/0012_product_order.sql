-- Nov 2: product display order. products.sort already drives the store (ORDER BY sort, id DESC).
-- Renumber it 0..n-1 inside each group (Free = price 0, Paid = price > 0) in the CURRENT public order,
-- so the store looks exactly the same and Admin -> Products can move packs up / down.
UPDATE products SET sort = (
  SELECT rn FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY (COALESCE(price, 0) > 0) ORDER BY sort, id DESC) - 1 AS rn FROM products
  ) x WHERE x.id = products.id
);
