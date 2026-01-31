-- =============================================================================
-- Миграция: добавление поля description в таблицу categories
-- Описание: SEO/описательный текст категории (отображается на странице категории)
-- Запуск: Supabase SQL Editor → вставить и выполнить.
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'categories' AND column_name = 'description'
  ) THEN
    ALTER TABLE public.categories ADD COLUMN description TEXT;
  END IF;
END $$;
