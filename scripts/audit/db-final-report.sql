-- =============================================================================
-- АУДИТ ФИНАЛЬНОЙ СХЕМЫ (The Ame)
-- Запуск: Supabase SQL Editor → выполнить по блокам
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) Список таблиц в public
-- -----------------------------------------------------------------------------
SELECT
  t.table_name,
  (SELECT count(*) FROM information_schema.columns c 
   WHERE c.table_schema = t.table_schema AND c.table_name = t.table_name) AS columns_count
FROM information_schema.tables t
WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE'
ORDER BY t.table_name;

-- Ожидаемые таблицы:
-- categories, hero_slides, orders, product_variants, products, variant_products

-- -----------------------------------------------------------------------------
-- 2) Структура hero_slides
-- -----------------------------------------------------------------------------
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'hero_slides'
ORDER BY ordinal_position;

-- Ожидаемые колонки: id, image_url, sort_order, is_active, created_at, updated_at

-- -----------------------------------------------------------------------------
-- 3) Структура categories
-- -----------------------------------------------------------------------------
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'categories'
ORDER BY ordinal_position;

-- Ожидаемые колонки: id, name, slug, sort_order, is_active, created_at, updated_at

-- -----------------------------------------------------------------------------
-- 4) Индексы hero_slides и categories
-- -----------------------------------------------------------------------------
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE tablename IN ('hero_slides', 'categories')
ORDER BY tablename, indexname;

-- -----------------------------------------------------------------------------
-- 5) Ограничения (constraints)
-- -----------------------------------------------------------------------------
SELECT
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.table_name IN ('hero_slides', 'categories')
ORDER BY tc.table_name, tc.constraint_type;

-- -----------------------------------------------------------------------------
-- 6) Проверка hero_slides: данные
-- -----------------------------------------------------------------------------
SELECT 
  id,
  LEFT(image_url, 80) as image_url_preview,
  sort_order,
  is_active
FROM public.hero_slides
ORDER BY sort_order;

-- -----------------------------------------------------------------------------
-- 7) Проверка categories: данные
-- -----------------------------------------------------------------------------
SELECT 
  id,
  name,
  slug,
  sort_order,
  is_active
FROM public.categories
ORDER BY sort_order;

-- -----------------------------------------------------------------------------
-- 8) Проверка дублей/NULL в sort_order
-- -----------------------------------------------------------------------------

-- hero_slides
SELECT 'hero_slides' as table_name, sort_order, COUNT(*) as cnt
FROM public.hero_slides
GROUP BY sort_order
HAVING COUNT(*) > 1 OR sort_order IS NULL;

-- categories
SELECT 'categories' as table_name, sort_order, COUNT(*) as cnt
FROM public.categories
GROUP BY sort_order
HAVING COUNT(*) > 1 OR sort_order IS NULL;

-- -----------------------------------------------------------------------------
-- 9) Проверка пустых image_url в hero_slides
-- -----------------------------------------------------------------------------
SELECT id, sort_order
FROM public.hero_slides
WHERE image_url IS NULL OR image_url = '';

-- -----------------------------------------------------------------------------
-- 10) Счётчики строк
-- -----------------------------------------------------------------------------
SELECT 'hero_slides' AS tbl, count(*) AS cnt FROM public.hero_slides
UNION ALL SELECT 'categories', count(*) FROM public.categories
UNION ALL SELECT 'products', count(*) FROM public.products
UNION ALL SELECT 'variant_products', count(*) FROM public.variant_products
UNION ALL SELECT 'product_variants', count(*) FROM public.product_variants
UNION ALL SELECT 'orders', count(*) FROM public.orders;

-- -----------------------------------------------------------------------------
-- 11) View в public (должно быть пусто после чистки)
-- -----------------------------------------------------------------------------
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'VIEW';

-- =============================================================================
-- КОНЕЦ АУДИТА
-- =============================================================================
