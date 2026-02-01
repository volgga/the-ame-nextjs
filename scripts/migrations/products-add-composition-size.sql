-- =============================================================================
-- Миграция: добавление поля composition_size в таблицу products
-- Описание: состав и размер букета (ручной ввод в админке)
-- Запуск: Supabase SQL Editor → вставить и выполнить.
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'composition_size'
  ) THEN
    ALTER TABLE public.products ADD COLUMN composition_size TEXT;
  END IF;
END $$;
