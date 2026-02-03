# Финальная уборка после изменений Supabase

## 1. Аудит БД (только анализ + SQL)

- **Отчёт:** [docs/DB-AUDIT-REPORT.md](DB-AUDIT-REPORT.md) — таблицы/вью/функции/триггеры, FK, индексы, поля orders, рассинхрон amount/total_amount.
- **Скрипт (только чтение):** [scripts/db-audit.sql](../scripts/db-audit.sql) — запросы к information_schema/pg_catalog (таблицы, колонки, FK, индексы, view, функции, триггеры), проверка сирот (product_variants без variant_products), счётчики строк, при необходимости `pg_notify('pgrst', 'reload schema')`.

---

## 2. Чистка кода и репозитория

### 2.1 Удалённые / перенесённые файлы

| Действие | Файл | Причина |
|----------|------|---------|
| Удалён | **dump.sql** | Пустой. |
| Удалён | **dump.backup** | Экспорт БД, не нужен в репо. |
| Удалён | **scripts/truncate-misc-tables.sql** | Таблицы newsletter_subscriptions, product_recommendations удалены. |
| Удалён | **scripts/orders-table.sql** | Заменён scripts/db-fix.sql. |
| Удалён | **scripts/orders-add-columns.sql** | Заменён scripts/db-fix.sql. |
| Удалён | **scripts/REPORT-visibility.md** | Устаревшие инструкции. |
| В архив | **docs/archive/truncate-misc-tables.sql** | Копия с пометкой [АРХИВ]. |
| В архив | **docs/archive/orders-table.sql** | Копия с пометкой [АРХИВ]. |
| В архив | **docs/archive/orders-add-columns.sql** | Копия с пометкой [АРХИВ]. |
| В архив | **docs/archive/REPORT-visibility.md** | Сокращённая копия для истории. |
| Добавлен | **docs/archive/README.md** | Описание архива. |

**products_data.sql** — оставлен в корне; описан в [docs/DATA-EXPORT-NOTES.md](DATA-EXPORT-NOTES.md) (архив данных, не запускать целиком).

### 2.2 Неиспользуемые обращения к Supabase

- Поиск по проекту: **from('...')** только для **products**, **variant_products**, **orders** (и в check-db.ts — **product_variants**).
- Упоминаний удалённых таблиц (reviews, categories, product_categories, profiles, newsletter_subscriptions и т.д.) в **src** нет.
- Мёртвые запросы и компоненты отзывов уже убраны ранее (ReviewsSection удалён, блок с главной убран).

### 2.3 Структура «db layer»

Текущее разделение (без переусложения):

| Место | Назначение |
|-------|------------|
| **src/lib/supabaseClient.ts** | Клиент Supabase (браузер). |
| **src/lib/supabaseServer.ts** | Клиент Supabase (API routes). |
| **src/lib/products.ts** | Запросы к products, getCatalogProductBySlug (products + variant_products). |
| **src/lib/variantProducts.ts** | Запросы к variant_products. |
| **src/lib/catalogServer.ts** | getCatalogProductById / getCatalogProductsByIds (products + variant_products для заказов). |
| **src/services/orders.ts** | Запросы к orders (create, getById, updateStatus). |

Типы заказа — **src/types/order.ts**. Доп. типизация через существующие интерфейсы (OrderRecord, Product и т.д.).

### 2.4 README и env

- **README.md** — переписан: запуск, переменные окружения, раздел «Supabase: что должно быть в базе» со ссылкой на [docs/DB-SCHEMA.md](DB-SCHEMA.md), скрипты, сборка и линт.
- **.env.example** — без изменений; содержит только актуальные переменные (Supabase, Tinkoff, URL).

---

## 3. Гарантия «не сломать магазин»

- **Grep по удалённым таблицам в src:** совпадений нет (reviews, categories, product_categories, profiles, newsletter, product_recommendations, promo_code_usage, variant_items, variant_product_categories, products_with_categories).
- **Grep from('...'):** только **products**, **variant_products**, **orders** (и в check-db — product_variants).
- **npm run lint** — есть старые замечания (React effects/refs, img в других компонентах), не связанные с БД; на работу магазина не влияют.
- **npm run build** — при наличии сети проходит (раньше падал из-за шрифтов в sandbox).

---

## 4. Итоговые списки

### Удалённые файлы

- dump.sql  
- dump.backup  
- scripts/truncate-misc-tables.sql  
- scripts/orders-table.sql  
- scripts/orders-add-columns.sql  
- scripts/REPORT-visibility.md  

### Изменённые файлы и что поменялось

| Файл | Изменение |
|------|-----------|
| **docs/DB-AUDIT-REPORT.md** | Новый: аудит таблиц, FK, индексов, orders, рассинхрон. |
| **scripts/db-audit.sql** | Новый: только чтение — таблицы, колонки, FK, индексы, view, функции, триггеры, сироты, счётчики. |
| **scripts/diagnose.sql** | Приведён к текущей схеме: только products, product_variants, variant_products, orders; убраны product_categories, variant_product_categories, products_with_categories. |
| **docs/archive/** | Добавлены README, truncate-misc-tables.sql, orders-table.sql, orders-add-columns.sql, REPORT-visibility.md (архив). |
| **docs/DATA-EXPORT-NOTES.md** | Новый: описание products_data.sql. |
| **docs/MIGRATION-HISTORY.md** | Новый: порядок миграций, что сделано, актуальные скрипты. |
| **README.md** | Переписан: запуск, env, Supabase и ссылка на DB-SCHEMA.md, скрипты, build/lint. |
| **package.json** | Удалён скрипт **truncate-misc** (файл удалён). |

### Карта использования БД

| Таблица | Где используется | Назначение |
|---------|------------------|------------|
| **products** | src/lib/products.ts, src/lib/catalogServer.ts, scripts/check-db.ts | Каталог, карточка товара, пересчёт заказа. |
| **variant_products** | src/lib/variantProducts.ts, src/lib/catalogServer.ts, scripts/check-db.ts | Каталог, карточка товара, пересчёт заказа (id как vp-{id}). |
| **product_variants** | scripts/check-db.ts | Только проверка наличия; в приложении не читается напрямую (есть min_price_cache у variant_products). |
| **orders** | src/services/orders.ts, API orders, API payments/tinkoff | Создание заказа, получение по id, обновление статуса и payment_id. |

### Что можно удалить в Supabase (если есть)

Удалять только после проверки, что ни код, ни админки их не используют:

- admin_users  
- hero_slides  
- new_clients  
- discount_rules  

Скрипт удаления в репо не добавлен — выполнять отдельно при необходимости.

### Чеклист проверки сайта вручную

1. **Главная** — открыть `/`, есть баннер и блок товаров, нет блока отзывов.  
2. **Каталог** — открыть `/catalog`, список товаров загружается (products + variant_products).  
3. **Карточка товара** — открыть товар по slug (из каталога), страница открывается, цена и описание отображаются.  
4. **Корзина** — добавить товар в корзину, открыть корзину по иконке в шапке (модалка), позиции и сумма отображаются.  
5. **Оформление заказа** — заполнить форму, отправить; заказ создаётся, редирект на оплату или страница успеха.  
6. **Оплата (Success)** — после оплаты открыть `/payment/success?orderId=...`, отображаются данные заказа и сумма.  
7. **Проверка БД** — выполнить `npm run check-db`: в выводе только products, product_variants, variant_products, orders; ошибок доступа к удалённым таблицам нет.
