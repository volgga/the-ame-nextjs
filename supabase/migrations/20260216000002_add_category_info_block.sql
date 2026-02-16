-- Информационный блок для категорий и подкатегорий (как у Rococo)
ALTER TABLE public.categories
ADD COLUMN IF NOT EXISTS info_subtitle text,
ADD COLUMN IF NOT EXISTS info_description text,
ADD COLUMN IF NOT EXISTS info_content text,
ADD COLUMN IF NOT EXISTS info_image_url text;

ALTER TABLE public.subcategories
ADD COLUMN IF NOT EXISTS info_subtitle text,
ADD COLUMN IF NOT EXISTS info_description text,
ADD COLUMN IF NOT EXISTS info_content text,
ADD COLUMN IF NOT EXISTS info_image_url text;

COMMENT ON COLUMN public.categories.info_subtitle IS 'Подзаголовок инфоблока';
COMMENT ON COLUMN public.categories.info_description IS 'Описание под подзаголовком';
COMMENT ON COLUMN public.categories.info_content IS 'Rich text / HTML контент';
COMMENT ON COLUMN public.categories.info_image_url IS 'Квадратная картинка 1:1';
