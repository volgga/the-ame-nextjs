-- =============================================================================
-- Миграция: заменить href на category_slug в home_collections.
-- Ссылка формируется на фронте: /magazine/{category_slug}
-- Запуск: Supabase SQL Editor.
-- =============================================================================

-- Добавить category_slug (если колонки нет)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'home_collections' AND column_name = 'category_slug'
  ) THEN
    ALTER TABLE public.home_collections ADD COLUMN category_slug TEXT;
  END IF;
END $$;

-- Миграция данных: из href вида /magazine/xxx извлечь slug
UPDATE public.home_collections
SET category_slug = TRIM(BOTH '/' FROM REPLACE(href, '/magazine/', ''))
WHERE category_slug IS NULL AND href IS NOT NULL AND href != ''
  AND (href LIKE '/magazine/%' OR href LIKE 'magazine/%');

-- Для оставшихся без category_slug — magazin (вся витрина)
UPDATE public.home_collections SET category_slug = 'magazin' WHERE category_slug IS NULL OR category_slug = '';

-- Удалить колонку href (если есть)
ALTER TABLE public.home_collections DROP COLUMN IF EXISTS href;

-- Default для новых записей
ALTER TABLE public.home_collections ALTER COLUMN category_slug SET DEFAULT 'magazin';
