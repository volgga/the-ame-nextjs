-- Диагностика "пропавших" товаров и вариантов.
-- Запуск: Supabase SQL Editor или psql.

-- 2.1 Счётчики
SELECT 'products' AS tbl, count(*) AS cnt FROM public.products
UNION ALL SELECT 'product_variants', count(*) FROM public.product_variants
UNION ALL SELECT 'variant_products', count(*) FROM public.variant_products
UNION ALL SELECT 'product_categories', count(*) FROM public.product_categories
UNION ALL SELECT 'variant_product_categories', count(*) FROM public.variant_product_categories
UNION ALL SELECT 'products_with_categories', count(*) FROM public.products_with_categories;

-- 2.2 products: сколько "скрыто фильтрами"
SELECT
  (SELECT count(*) FROM public.products WHERE is_active IS NULL OR is_active = false) AS products_is_active_false_or_null,
  (SELECT count(*) FROM public.products WHERE is_hidden = true) AS products_is_hidden_true;

-- 2.2 variant_products: скрыто
SELECT
  (SELECT count(*) FROM public.variant_products WHERE is_active = false) AS vp_is_active_false,
  (SELECT count(*) FROM public.variant_products WHERE is_hidden = true) AS vp_is_hidden_true,
  (SELECT count(*) FROM public.variant_products WHERE published_at IS NULL) AS vp_published_at_null;

-- 2.2 product_variants: скрыто
SELECT
  (SELECT count(*) FROM public.product_variants WHERE is_active = false) AS pv_is_active_false;

-- 2.3 Осиротевшие: product_variants без variant_products
SELECT count(*) AS orphan_pv
FROM public.product_variants pv
LEFT JOIN public.variant_products vp ON vp.id = pv.product_id
WHERE vp.id IS NULL;

-- 2.3 Осиротевшие: variant_product_categories без variant_products
SELECT count(*) AS orphan_vpc
FROM public.variant_product_categories vpc
LEFT JOIN public.variant_products vp ON vp.id = vpc.product_id
WHERE vp.id IS NULL;

-- 2.3 Определение вьюхи products_with_categories
SELECT pg_get_viewdef('public.products_with_categories'::regclass, true);
