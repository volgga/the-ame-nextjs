-- =============================================================================
-- Безопасное удаление неиспользуемых таблиц Supabase (проект nextjs-project)
-- Запуск: Supabase Dashboard → SQL Editor → вставить и выполнить.
--
-- Перед запуском: бэкап (Database → Backups или export CSV).
--
-- УДАЛЯЕМ ТОЛЬКО:
--   newsletter_subscriptions, categories, product_categories,
--   product_recommendations, profiles, promo_code_usage, reviews,
--   variant_items, variant_product_categories, view products_with_categories.
--
-- НЕ ТРОГАЕМ: products, product_variants, variant_products, orders.
-- =============================================================================

BEGIN;

-- 1) View (если существует)
DROP VIEW IF EXISTS public.products_with_categories CASCADE;

-- 2) Связующие таблицы
DROP TABLE IF EXISTS public.product_categories CASCADE;
DROP TABLE IF EXISTS public.variant_product_categories CASCADE;

-- 3) Таблицы без зависимостей от каталога/заказов
DROP TABLE IF EXISTS public.newsletter_subscriptions CASCADE;
DROP TABLE IF EXISTS public.product_recommendations CASCADE;
DROP TABLE IF EXISTS public.promo_code_usage CASCADE;
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 4) variant_items
DROP TABLE IF EXISTS public.variant_items CASCADE;

-- 5) categories (после product_categories и view)
DROP TABLE IF EXISTS public.categories CASCADE;

COMMIT;

SELECT pg_notify('pgrst', 'reload schema');
