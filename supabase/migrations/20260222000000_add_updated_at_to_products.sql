-- Добавить updated_at в products для cache-bust изображений при смене фото.
-- Если колонка уже есть — миграция безопасна (IF NOT EXISTS через DO block).

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.products ADD COLUMN updated_at timestamptz DEFAULT now();
    COMMENT ON COLUMN public.products.updated_at IS 'Для cache-bust изображений (?v=) при обновлении товара.';
  END IF;
END $$;
