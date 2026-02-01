-- =============================================================================
-- Миграция: добавление полей для вариантов товаров
-- Описание: добавляет composition, is_preorder в product_variants
-- Примечание: колонка "title" уже существует в БД (используется как название варианта)
-- Запуск: Supabase SQL Editor → вставить и выполнить.
-- =============================================================================

DO $$
BEGIN
  -- Добавить composition (состав и размер) для варианта
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'product_variants' AND column_name = 'composition'
  ) THEN
    ALTER TABLE public.product_variants ADD COLUMN composition TEXT DEFAULT NULL;
  END IF;

  -- Добавить is_preorder для варианта
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'product_variants' AND column_name = 'is_preorder'
  ) THEN
    ALTER TABLE public.product_variants ADD COLUMN is_preorder BOOLEAN DEFAULT FALSE;
  END IF;
END $$;
