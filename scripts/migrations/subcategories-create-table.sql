-- =============================================================================
-- Миграция: создание таблицы subcategories (Подкатегории)
-- Описание: подкатегории в контексте категорий с ручными полями title и description
-- Запуск: Supabase SQL Editor → вставить и выполнить.
-- =============================================================================

-- Создаём функцию для обновления updated_at (если её ещё нет)
CREATE OR REPLACE FUNCTION update_subcategories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  -- Создаём таблицу subcategories, если её нет
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'subcategories'
  ) THEN
    CREATE TABLE public.subcategories (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      title TEXT NULL,
      description TEXT NULL,
      sort_order INTEGER NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Индексы
    CREATE INDEX idx_subcategories_category_id ON public.subcategories(category_id);
    CREATE INDEX idx_subcategories_name ON public.subcategories(name);
    CREATE INDEX idx_subcategories_sort_order ON public.subcategories(sort_order NULLS LAST);

    -- Триггер для автоматического обновления updated_at
    CREATE TRIGGER update_subcategories_updated_at_trigger
      BEFORE UPDATE ON public.subcategories
      FOR EACH ROW
      EXECUTE FUNCTION update_subcategories_updated_at();

    RAISE NOTICE 'Created table: subcategories';
  ELSE
    RAISE NOTICE 'Table subcategories already exists';
  END IF;
END $$;
