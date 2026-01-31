-- Делаем все товары и варианты видимыми в UI.
-- Применять только после проверки: фильтры в коде используют is_active, is_hidden, published_at.
-- Запуск: Supabase SQL Editor или: psql $DATABASE_URL -f scripts/fix_visibility.sql

-- products: нет published_at в схеме; выставляем is_active и is_hidden
UPDATE public.products
SET is_active = true, is_hidden = false
WHERE is_active IS NOT true OR is_hidden IS NOT false;

-- variant_products: is_active, is_hidden, published_at
UPDATE public.variant_products
SET is_active = true, is_hidden = false, published_at = COALESCE(published_at, now())
WHERE is_active = false OR is_hidden = true OR published_at IS NULL;

-- product_variants: только is_active
UPDATE public.product_variants
SET is_active = true
WHERE is_active = false;
