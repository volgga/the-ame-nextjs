-- Добавить поле photo_label в product_variants (текст "На фото: …" для карточки товара)
ALTER TABLE public.product_variants
ADD COLUMN IF NOT EXISTS photo_label text;

COMMENT ON COLUMN public.product_variants.photo_label IS 'Текст для отображения под названием варианта, например: 31 штука, M размер';
