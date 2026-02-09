-- =============================================================================
-- Миграция: добавление поля bouquet_colors (фильтр «Цвет букета»)
-- Описание: массив ключей цветов из справочника (persikovyy, krasnyy, ...).
-- Таблицы: products, variant_products, product_variants.
-- Запуск: Supabase SQL Editor → вставить и выполнить.
-- =============================================================================

DO $$
BEGIN
  -- products
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'bouquet_colors'
  ) THEN
    ALTER TABLE public.products ADD COLUMN bouquet_colors TEXT[] DEFAULT '{}';
  END IF;

  -- variant_products
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'variant_products' AND column_name = 'bouquet_colors'
  ) THEN
    ALTER TABLE public.variant_products ADD COLUMN bouquet_colors TEXT[] DEFAULT '{}';
  END IF;

  -- product_variants
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'product_variants' AND column_name = 'bouquet_colors'
  ) THEN
    ALTER TABLE public.product_variants ADD COLUMN bouquet_colors TEXT[] DEFAULT '{}';
  END IF;
END $$;
