-- =============================================================================
-- Hero slides: поля кнопки на слайде (button_text, button_href, button_variant, button_align)
-- Запуск: Supabase SQL Editor → вставить и выполнить.
-- =============================================================================

-- Кнопка на слайде: текст, ссылка, вариант (filled | transparent), выравнивание (left | center | right)
ALTER TABLE public.hero_slides ADD COLUMN IF NOT EXISTS button_text TEXT;
ALTER TABLE public.hero_slides ADD COLUMN IF NOT EXISTS button_href TEXT;
ALTER TABLE public.hero_slides ADD COLUMN IF NOT EXISTS button_variant TEXT CHECK (button_variant IS NULL OR button_variant IN ('filled', 'transparent'));
ALTER TABLE public.hero_slides ADD COLUMN IF NOT EXISTS button_align TEXT CHECK (button_align IS NULL OR button_align IN ('left', 'center', 'right'));
