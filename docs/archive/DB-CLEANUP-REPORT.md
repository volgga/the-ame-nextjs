# Отчёт: чистка Supabase БД (nextjs-project)

## 0. Анализ зависимостей

Поиск по проекту (TS/JS): `from('...')`, RPC, SQL, скрипты.

| Таблица / объект | Где используется | Критичность |
|-------------------|------------------|-------------|
| **products** | `src/lib/products.ts`, `src/lib/catalogServer.ts`, каталог, карточка товара, заказы (пересчёт) | **critical** |
| **variant_products** | `src/lib/variantProducts.ts`, `src/lib/catalogServer.ts`, каталог, карточка товара, заказы | **critical** |
| **product_variants** | Не вызывается напрямую из кода; в БД — источник цен вариантов и `min_price_cache` у variant_products | **critical** (не удалять) |
| **orders** | `src/services/orders.ts`, API заказов, оплата Tinkoff | **critical** |
| **categories** | Только в original-project и скриптах; в nextjs-project не используется | optional |
| **product_categories** | Только в original-project, products_data.sql, diagnose.sql | optional |
| **variant_product_categories** | Только в original-project, products_data.sql | optional |
| **products_with_categories** | View; только в original-project (useProducts, useProductBySlug) | optional |
| **newsletter_subscriptions** | Не используется в nextjs-project | unused |
| **product_recommendations** | Не используется в nextjs-project | unused |
| **profiles** | Не используется в nextjs-project | unused |
| **promo_code_usage** | Не используется в nextjs-project (промокод только в UI) | unused |
| **reviews** | Не используется в nextjs-project (ReviewsSection — заглушка) | unused |
| **variant_items** | Только в check-db.ts и products_data.sql; в приложении не используется | unused |

---

## 1. Кандидаты на удаление

- `newsletter_subscriptions` — не используется → **удаляем**
- `categories` — не используется в nextjs-project → **удаляем**
- `product_categories` — не используется → **удаляем**
- `product_recommendations` — не используется → **удаляем**
- `profiles` — не используется → **удаляем**
- `promo_code_usage` — не используется → **удаляем**
- `reviews` — не используется, блок отзывов убран с главной → **удаляем**
- `variant_items` — не используется (комплектация варианта; при необходимости можно восстановить из бэкапа) → **удаляем**
- `variant_product_categories` — не используется → **удаляем**
- **View** `products_with_categories` — не используется → **удаляем**

---

## 2. Что не удаляем (чтобы не сломать товары и каталог)

- **products** — каталог, карточка товара, заказы.
- **variant_products** — каталог, карточка товара, заказы.
- **product_variants** — варианты товаров (размер/цена); от них считается `min_price_cache` у variant_products. Удалять нельзя.
- **orders** — заказы и оплата.

По категориям и фильтрам:

- В nextjs-project нет запросов к `categories` и `product_categories`. Фильтр по категории в каталоге — только по полю в объекте (например, "Разное"), без обращений к БД.
- Решение: **удаляем** `categories`, `product_categories`, `variant_product_categories` и view; фильтры в UI не трогаем (они не зависят от этих таблиц).

По `variant_items`:

- В коде nextjs-project не используется. Обычно это связь «вариант → состав» (product_variants → variant_items). Удаление `variant_items` не ломает `product_variants`; при необходимости состав можно хранить в полях варианта или восстановить таблицу из бэкапа.

---

## 3. SQL для безопасного удаления

Скрипт: **`scripts/drop-unused-tables.sql`**.

Порядок:

1. Удаление view `products_with_categories`.
2. Удаление связующих таблиц: `product_categories`, `variant_product_categories`.
3. Удаление таблиц без зависимостей от каталога/заказов: `newsletter_subscriptions`, `product_recommendations`, `promo_code_usage`, `reviews`, `profiles`.
4. Удаление `variant_items`.
5. Удаление `categories`.
6. `SELECT pg_notify('pgrst', 'reload schema');`

Запуск: Supabase Dashboard → SQL Editor → вставить содержимое `scripts/drop-unused-tables.sql` и выполнить.

---

## 4. Удаление блока «Отзывы» с главной

- Удалён импорт и использование `ReviewsSection` в `src/app/page.tsx`.
- Запросов к таблице `reviews` в nextjs-project не было (данные были заглушкой).
- Компонент `src/components/home/ReviewsSection.tsx` оставлен в репозитории (можно удалить файл при желании).

---

## 5. Итоговая схема и аудит

После чистки для работы магазина остаются:

| Таблица | Назначение |
|---------|------------|
| **products** | Товары без вариантов (букеты и т.п.) |
| **variant_products** | Товары с вариантами (заголовок, slug, min_price_cache) |
| **product_variants** | Варианты (размер/название, цена, is_active) |
| **orders** | Заказы, статусы, оплата Tinkoff |

Минимальная схема e-commerce в этом проекте: продукты, варианты, заказы. Промокоды и пользователи (profiles) в коде не используются — при необходимости можно добавить отдельно.

Рекомендации:

- **orders**: при развитии оплаты — поля для id платежа, статуса оплаты, возможно ссылка на профиль/гостя.
- **Индексы**: убедиться в индексах по `products.slug`, `variant_products.slug`, `orders.id`, по дате/статусу заказов при выборках.
- **RLS**: проверить политики на `products`, `variant_products`, `orders` (чтение для anon, запись заказов через service role или отдельный API).

---

## 6. Краткие списки и чеклист

**Удаляем сейчас (скриптом):**  
`newsletter_subscriptions`, `categories`, `product_categories`, `product_recommendations`, `profiles`, `promo_code_usage`, `reviews`, `variant_items`, `variant_product_categories`, view `products_with_categories`.

**Не трогаем:**  
`products`, `variant_products`, `product_variants`, `orders`.

**Изменённые файлы в репо (для удаления отзывов с главной):**

- `src/app/page.tsx` — убран импорт и блок `<ReviewsSection />`.
- `scripts/check-db.ts` — из списка таблиц убраны удалённые, добавлена `orders`.
- `scripts/drop-unused-tables.sql` — новый скрипт удаления.
- `docs/DB-CLEANUP-REPORT.md` — этот отчёт.

**Чеклист после удаления:**

1. Выполнить бэкап (Backups или export CSV `products`, `product_variants`, `variant_products`).
2. Выполнить `scripts/drop-unused-tables.sql` в Supabase SQL Editor.
3. Проверить: главная, каталог, карточка товара, корзина, оформление заказа.
4. Запустить `npm run check-db`: должны быть только `products`, `product_variants`, `variant_products`, `orders`.
5. При необходимости удалить файл `src/components/home/ReviewsSection.tsx`.
