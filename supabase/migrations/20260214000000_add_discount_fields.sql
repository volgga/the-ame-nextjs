-- Скидки: товар и варианты
-- discount_percent: 0–100 (процент скидки, задаётся вручную)
-- discount_price: итоговая цена после скидки (используется при оплате и на витрине)

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS discount_percent numeric(5,2) NULL
    CHECK (discount_percent IS NULL OR (discount_percent >= 0 AND discount_percent <= 100)),
  ADD COLUMN IF NOT EXISTS discount_price numeric(12,2) NULL
    CHECK (discount_price IS NULL OR discount_price > 0);

ALTER TABLE public.product_variants
  ADD COLUMN IF NOT EXISTS discount_percent numeric(5,2) NULL
    CHECK (discount_percent IS NULL OR (discount_percent >= 0 AND discount_percent <= 100)),
  ADD COLUMN IF NOT EXISTS discount_price numeric(12,2) NULL
    CHECK (discount_price IS NULL OR discount_price > 0);

COMMENT ON COLUMN public.products.discount_percent IS 'Процент скидки 0–100';
COMMENT ON COLUMN public.products.discount_price IS 'Цена со скидкой (финальная, для оплаты и витрины)';
COMMENT ON COLUMN public.product_variants.discount_percent IS 'Процент скидки 0–100';
COMMENT ON COLUMN public.product_variants.discount_price IS 'Цена со скидкой (финальная)';
