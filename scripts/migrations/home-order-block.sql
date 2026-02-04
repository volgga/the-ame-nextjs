-- =============================================================================
-- Миграция: блок «Форма с заказом» на главной (заголовок, подзаголовки, текст, изображение).
-- Таблица: home_reviews. Запуск: Supabase SQL Editor.
-- =============================================================================

ALTER TABLE public.home_reviews
ADD COLUMN IF NOT EXISTS order_block_title TEXT DEFAULT 'Заказать букет вашей мечты',
ADD COLUMN IF NOT EXISTS order_block_subtitle1 TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS order_block_text TEXT DEFAULT 'Соберём букет вашей мечты и доставим по Сочи уже сегодня. Оставьте заявку на сайте или позвоните нам — мы подберём идеальное сочетание цветов под ваш повод и бюджет.',
ADD COLUMN IF NOT EXISTS order_block_subtitle2 TEXT DEFAULT 'или оставьте заявку',
ADD COLUMN IF NOT EXISTS order_block_image_url TEXT;
