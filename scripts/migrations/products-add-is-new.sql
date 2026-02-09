-- =============================================================================
-- Миграция: добавление полей is_new и new_until в таблицу products
-- Описание: 
--   - is_new: ручной флаг из админки (boolean)
--   - new_until: дата окончания статуса "новый" (timestamptz nullable)
--   При включении is_new устанавливается new_until = now() + 30 days
--   Бейдж показывается только если is_new = true AND new_until > now()
-- Запуск: Supabase SQL Editor → вставить и выполнить.
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'is_new'
  ) THEN
    ALTER TABLE public.products ADD COLUMN is_new BOOLEAN NOT NULL DEFAULT false;
    RAISE NOTICE 'Added column: products.is_new';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'new_until'
  ) THEN
    ALTER TABLE public.products ADD COLUMN new_until TIMESTAMPTZ NULL;
    RAISE NOTICE 'Added column: products.new_until';
  END IF;
END $$;
