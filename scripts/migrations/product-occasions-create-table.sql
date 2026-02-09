-- =============================================================================
-- Миграция: создание join-таблицы product_occasions
-- Описание: связь many-to-many между товарами и "По поводу"
-- Запуск: Supabase SQL Editor → вставить и выполнить.
-- =============================================================================

DO $$
BEGIN
  -- Создаём join-таблицу product_occasions, если её нет
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'product_occasions'
  ) THEN
    CREATE TABLE public.product_occasions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      product_id TEXT NOT NULL,
      occasion_id UUID NOT NULL REFERENCES public.occasions(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(product_id, occasion_id)
    );

    -- Индексы для быстрого поиска
    CREATE INDEX idx_product_occasions_product_id ON public.product_occasions(product_id);
    CREATE INDEX idx_product_occasions_occasion_id ON public.product_occasions(occasion_id);

    RAISE NOTICE 'Created table: product_occasions';
  ELSE
    RAISE NOTICE 'Table product_occasions already exists';
  END IF;
END $$;
