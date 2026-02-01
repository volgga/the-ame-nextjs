-- =============================================================================
-- Миграция: добавление полей height_cm, width_cm в product_variants
-- Состав (composition) уже есть; размер хранится в варианте.
-- Запуск: Supabase SQL Editor → вставить и выполнить.
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'product_variants' AND column_name = 'height_cm'
  ) THEN
    ALTER TABLE public.product_variants ADD COLUMN height_cm INTEGER DEFAULT NULL;
    RAISE NOTICE 'Added column: product_variants.height_cm';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'product_variants' AND column_name = 'width_cm'
  ) THEN
    ALTER TABLE public.product_variants ADD COLUMN width_cm INTEGER DEFAULT NULL;
    RAISE NOTICE 'Added column: product_variants.width_cm';
  END IF;
END $$;
