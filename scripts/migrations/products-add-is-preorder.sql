-- =============================================================================
-- Миграция: добавление поля is_preorder в таблицу products
-- Описание: если true — на витрине вместо цены показывается «Предзаказ»
-- Запуск: Supabase SQL Editor → вставить и выполнить.
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'is_preorder'
  ) THEN
    ALTER TABLE public.products ADD COLUMN is_preorder BOOLEAN DEFAULT false;
  END IF;
END $$;
