-- =============================================================================
-- Миграция: добавление SEO-полей в subcategories
-- Описание: добавляет slug, seo_title, seo_description в таблицу subcategories
--           для поддержки SEO-страниц цветов и поводов
-- Запуск: Supabase SQL Editor → вставить и выполнить.
-- =============================================================================

DO $$
BEGIN
  -- Добавляем slug, если его ещё нет
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'subcategories' AND column_name = 'slug'
  ) THEN
    ALTER TABLE public.subcategories ADD COLUMN slug TEXT NULL;
    CREATE INDEX IF NOT EXISTS idx_subcategories_slug ON public.subcategories(slug);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_subcategories_category_slug_unique ON public.subcategories(category_id, slug) WHERE slug IS NOT NULL;
    RAISE NOTICE 'Added column: slug';
  ELSE
    RAISE NOTICE 'Column slug already exists';
  END IF;

  -- Добавляем seo_title, если его ещё нет
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'subcategories' AND column_name = 'seo_title'
  ) THEN
    ALTER TABLE public.subcategories ADD COLUMN seo_title TEXT NULL;
    RAISE NOTICE 'Added column: seo_title';
  ELSE
    RAISE NOTICE 'Column seo_title already exists';
  END IF;

  -- Добавляем seo_description, если его ещё нет
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'subcategories' AND column_name = 'seo_description'
  ) THEN
    ALTER TABLE public.subcategories ADD COLUMN seo_description TEXT NULL;
    RAISE NOTICE 'Added column: seo_description';
  END IF;

  -- Добавляем is_active, если его ещё нет
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'subcategories' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE public.subcategories ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
    RAISE NOTICE 'Added column: is_active';
  ELSE
    RAISE NOTICE 'Column is_active already exists';
  END IF;
END $$;
