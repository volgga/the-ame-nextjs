-- =============================================================================
-- Исправить колонку discount_amount: приложение использует "value", не discount_amount.
-- Сделать discount_amount nullable с default, чтобы INSERT без этой колонки не падал.
-- Запуск: Supabase SQL Editor.
-- =============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'promo_codes' AND column_name = 'discount_amount'
  ) THEN
    -- заполнить NULL у существующих строк (иначе DROP NOT NULL не пройдёт)
    UPDATE public.promo_codes SET discount_amount = 0 WHERE discount_amount IS NULL;
    -- снять NOT NULL и задать default для новых строк (приложение использует "value", не discount_amount)
    ALTER TABLE public.promo_codes
      ALTER COLUMN discount_amount SET DEFAULT 0,
      ALTER COLUMN discount_amount DROP NOT NULL;
  END IF;
END $$;
