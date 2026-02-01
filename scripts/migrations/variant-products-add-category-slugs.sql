-- =============================================================================
-- Миграция: добавление category_slugs в variant_products
-- Описание: массив слогов категорий для привязки вариантного товара к категориям
-- Запуск: Supabase SQL Editor → вставить и выполнить.
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'variant_products' AND column_name = 'category_slugs'
  ) THEN
    ALTER TABLE public.variant_products ADD COLUMN category_slugs TEXT[] DEFAULT NULL;
  END IF;
END $$;
