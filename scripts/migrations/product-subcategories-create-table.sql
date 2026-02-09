-- =============================================================================
-- Миграция: создание join-таблицы product_subcategories
-- Описание: связь many-to-many между товарами и подкатегориями
-- Запуск: Supabase SQL Editor → вставить и выполнить.
-- =============================================================================

DO $$
BEGIN
  -- Создаём join-таблицу product_subcategories, если её нет
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'product_subcategories'
  ) THEN
    CREATE TABLE public.product_subcategories (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      product_id TEXT NOT NULL,
      subcategory_id UUID NOT NULL REFERENCES public.subcategories(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(product_id, subcategory_id)
    );

    -- Индексы для быстрого поиска
    CREATE INDEX idx_product_subcategories_product_id ON public.product_subcategories(product_id);
    CREATE INDEX idx_product_subcategories_subcategory_id ON public.product_subcategories(subcategory_id);

    RAISE NOTICE 'Created table: product_subcategories';
  ELSE
    RAISE NOTICE 'Table product_subcategories already exists';
  END IF;
END $$;
