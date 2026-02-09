-- =============================================================================
-- Миграция: добавление поля composition_flowers в таблицу products
-- Описание: массив названий цветов для фильтрации (автозаполнение из composition или ручной выбор в админке)
-- Запуск: Supabase SQL Editor → вставить и выполнить.
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'composition_flowers'
  ) THEN
    ALTER TABLE public.products ADD COLUMN composition_flowers TEXT[] DEFAULT NULL;
  END IF;
END $$;
