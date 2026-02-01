# Аудит Supabase (The Ame) — 2026

## 1. Обращения к Supabase в коде

### 1.1 Anon key (клиент / публичное чтение)

| Место | Клиент | Таблицы | Операции | Поля (основные) |
|-------|--------|---------|----------|------------------|
| `lib/supabaseClient.ts` | Экспорт `supabase` | — | Используется в lib/* и API | — |
| `lib/products.ts` | `supabase` | `products` | SELECT | id, name, slug, price, image_url, description, composition_size, height_cm, width_cm, images, is_active, is_hidden, is_preorder, sort_order, category_slug |
| `lib/variantProducts.ts` | `supabase` | `variant_products`, `product_variants` | SELECT | variant_products: id, slug, name, description, image_url, min_price_cache, category_slug, is_active, is_hidden, published_at, sort_order; product_variants: id, title, composition, height_cm, width_cm, price, image_url |
| `lib/categories.ts` | `supabase` | `categories` | SELECT | id, name, slug, sort_order, is_active, description |
| `lib/heroSlides.ts` | `supabase` | `hero_slides` | SELECT | id, image_url, sort_order |
| `app/api/categories/route.ts` | `supabase` | `categories` | SELECT | id, name, slug, sort_order |
| `lib/catalogServer.ts` | Свой `createClient(anon)` | `products`, `variant_products` | SELECT | id, name, price / min_price_cache |

**Edge cases (anon):**
- `lib/products.ts`, `lib/variantProducts.ts`, `lib/categories.ts`, `lib/heroSlides.ts` — при отсутствии `NEXT_PUBLIC_SUPABASE_*` возвращают пустой массив/null и пишут в консоль; не падают.
- `catalogServer.ts` — при отсутствии env возвращает `null` / пустой Map; вызывается из `services/orders.ts` и API — при null каталог пустой, заказ может не создаться из‑за «товар не найден».

### 1.2 Service role (только сервер)

| Место | Таблицы | Операции | Поля |
|-------|---------|----------|------|
| `lib/supabaseAdmin.ts` | — | `getSupabaseAdmin()` — только в API routes | — |
| `app/api/one-click-order/route.ts` | `one_click_orders` | INSERT | product_id, product_title, price, phone, name, status |
| `app/api/orders/quick/route.ts` | `orders` | INSERT, SELECT | id, items, amount, currency, customer, status, … |
| `app/api/admin/slides/*` | `hero_slides`, `storage` | SELECT, INSERT, UPDATE, DELETE, storage upload/remove | id, image_url, sort_order, is_active |
| `app/api/admin/products/*` | `products`, `variant_products`, `product_variants`, `storage` | SELECT, INSERT, UPDATE, DELETE, storage upload | все поля товаров/вариантов |
| `app/api/admin/categories/*` | `categories` | SELECT, INSERT, UPDATE, DELETE | все поля |
| `scripts/seed-categories.ts` | `categories` | INSERT | локальный скрипт |

**Edge cases (service role):**
- Админские API защищены проверкой сессии/куки (см. `adminAuth`); без авторизации админки запросы могут возвращать 401. Service role ключ не передаётся на клиент — только в серверных модулях и скриптах.

### 1.3 Server anon (supabaseServer — для orders)

| Место | Таблицы | Операции | Назначение |
|-------|---------|----------|------------|
| `services/orders.ts` | `orders` | INSERT (createOrder), SELECT by id (getOrderById), UPDATE by id (updateOrderStatus) | Корзина → заказ, страница заказа, колбэк оплаты |

**Edge cases:**
- Зависит от RLS: anon должен иметь право INSERT в `orders`, SELECT по одному `id`, UPDATE по `id` (для webhook). Если RLS запрещает anon SELECT по id — страница «статус заказа» не сможет подтянуть заказ (проверить политики).

---

## 2. База данных: таблицы и использование

### 2.1 Таблицы, реально используемые в коде

| Таблица | Чтение | Запись | Кто пишет |
|---------|--------|--------|-----------|
| `products` | anon (каталог, админка) | service_role (админка) | API admin/products |
| `variant_products` | anon (каталог, админка), catalogServer | service_role (админка) | API admin/products |
| `product_variants` | anon (каталог), админка | service_role (админка) | API admin/products |
| `categories` | anon (меню, API /api/categories), админка | service_role (админка, seed) | API admin/categories, seed-categories |
| `hero_slides` | anon (hero), админка | service_role (админка) | API admin/slides |
| `orders` | supabaseServer (getOrderById) | supabaseServer (createOrder), service_role (orders/quick), payments (updateOrderStatus) | orders.ts, api/orders/quick, api/payments |
| `one_click_orders` | — (пока только админ через Dashboard?) | service_role (API one-click-order) | api/one-click-order |

### 2.2 Поля и замечания

- **products:** `category_slug` и `category_slugs` — проверить, что везде в коде используется одна схема (category_slug или массив). В миграциях есть и category_slug, и category_slugs.
- **variant_products:** то же для `category_slug` / `category_slugs`; `published_at` в выборке есть, но в фильтрах не используется — показываются все активные/не скрытые.
- **orders:** `amount` — BIGINT в копейках (верно); `tinkoff_payment_id` / `payment_id` — дублирование, код умеет оба.
- **one_click_orders:** `product_id` — text (подходит и для uuid, и для vp-123). Лишних полей не выявлено.

### 2.3 Дубли сущностей

- Два каталога: `products` (uuid) и `variant_products` (int) + `product_variants`. В коде они объединены в единый список «товаров» (id вида `vp-{id}` у вариантных). Дублирования таблиц нет — это две модели товаров.
- Два потока «купить в 1 клик»: каталог → `QuickBuyModal` → `one_click_orders`; страница товара → `QuickOrderModal` → `orders` (через api/orders/quick). Рекомендация: унифицировать на один поток и одну таблицу (см. AUDIT-CLEANUP-2026.md).

---

## 3. Безопасность

### 3.1 RLS — текущее состояние и рекомендации

| Таблица | Ожидаемая модель | Рекомендация |
|---------|-------------------|--------------|
| `products`, `variant_products`, `product_variants` | Публичное чтение (SELECT), запись только service_role | Уже в admin-tables-migration.sql: SELECT для всех, ALL для service_role. |
| `categories` | Публичное чтение (активные), запись service_role | Аналогично: SELECT is_active = true, ALL для service_role. |
| `hero_slides` | Публичное чтение (активные), запись service_role | Аналогично. |
| `orders` | anon: INSERT; SELECT по id (для страницы заказа); UPDATE по id (для webhook). Остальное — service_role. | Проверить в Dashboard: есть ли политики INSERT для anon, SELECT по id, UPDATE по id. Если anon может SELECT * по всем заказам — сузить до SELECT по одному id (например, по id из запроса). |
| `one_click_orders` | Только service_role (вставка через API, чтение только в админке/Dashboard) | В миграции one-click-orders-table.sql RLS не включён. **Рекомендация:** включить RLS и разрешить доступ только service_role (см. скрипт ниже). |

### 3.2 Утечка service role key

- **Проверено:** `SUPABASE_SERVICE_ROLE_KEY` используется только в `lib/supabaseAdmin.ts` и в `scripts/seed-categories.ts`.
- `supabaseAdmin` импортируется только в API routes под `app/api/` (one-click-order, orders/quick, admin/*). В клиентские компоненты и в `supabaseClient.ts` не попадает.
- В бандл клиента попадают только `NEXT_PUBLIC_*` переменные; `SUPABASE_SERVICE_ROLE_KEY` не имеет префикса `NEXT_PUBLIC_`, на клиент не утекает.

---

## 4. Производительность

### 4.1 Индексы

- **orders:** в db-fix.sql есть `idx_orders_created_at`, `idx_orders_status` — достаточно для списков и фильтров по статусу.
- **one_click_orders:** в миграции есть только `idx_one_click_orders_created_at`. Имеет смысл добавить индекс по `status` для выборок в админке (см. скрипт).
- **products / variant_products:** slug, sort_order, category — см. admin-tables-migration.sql и db-fix.sql (slug unique, product_variants(product_id)).
- **hero_slides, categories:** sort_order, slug — индексы уже созданы в admin-tables-migration.sql.

### 4.2 Типы и nullable

- **orders.amount** — BIGINT, не null (правильно для копеек).
- **one_click_orders.price** — numeric; для цен в рублях допустимо. Если везде целые рубли — можно bigint в копейках по аналогии с orders (опционально).
- **one_click_orders.name** — nullable (опциональное поле) — ок.
- В каталоге много полей nullable (description, composition_size, category_slug и т.д.) — код это учитывает.

---

## 5. Рекомендации (краткий список)

1. **RLS для `one_click_orders`:** включить RLS и разрешить доступ только service_role (INSERT/SELECT/UPDATE/DELETE).
2. **orders RLS:** убедиться, что anon не может делать SELECT по всем заказам; только INSERT и SELECT/UPDATE по одному id (например, по id из query/body).
3. **Индекс:** добавить индекс по `one_click_orders(status)` для админских выборок.
4. **Типы Supabase:** сгенерировать типы для таблиц и убрать `(supabase as any)` в orders.ts, one-click-order, admin API.
5. **Унификация «1 клик»:** по желанию — один поток и одна таблица (например, только one_click_orders и QuickBuyModal везде).

---

## 6. SQL-скрипты

См. файл `scripts/migrations/supabase-audit-rls-indexes.sql`: RLS для `one_click_orders`, индекс по `status`, при необходимости — комментарии по проверке политик `orders`.
