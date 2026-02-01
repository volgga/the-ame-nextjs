-- =============================================================================
-- Миграция: добавление поля category_slugs в таблицу products
-- Описание: массив слогов категорий для привязки товара к нескольким категориям
-- Запуск: Supabase SQL Editor → вставить и выполнить.
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'category_slugs'
  ) THEN
    ALTER TABLE public.products ADD COLUMN category_slugs TEXT[] DEFAULT NULL;
  END IF;
END $$;
