-- =============================================================================
-- Миграция: добавление полей размера (height_cm, width_cm) в таблицу products
-- composition_size остаётся полем «Состав»; размер выносится в отдельные поля.
-- Запуск: Supabase SQL Editor → вставить и выполнить.
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'height_cm'
  ) THEN
    ALTER TABLE public.products ADD COLUMN height_cm INTEGER DEFAULT NULL;
    RAISE NOTICE 'Added column: products.height_cm';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'width_cm'
  ) THEN
    ALTER TABLE public.products ADD COLUMN width_cm INTEGER DEFAULT NULL;
    RAISE NOTICE 'Added column: products.width_cm';
  END IF;
END $$;
