-- =============================================================================
-- Аудит схемы Supabase (только чтение). Не изменяет и не удаляет данные.
-- Запуск: Supabase SQL Editor → вставить и выполнить по блокам или целиком.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) Таблицы в public
-- -----------------------------------------------------------------------------
SELECT
  t.table_name,
  (SELECT count(*) FROM information_schema.columns c WHERE c.table_schema = t.table_schema AND c.table_name = t.table_name) AS columns_count
FROM information_schema.tables t
WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE'
ORDER BY t.table_name;

-- -----------------------------------------------------------------------------
-- 2) Колонки по таблицам (public)
-- -----------------------------------------------------------------------------
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- -----------------------------------------------------------------------------
-- 3) Первичные ключи
-- -----------------------------------------------------------------------------
SELECT
  tc.table_name,
  kcu.column_name,
  tc.constraint_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
WHERE tc.table_schema = 'public' AND tc.constraint_type = 'PRIMARY KEY'
ORDER BY tc.table_name;

-- -----------------------------------------------------------------------------
-- 4) Внешние ключи (FK)
-- -----------------------------------------------------------------------------
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table,
  ccu.column_name AS foreign_column,
  tc.constraint_name,
  rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu
  ON tc.constraint_name = ccu.constraint_name AND tc.table_schema = ccu.table_schema
JOIN information_schema.referential_constraints rc
  ON tc.constraint_name = rc.constraint_name AND tc.table_schema = rc.constraint_schema
WHERE tc.table_schema = 'public' AND tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name, kcu.column_name;

-- -----------------------------------------------------------------------------
-- 5) Индексы (public)
-- -----------------------------------------------------------------------------
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- -----------------------------------------------------------------------------
-- 6) View в public
-- -----------------------------------------------------------------------------
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'VIEW'
ORDER BY table_name;

-- -----------------------------------------------------------------------------
-- 7) Функции в public (и триггеры)
-- -----------------------------------------------------------------------------
SELECT
  n.nspname AS schema,
  p.proname AS function_name,
  pg_get_function_arguments(p.oid) AS arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
ORDER BY p.proname;

SELECT
  tgname AS trigger_name,
  relname AS table_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public' AND NOT t.tgisinternal
ORDER BY relname, tgname;

-- -----------------------------------------------------------------------------
-- 8) Проверка сиротских записей: product_variants без variant_products
-- -----------------------------------------------------------------------------
SELECT count(*) AS orphan_product_variants
FROM public.product_variants pv
LEFT JOIN public.variant_products vp ON vp.id = pv.product_id
WHERE vp.id IS NULL;

-- -----------------------------------------------------------------------------
-- 9) Счётчики строк по ключевым таблицам
-- -----------------------------------------------------------------------------
SELECT 'products' AS tbl, count(*) AS cnt FROM public.products
UNION ALL SELECT 'product_variants', count(*) FROM public.product_variants
UNION ALL SELECT 'variant_products', count(*) FROM public.variant_products
UNION ALL SELECT 'orders', count(*) FROM public.orders;

-- -----------------------------------------------------------------------------
-- 10) Перезагрузка схемы PostgREST (при необходимости — раскомментировать)
-- -----------------------------------------------------------------------------
-- SELECT pg_notify('pgrst', 'reload schema');
