-- =============================================================================
-- Миграция: создание join-таблицы product_flowers
-- Описание: связь many-to-many между товарами (products + variant_products) и flowers.
--           product_id: UUID для products, число как текст для variant_products (как в product_subcategories).
-- Запуск: Supabase SQL Editor → вставить и выполнить.
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'product_flowers'
  ) THEN
    CREATE TABLE public.product_flowers (
      product_id TEXT NOT NULL,
      flower_id UUID NOT NULL REFERENCES public.flowers(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY (product_id, flower_id)
    );

    CREATE INDEX idx_product_flowers_product_id ON public.product_flowers(product_id);
    CREATE INDEX idx_product_flowers_flower_id ON public.product_flowers(flower_id);

    RAISE NOTICE 'Created table: product_flowers';
  ELSE
    RAISE NOTICE 'Table product_flowers already exists';
  END IF;
END $$;
