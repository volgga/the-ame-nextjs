# История миграций Supabase (nextjs-project)

Краткая хронология изменений схемы. Только справка; выполняются скрипты вручную в Supabase SQL Editor.

---

## Порядок применения (если настраиваешь БД с нуля)

1. **Таблица orders** — создать вручную или из архива [docs/archive/orders-table.sql](archive/orders-table.sql), затем применить **scripts/db-fix.sql** (добавит колонки, индексы, FK, RLS при необходимости).
2. **Чистка неиспользуемых таблиц** — выполнить **scripts/drop-unused-tables.sql** только если в БД ещё есть newsletter_subscriptions, categories, product_categories, product_recommendations, profiles, promo_code_usage, reviews, variant_items, variant_product_categories, view products_with_categories.
3. **Фикс схемы** — **scripts/db-fix.sql** (amount, payment_provider, payment_id, FK product_variants → variant_products, UNIQUE slug, индексы, user_id nullable).
4. После любых изменений DDL: `SELECT pg_notify('pgrst', 'reload schema');`

---

## Что уже сделано (по репозиторию)

- Удалены таблицы: newsletter_subscriptions, categories, product_categories, product_recommendations, profiles, promo_code_usage, reviews, variant_items, variant_product_categories; view products_with_categories.
- Оставлены: **products**, **variant_products**, **product_variants**, **orders**.
- В orders: поле **amount** (bigint, копейки); добавлены payment_provider, payment_id, tinkoff_payment_id (если не было).
- FK: product_variants.product_id → variant_products.id (ON DELETE CASCADE).
- Индексы: products.slug, variant_products.slug (UNIQUE где не пусто); product_variants(product_id); orders(created_at), orders(status).
- Убран блок отзывов с главной; компонент ReviewsSection удалён.
- Скрипты orders-table.sql, orders-add-columns.sql, truncate-misc-tables.sql, REPORT-visibility.md перенесены в **docs/archive/** (см. docs/archive/README.md).

---

## Актуальные скрипты

| Скрипт | Назначение |
|--------|------------|
| **scripts/db-fix.sql** | Привести orders и каталог к нужной схеме (amount, оплата, FK, индексы). Идемпотентный. |
| **scripts/db-audit.sql** | Только чтение: список таблиц, колонок, FK, индексов, view, функций; проверка сирот. |
| **scripts/drop-unused-tables.sql** | Удаление неиспользуемых таблиц (выполнять один раз после проверки). |
| **scripts/fix_visibility.sql** | Сделать товары/варианты видимыми (is_active, is_hidden, published_at). |
| **scripts/diagnose.sql** | Счётчики и сироты по текущим таблицам. |
| **scripts/check-db.ts** | Локальная проверка: npm run check-db. |
