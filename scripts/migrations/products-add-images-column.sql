-- =============================================================================
-- Миграция: добавление поля images в таблицу products
-- Описание: массив URL доп. изображений (главное — в image_url)
-- Запуск: Supabase SQL Editor → вставить и выполнить.
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'images'
  ) THEN
    ALTER TABLE public.products ADD COLUMN images TEXT[] DEFAULT NULL;
  END IF;
END $$;
