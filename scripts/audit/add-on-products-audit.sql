-- =============================================================================
-- Аудит: блок «Добавить к заказу» — add_on_products_categories и товары по категориям
-- Запуск: Supabase SQL Editor
-- Доп.товары = товары из products/variant_products с category_slug из add_on_products_categories
-- =============================================================================

-- 1) Категории из add_on_products_categories, которых НЕТ в categories
SELECT a.category_slug AS missing_in_categories
FROM add_on_products_categories a
LEFT JOIN categories c ON lower(trim(c.slug)) = lower(trim(a.category_slug)) AND c.is_active = true
WHERE c.id IS NULL
ORDER BY a.sort_order;

-- 2) Товары (products): category_slug которых нет в categories
SELECT p.id, p.name, p.category_slug AS product_category_slug
FROM products p
WHERE (p.is_active IS NULL OR p.is_active = true)
  AND (p.is_hidden IS NULL OR p.is_hidden = false)
  AND trim(p.category_slug) <> ''
  AND NOT EXISTS (
    SELECT 1 FROM categories c
    WHERE lower(trim(c.slug)) = lower(trim(p.category_slug)) AND c.is_active = true
  )
ORDER BY p.category_slug
LIMIT 50;

-- 3) Количество доп.товаров по каждой категории (порядок из add_on_products_categories)
SELECT
  a.category_slug,
  a.sort_order,
  (SELECT count(*) FROM products p
   WHERE (p.is_active IS NULL OR p.is_active = true)
     AND (p.is_hidden IS NULL OR p.is_hidden = false)
     AND (lower(trim(p.category_slug)) = lower(trim(a.category_slug))
          OR p.category_slugs::text ILIKE '%' || trim(a.category_slug) || '%')) AS products_count
FROM add_on_products_categories a
ORDER BY a.sort_order;

-- 4) Все категории из add_on_products_categories и есть ли для них название в categories
SELECT
  a.category_slug,
  a.sort_order,
  c.name AS category_name,
  CASE WHEN c.id IS NOT NULL THEN 'ok' ELSE 'no match' END AS in_categories
FROM add_on_products_categories a
LEFT JOIN categories c ON lower(trim(c.slug)) = lower(trim(a.category_slug))
ORDER BY a.sort_order;
