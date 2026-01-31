-- =============================================================================
-- Финальная схема hero_slides (cleanup)
-- Удаляет title, subtitle. Гарантирует sort_order, is_active, индекс.
-- Запуск: Supabase SQL Editor → вставить и выполнить.
-- =============================================================================

-- Удалить неиспользуемые колонки
ALTER TABLE public.hero_slides DROP COLUMN IF EXISTS title;
ALTER TABLE public.hero_slides DROP COLUMN IF EXISTS subtitle;

-- Гарантировать NOT NULL и default (если колонки уже есть)
ALTER TABLE public.hero_slides 
  ALTER COLUMN sort_order SET DEFAULT 0,
  ALTER COLUMN sort_order SET NOT NULL;
ALTER TABLE public.hero_slides 
  ALTER COLUMN is_active SET DEFAULT true,
  ALTER COLUMN is_active SET NOT NULL;

-- Индекс по порядку (если нет)
CREATE INDEX IF NOT EXISTS idx_hero_slides_sort ON public.hero_slides (sort_order);

SELECT pg_notify('pgrst', 'reload schema');
