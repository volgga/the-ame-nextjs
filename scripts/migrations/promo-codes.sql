-- =============================================================================
-- Миграция: Промокоды (promo_codes).
-- Запуск: Supabase SQL Editor.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  discount_type TEXT NOT NULL CHECK (discount_type IN ('PERCENT', 'FIXED')),
  value NUMERIC(10, 2) NOT NULL CHECK (value >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT promo_codes_code_unique UNIQUE (code),
  CONSTRAINT promo_codes_percent_value CHECK (
    discount_type <> 'PERCENT' OR (value >= 1 AND value <= 100)
  ),
  CONSTRAINT promo_codes_fixed_value CHECK (
    discount_type <> 'FIXED' OR value >= 1
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS promo_codes_code_idx ON public.promo_codes (code);
COMMENT ON TABLE public.promo_codes IS 'Промокоды для скидок в корзине';
COMMENT ON COLUMN public.promo_codes.code IS 'Код (хранить в UPPERCASE)';
COMMENT ON COLUMN public.promo_codes.discount_type IS 'PERCENT или FIXED';
COMMENT ON COLUMN public.promo_codes.value IS 'Для PERCENT: 1..100, для FIXED: сумма в рублях';

-- RLS: anon может только читать (для проверки при применении в корзине), админ — через service_role
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "promo_codes_select_active" ON public.promo_codes;
CREATE POLICY "promo_codes_select_active" ON public.promo_codes
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "promo_codes_service_all" ON public.promo_codes;
CREATE POLICY "promo_codes_service_all" ON public.promo_codes
  FOR ALL USING (auth.role() = 'service_role');
