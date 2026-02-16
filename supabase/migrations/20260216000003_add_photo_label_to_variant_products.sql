-- "Размер на фото" на уровне товара варианта (общие настройки), не в каждом варианте
ALTER TABLE public.variant_products
ADD COLUMN IF NOT EXISTS photo_label text;

COMMENT ON COLUMN public.variant_products.photo_label IS 'Текст «На фото: …» для карточки товара (одно поле на весь товар)';
