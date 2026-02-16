-- Бейдж «Хит»: взаимно исключающий с «Новый» (логика в админке и на фронте)
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS is_hit boolean NOT NULL DEFAULT false;

ALTER TABLE public.variant_products
ADD COLUMN IF NOT EXISTS is_hit boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.products.is_hit IS 'Бейдж «Хит» на карточке; не показывать вместе с «Новый»';
COMMENT ON COLUMN public.variant_products.is_hit IS 'Бейдж «Хит» на карточке; не показывать вместе с «Новый»';
