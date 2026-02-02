-- =============================================================================
-- Индексы для sort_order (products, variant_products)
-- Запуск: Supabase SQL Editor → вставить и выполнить.
-- Идемпотентно: можно запускать повторно.
-- Обратимо: DROP INDEX IF EXISTS idx_products_sort_order; (если потребуется)
-- =============================================================================
-- Эти поля участвуют в ORDER BY при выборке каталога и админки.
-- Индексы ускоряют сортировку и фильтрацию.

CREATE INDEX IF NOT EXISTS idx_products_sort_order
  ON public.products (sort_order ASC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_variant_products_sort_order
  ON public.variant_products (sort_order ASC NULLS LAST);

-- Перезагрузка схемы PostgREST (опционально)
SELECT pg_notify('pgrst', 'reload schema');
