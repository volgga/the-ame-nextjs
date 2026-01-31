# Экспорт данных БД

## products_data.sql

Файл в корне проекта: **products_data.sql** — дамп данных (INSERT) для таблиц products, product_categories, variant_products, variant_product_categories, product_variants и др.

- **Не запускать целиком** без проверки: часть таблиц (product_categories, variant_product_categories и т.д.) могла быть удалена скриптом drop-unused-tables.sql.
- Используется как **архив/образец данных** или для выборочного восстановления в новую БД.
- Актуальная схема и список таблиц — в [docs/DB-SCHEMA.md](DB-SCHEMA.md).
