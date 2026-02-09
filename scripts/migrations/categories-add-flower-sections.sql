-- =============================================================================
-- Миграция: добавление поля flower_sections в таблицу categories
-- Описание: JSONB массив подразделов по цветам для категории "Цветы в составе"
-- Структура: [{"key": "розы", "title": "Розы", "description": "..."}, ...]
-- Запуск: Supabase SQL Editor → вставить и выполнить.
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'categories' AND column_name = 'flower_sections'
  ) THEN
    ALTER TABLE public.categories ADD COLUMN flower_sections JSONB DEFAULT NULL;
    RAISE NOTICE 'Added column: categories.flower_sections';
  ELSE
    RAISE NOTICE 'Column categories.flower_sections already exists';
  END IF;
END $$;
