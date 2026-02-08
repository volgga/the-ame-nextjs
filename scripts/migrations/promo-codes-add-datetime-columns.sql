-- =============================================================================
-- Добавить колонки starts_at и ends_at в promo_codes, если их нет.
-- Запуск: Supabase SQL Editor.
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'promo_codes' AND column_name = 'starts_at'
  ) THEN
    ALTER TABLE public.promo_codes ADD COLUMN starts_at TIMESTAMPTZ;
    COMMENT ON COLUMN public.promo_codes.starts_at IS 'Дата начала действия промокода (NULL = без ограничения)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'promo_codes' AND column_name = 'ends_at'
  ) THEN
    ALTER TABLE public.promo_codes ADD COLUMN ends_at TIMESTAMPTZ;
    COMMENT ON COLUMN public.promo_codes.ends_at IS 'Дата окончания действия промокода (NULL = без ограничения)';
  END IF;
END $$;
