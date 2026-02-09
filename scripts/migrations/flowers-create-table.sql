-- =============================================================================
-- Миграция: создание таблицы flowers (справочник "Цветы в составе")
-- Описание: отдельная сущность вместо подкатегорий для категории "Цветы в составе".
--           Список автособирается из товаров, но каждую позицию можно редактировать
--           (название, заголовок, описание, SEO, активность, порядок).
-- Запуск: Supabase SQL Editor → вставить и выполнить.
-- =============================================================================

CREATE OR REPLACE FUNCTION update_flowers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'flowers'
  ) THEN
    CREATE TABLE public.flowers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      slug TEXT NOT NULL,
      name TEXT NOT NULL,
      title TEXT NULL,
      description TEXT NULL,
      seo_title TEXT NULL,
      seo_description TEXT NULL,
      is_active BOOLEAN NOT NULL DEFAULT true,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      CONSTRAINT flowers_slug_unique UNIQUE (slug),
      CONSTRAINT flowers_name_unique UNIQUE (name)
    );

    CREATE INDEX idx_flowers_slug ON public.flowers(slug);
    CREATE INDEX idx_flowers_is_active ON public.flowers(is_active);
    CREATE INDEX idx_flowers_sort_order ON public.flowers(sort_order NULLS LAST);

    CREATE TRIGGER update_flowers_updated_at_trigger
      BEFORE UPDATE ON public.flowers
      FOR EACH ROW
      EXECUTE FUNCTION update_flowers_updated_at();

    RAISE NOTICE 'Created table: flowers';
  ELSE
    RAISE NOTICE 'Table flowers already exists';
  END IF;
END $$;
