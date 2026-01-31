-- Безопасная очистка "мусорных" таблиц (без DROP).
-- Запуск: в Supabase SQL Editor или через psql.
-- Зависимости: newsletter_subscriptions и product_recommendations не имеют FK из других таблиц на них.

TRUNCATE public.newsletter_subscriptions RESTART IDENTITY CASCADE;
TRUNCATE public.product_recommendations RESTART IDENTITY CASCADE;
