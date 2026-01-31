# Архив скриптов и отчётов

Скрипты и файлы, которые больше не используются в текущей схеме БД или заменены другими.

| Файл | Зачем хранится |
|------|----------------|
| **truncate-misc-tables.sql** | Раньше очищал newsletter_subscriptions и product_recommendations; эти таблицы удалены скриптом drop-unused-tables.sql. Оставлен для истории. |
| **orders-table.sql** | Изначальное создание таблицы orders. Актуальная схема/политики задаются в scripts/db-fix.sql и scripts/orders-add-columns.sql. |
| **orders-add-columns.sql** | Миграция полей orders. Сейчас всё объединено в scripts/db-fix.sql. Оставлен для истории. |
| **REPORT-visibility.md** | Отчёт по видимости товаров; упоминает удалённые таблицы. Только справка. |

Текущие рабочие скрипты: **scripts/db-fix.sql**, **scripts/db-audit.sql**, **scripts/drop-unused-tables.sql**, **scripts/fix_visibility.sql**, **scripts/diagnose.sql** (обновлён под текущую схему), **scripts/check-db.ts**.
