# Схема Supabase (public) — ядро магазина

После чистки в `public` остаются **4 таблицы**: `products`, `variant_products`, `product_variants`, `orders`. Других таблиц/вью в коде и скриптах нет.

---

## 1. Таблицы (что осталось)

| Таблица | Назначение |
|---------|------------|
| **products** | Простые товары с одной ценой (букеты без вариантов, сувениры и т.п.) |
| **variant_products** | Товары с вариантами (размер/тип): заголовок, slug, min_price_cache |
| **product_variants** | Конкретные варианты (размер/название, цена) — принадлежат variant_products |
| **orders** | Заказы из корзины, сумма в копейках, статус оплаты, платеж Tinkoff |

Связь: **product_variants.product_id → variant_products.id** (один вариант принадлежит одному «вариантному» товару).  
**products** и **variant_products** — два независимых каталога; в приложении они объединяются в один список (каталог).

---

## 2. Колонки по таблицам

### products

| Колонка | Тип | PK | Nullable | Описание |
|---------|-----|----|----------|----------|
| id | UUID | ✓ | NOT NULL | Первичный ключ |
| name | TEXT | | NOT NULL | Название |
| description | TEXT | | NULL | Описание |
| composition_size | TEXT | | NULL | Состав и размер букета (ручной ввод) |
| price | NUMERIC | | NULL | Цена в рублях (одна на товар) |
| image_url | TEXT | | NULL | URL главного изображения |
| images | TEXT[] / JSONB | | NULL | Доп. изображения (если есть) |
| is_active | BOOLEAN | | NULL/true | Показывать в каталоге |
| is_hidden | BOOLEAN | | NULL/false | Скрыть с витрины (в админке остаётся) |
| is_preorder | BOOLEAN | | NULL/false | Предзаказ: на витрине вместо цены — «Предзаказ» |
| sort_order | INT | | NULL | Порядок вывода (в форме не редактируется) |
| slug | TEXT | | NULL/'' | URL-слаг (уникальный) |
| category_slugs | TEXT[] | | NULL | Массив слогов категорий (привязка к нескольким категориям) |
| created_at, updated_at | TIMESTAMPTZ | | NULL | Даты (если есть) |

В коде используются: `id`, `name`, `description`, `image_url`, `price`, `slug`, `is_active`, `is_hidden`, `is_preorder`, `sort_order`, `category_slug`, `category_slugs`.

### variant_products

| Колонка | Тип | PK | Nullable | Описание |
|---------|-----|----|----------|----------|
| id | INT / SERIAL | ✓ | NOT NULL | Первичный ключ |
| name | TEXT | | NOT NULL | Название |
| slug | TEXT | | NULL/'' | URL-слаг (уникальный) |
| description | TEXT | | NULL | Описание |
| image_url | TEXT | | NULL | URL главного изображения |
| min_price_cache | NUMERIC | | NULL | Мин. цена по вариантам (для каталога) |
| is_active | BOOLEAN | | NULL/true | Показывать в каталоге |
| is_hidden | BOOLEAN | | NULL/false | Скрыть из каталога |
| sort_order | INT | | NULL | Порядок вывода |
| category_slug | TEXT | | NULL | Основная категория (для совместимости) |
| category_slugs | TEXT[] | | NULL | Массив слогов категорий (добавлено миграцией) |
| published_at | TIMESTAMPTZ | | NULL | Дата публикации (если есть) |

В коде используются: `id`, `slug`, `name`, `description`, `image_url`, `min_price_cache`, `is_active`, `is_hidden`, `sort_order`, `category_slug`, `category_slugs`.

### product_variants

| Колонка | Тип | PK | Nullable | Описание |
|---------|-----|----|----------|----------|
| id | INT / SERIAL | ✓ | NOT NULL | Первичный ключ |
| product_id | INT | FK → variant_products.id | NOT NULL | Родительский variant_product |
| title | TEXT | | NOT NULL | Название варианта (например «25шт», «S») |
| composition | TEXT | | NULL | Состав и размер (добавлено миграцией) |
| price | NUMERIC | | NOT NULL | Цена в рублях |
| is_preorder | BOOLEAN | | NULL/false | Предзаказ (добавлено миграцией) |
| is_active | BOOLEAN | | NULL/true | Учитывать в min_price и показе |
| sort_order | INT | | NULL | Порядок вариантов |
| image_url | TEXT | | NULL | Фото варианта (если есть) |
| created_at, updated_at | TIMESTAMPTZ | | NULL | Даты (если есть) |

**Важно:** В БД колонка называется `title`, не `name`. В коде админки используется `title`.

