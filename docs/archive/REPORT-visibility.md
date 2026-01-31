# [АРХИВ] Отчёт: пропавшие товары и варианты

Исторический отчёт. Таблицы newsletter_subscriptions и product_recommendations удалены. Актуальная схема — см. docs/DB-SCHEMA.md и docs/DB-AUDIT-REPORT.md.

## Где была причина "пропажи"

1. **Фильтры в коде** — в products.ts использовались строгие is_active/is_hidden.
2. **Только таблица products** — variant_products в UI не использовались.
3. **Данные после переноса БД** — is_active/is_hidden/published_at у части записей.

## Какие SQL-фиксы применены

- truncate-misc-tables.sql (таблицы удалены позже через drop-unused-tables.sql).
- fix_visibility.sql — оставлен в scripts/, работает с products, variant_products, product_variants.

## Изменения в коде

Фильтры ослаблены; единый каталог = products + variant_products; variantProducts.ts загружает variant_products.
