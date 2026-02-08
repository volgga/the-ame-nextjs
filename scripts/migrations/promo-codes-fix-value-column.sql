-- =============================================================================
-- Исправление: добавить колонку value в promo_codes, если таблица была создана без неё.
-- Запуск: Supabase SQL Editor (после неудачного запуска promo-codes.sql).
-- =============================================================================

-- Добавляем колонку value, если её нет (например таблица создана вручную или старым скриптом)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'promo_codes' AND column_name = 'value'
  ) THEN
    ALTER TABLE public.promo_codes
    ADD COLUMN value NUMERIC(10, 2) NOT NULL DEFAULT 0;
    -- Ограничение по диапазону
    ALTER TABLE public.promo_codes ADD CONSTRAINT promo_codes_value_non_neg CHECK (value >= 0);
    COMMENT ON COLUMN public.promo_codes.value IS 'Для PERCENT: 1..100, для FIXED: сумма в рублях';
  END IF;
END $$;

-- Ограничения по типу скидки (если ещё нет — создаём только при отсутствии)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'promo_codes_percent_value'
  ) THEN
    ALTER TABLE public.promo_codes ADD CONSTRAINT promo_codes_percent_value
      CHECK (discount_type <> 'PERCENT' OR (value >= 1 AND value <= 100));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'promo_codes_fixed_value'
  ) THEN
    ALTER TABLE public.promo_codes ADD CONSTRAINT promo_codes_fixed_value
      CHECK (discount_type <> 'FIXED' OR value >= 1);
  END IF;
END $$;

-- Включить RLS и политики (если ещё не применены)
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "promo_codes_select_active" ON public.promo_codes;
CREATE POLICY "promo_codes_select_active" ON public.promo_codes
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "promo_codes_service_all" ON public.promo_codes;
CREATE POLICY "promo_codes_service_all" ON public.promo_codes
  FOR ALL USING (auth.role() = 'service_role');