В коде каталог **не читает product_variants напрямую** — использует `variant_products` и поле `min_price_cache`. Связь нужна для целостности и для будущего выбора варианта на карточке.

### orders

| Колонка | Тип | PK | Nullable | Описание |
|---------|-----|----|----------|----------|
| id | UUID | ✓ | NOT NULL | Первичный ключ |
| items | JSONB | | NOT NULL | Позиции корзины [{id, name, price, quantity}] |
| amount | BIGINT | | NOT NULL | Сумма заказа в **копейках** |
| currency | TEXT | | NOT NULL | Валюта (RUB) |
| customer | JSONB | | NOT NULL | Данные клиента/доставки |
| status | TEXT | | NOT NULL | Статус: created, payment_pending, paid, canceled, failed |
| tinkoff_payment_id | TEXT | | NULL | ID платежа Tinkoff |
| payment_provider | TEXT | | NULL | Провайдер оплаты (default 'tinkoff') |
| payment_id | TEXT | | NULL | Универсальный ID платежа (можно = tinkoff_payment_id) |
| created_at | TIMESTAMPTZ | | NOT NULL | Дата создания |
| updated_at | TIMESTAMPTZ | | NOT NULL | Дата обновления |

В коде используются: `id`, `items`, `amount`, `currency`, `customer`, `status`, `tinkoff_payment_id`, `created_at`, `updated_at`. Поле **amount** — единственное для суммы (в копейках); если в БД было **total_amount**, его нужно привести к **amount** (см. `scripts/db-fix.sql`).

---

## 3. Связи (FK)

- **product_variants.product_id → variant_products.id**  
  ON DELETE CASCADE: при удалении variant_product удаляются все его варианты (нет «осиротевших» вариантов).

- **orders**: связей с `products` / `variant_products` / `user_id` в текущем коде нет. Если в БД есть `user_id` и не используется auth — сделать колонку nullable или убрать FK, чтобы не ломалось.

---

## 4. Индексы и ограничения

- **products.slug** — UNIQUE (поиск по slug, один товар — один slug).
- **variant_products.slug** — UNIQUE (аналогично).
- **product_variants**: индекс по **product_id** (фильтр по родителю), при необходимости UNIQUE(product_id, size/name) — по желанию.
- **orders**: индекс по **created_at DESC** (списки заказов), по **status** (фильтр по статусу).

Все это добавляется в `scripts/db-fix.sql`.

---

## 5. RLS (политики)

Рекомендуемый режим:

| Таблица | SELECT (anon) | INSERT (anon) | UPDATE (anon) |
|---------|----------------|---------------|---------------|
| products | ✓ (каталог) | — | — |
| variant_products | ✓ (каталог) | — | — |
| product_variants | ✓ (если нужен выбор варианта) | — | — |
| orders | ✓ по id (страница успеха, письмо) | ✓ (оформление заказа) | ✓ по id (колбэк Tinkoff по id) |

- **products / variant_products / product_variants**: только чтение для всех — каталог и карточки публичные.
- **orders**:  
  - **INSERT** — разрешён для anon (создание заказа из корзины).  
  - **SELECT** — в текущих скриптах разрешён для всех строк; безопаснее ограничить выборку по `id` (клиент передаёт только свой `orderId` после оплаты). Полный список заказов — только через service role или админку.  
  - **UPDATE** — нужен для колбэка Tinkoff (обновление статуса по `id`). Имеет смысл ограничить политику: обновлять только `status` и `tinkoff_payment_id`/`payment_id`, и только по известному `id`.

В `scripts/orders-table.sql` и `orders-add-columns.sql` уже заданы политики «Allow insert/select/update for anon» на orders; при необходимости их можно заменить на более строгие (SELECT/UPDATE только по `id`).

---

## 6. Что за что отвечает (кратко)

- **products** — простые товары с одной ценой (id = UUID, в корзине как этот id).
- **variant_products** — «шапка» товара с вариантами (id = int, в корзине как `vp-{id}`); отображается в каталоге с ценой от `min_price_cache`.
- **product_variants** — строки вариантов (размер/тип, цена) для каждого variant_product; обновление `min_price_cache` у variant_products обычно по триггеру или при сохранении вариантов.
- **orders** — заказ из корзины: позиции в `items`, сумма в `amount` (копейки), контакт и доставка в `customer`, статус оплаты в `status`; Tinkoff пишет ID платежа в `tinkoff_payment_id` / `payment_id`.

**hero_slides** — используется для слайдов на главной (см. docs/SLIDES-SYSTEM.md).  
**admin_users, new_clients, discount_rules** — в коде не используются; удалять по желанию.
