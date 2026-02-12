-- Миграция: добавление колонки images в таблицу variant_products
-- Дата: 2026-02-12
-- Описание: Добавляет колонку images (массив строк) для хранения до 5 изображений товара с вариантами
--            Аналогично колонке images в таблице products

-- Добавляем колонку images типа text[] (массив строк)
ALTER TABLE variant_products 
ADD COLUMN IF NOT EXISTS images TEXT[] NULL;

-- Комментарий к колонке (для документации в БД)
COMMENT ON COLUMN variant_products.images IS 'Массив URL изображений товара (до 5 изображений). Первое изображение хранится в image_url, остальные в этом массиве.';
