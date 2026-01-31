# Аудит Supabase БД (nextjs-project)

Дата: после чистки схемы и фикса FK/индексов.

---

## 1. Какие объекты остались и зачем

### Таблицы (по коду и скриптам)

| Объект | Тип | Назначение в проекте |
|--------|-----|----------------------|
| **products** | table | Простые товары (одна цена). Каталог, карточка, корзина, заказы. |
| **variant_products** | table | Товары с вариантами (slug, min_price_cache). Каталог, карточка, корзина (id как `vp-{id}`). |
| **product_variants** | table | Варианты (размер/тип, цена). В коде не читаются напрямую; источник для min_price_cache и целостности. |
| **orders** | table | Заказы из корзины: items, amount (копейки), customer, status, оплата Tinkoff. |

### View / функции / триггеры / enum

- **View:** в коде не используются. Раньше был `products_with_categories` — удалён скриптом `drop-unused-tables.sql`.
- **Функции:** `set_updated_at()` — триггер для `orders.updated_at` (в `orders-table.sql` / `orders-add-columns.sql`).
- **Триггеры:** `orders_updated_at` на `public.orders` (BEFORE UPDATE).
- **Enum:** в коде статусы заказа — строки (`created`, `payment_pending`, `paid`, `canceled`, `failed`), отдельного enum в БД нет.

### Что не используется кодом и можно не трогать / удалить в БД

- Таблицы **categories**, **product_categories**, **variant_product_categories**, **products_with_categories**, **newsletter_subscriptions**, **product_recommendations**, **profiles**, **promo_code_usage**, **reviews**, **variant_items** — уже удалены скриптом `drop-unused-tables.sql`. В коде на них ссылок нет.
- **hero_slides** — используется: слайды на главной (см. docs/SLIDES-SYSTEM.md).
- Если в БД остались **admin_users**, **new_clients**, **discount_rules** — в nextjs-project не используются; удалять по желанию.

---

## 2. Связи (FK) и индексы

### FK (текущие / нужные)

| Связь | Назначение |
|-------|------------|
| **product_variants.product_id → variant_products.id** (ON DELETE CASCADE) | Варианты принадлежат «вариантному» товару; при удалении товара удаляются варианты. |
| **orders** | FK на другие таблицы в коде не используются. Если есть user_id → auth.users — при отсутствии auth лучше сделать nullable или снять FK (см. db-fix.sql). |

### Индексы (есть / нужны)

| Таблица | Индекс | Назначение |
|---------|--------|------------|
| products | UNIQUE(slug) где slug не пустой | Поиск по slug, карточка товара. |
| variant_products | UNIQUE(slug) где slug не пустой | То же для вариантных товаров. |
| product_variants | (product_id) | Выборка вариантов по товару. |
| orders | (created_at DESC), (status) | Списки заказов, фильтр по статусу. |

Добавляются скриптом `scripts/db-fix.sql`.

---

## 3. Поля orders: оплата/корзина и использование в коде

### Нужны для корзины/оплаты

| Поле | Тип | Использование в коде |
|------|-----|----------------------|
| id | UUID | PK, ответ API, страница успеха. |
| items | JSONB | Позиции корзины (id, name, price, quantity). |
| amount | BIGINT | Сумма в копейках. Пишется при создании, читается на успехе оплаты и в API. |
| currency | TEXT | RUB. |
| customer | JSONB | Контакт и доставка. |
| status | TEXT | created → payment_pending → paid / canceled / failed. |
| tinkoff_payment_id | TEXT | ID платежа Tinkoff, колбэк и страница успеха. |
| payment_id | TEXT | Универсальный ID платежа (дублирует/дополняет tinkoff_payment_id). |
| payment_provider | TEXT | Провайдер (default 'tinkoff'). |
| created_at, updated_at | TIMESTAMPTZ | Ответы API. |

### Проверка на рассинхрон

- **amount vs total_amount:** код везде использует **amount** (bigint, копейки). Если в БД было total_amount — скрипт `db-fix.sql` переименовывает в amount. После применения db-fix рассинхрона нет.
- **tinkoff_payment_id:** код пишет и читает это поле. В db-fix добавлено `ADD COLUMN IF NOT EXISTS tinkoff_payment_id`, чтобы колонка была при её отсутствии в БД.
- Остальные поля orders (items, customer, status, payment_id, payment_provider, created_at, updated_at) — в коде есть в insert/select/update; ожидается, что они есть в БД после db-fix.

---

## 4. Запросы для ручной проверки

Используй **scripts/db-audit.sql** (только чтение):

- Список таблиц, колонок, FK, индексов, view, функций из information_schema / pg_catalog.
- Проверка «сиротских» записей: product_variants без variant_products.
- При необходимости в конце — `SELECT pg_notify('pgrst', 'reload schema');`.

---

## 5. Что можно удалить в Supabase (если ещё есть)

Удалять только после проверки, что в коде и админках нет обращений.

| Объект | Действие |
|--------|----------|
| admin_users | DROP TABLE при отсутствии использования. |
| hero_slides | Используется — НЕ удалять. |
| new_clients | DROP TABLE при отсутствии использования. |
| discount_rules | DROP TABLE при отсутствии использования. |

Скрипт удаления не включён в репозиторий — выполнять отдельно при необходимости.
