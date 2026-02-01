-- =============================================================================
-- Миграция: добавление полей composition, height_cm, width_cm в variant_products
-- Состав и размер основного товара (не дублируются на варианты).
-- Запуск: Supabase SQL Editor → вставить и выполнить.
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'variant_products' AND column_name = 'composition'
  ) THEN
    ALTER TABLE public.variant_products ADD COLUMN composition TEXT DEFAULT NULL;
    RAISE NOTICE 'Added column: variant_products.composition';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'variant_products' AND column_name = 'height_cm'
  ) THEN
    ALTER TABLE public.variant_products ADD COLUMN height_cm INTEGER DEFAULT NULL;
    RAISE NOTICE 'Added column: variant_products.height_cm';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'variant_products' AND column_name = 'width_cm'
  ) THEN
    ALTER TABLE public.variant_products ADD COLUMN width_cm INTEGER DEFAULT NULL;
    RAISE NOTICE 'Added column: variant_products.width_cm';
  END IF;
END $$;
