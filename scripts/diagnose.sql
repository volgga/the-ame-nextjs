-- Диагностика товаров и вариантов (текущая схема: products, variant_products, product_variants, orders).
-- Запуск: Supabase SQL Editor или psql.

-- 1) Счётчики по таблицам
SELECT 'products' AS tbl, count(*) AS cnt FROM public.products
UNION ALL SELECT 'product_variants', count(*) FROM public.product_variants
UNION ALL SELECT 'variant_products', count(*) FROM public.variant_products
UNION ALL SELECT 'orders', count(*) FROM public.orders;

-- 2) products: сколько скрыто фильтрами
SELECT
  (SELECT count(*) FROM public.products WHERE is_active IS NULL OR is_active = false) AS products_is_active_false_or_null,
  (SELECT count(*) FROM public.products WHERE is_hidden = true) AS products_is_hidden_true;

-- 3) variant_products: скрыто
SELECT
  (SELECT count(*) FROM public.variant_products WHERE is_active = false) AS vp_is_active_false,
  (SELECT count(*) FROM public.variant_products WHERE is_hidden = true) AS vp_is_hidden_true,
  (SELECT count(*) FROM public.variant_products WHERE published_at IS NULL) AS vp_published_at_null;

-- 4) product_variants: скрыто
SELECT
  (SELECT count(*) FROM public.product_variants WHERE is_active = false) AS pv_is_active_false;

-- 5) Сиротские записи: product_variants без variant_products
SELECT count(*) AS orphan_product_variants
FROM public.product_variants pv
LEFT JOIN public.variant_products vp ON vp.id = pv.product_id
WHERE vp.id IS NULL;
