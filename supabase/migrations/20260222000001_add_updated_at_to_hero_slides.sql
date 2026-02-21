-- Добавить updated_at в hero_slides для cache-bust изображений при смене слайда.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'hero_slides' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.hero_slides ADD COLUMN updated_at timestamptz DEFAULT now();
    COMMENT ON COLUMN public.hero_slides.updated_at IS 'Для cache-bust изображений (?v=) при обновлении слайда.';
  END IF;
END $$;
