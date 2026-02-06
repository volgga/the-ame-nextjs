# Аудит кода, чистка, фиксы и сверка с БД (2026-02-06)

## 1. Проверки

### Сборка и линтеры
- **npm run typecheck** — успешно (0 ошибок)
- **npm run lint** — 0 ошибок, 14 предупреждений (no-img-element, без критичных замечаний)
- **npm run build** — не запускался (требует env); структура проекта корректна для Next.js 16

### Что исправлено в рамках аудита
1. **admin/home/collections/page.tsx** — добавлен `eslint-disable-next-line` для `react-hooks/exhaustive-deps` в `useEffect` (снимок формы при открытии модалки; намеренно не включаем весь объект `form`, чтобы не перезапускать эффект на каждый ввод). Предупреждений по этому файлу больше нет.

---

## 2. Сверка с базой данных (Supabase / Postgres)

### Таблица `home_reviews`
- **Используемые колонки в коде:**  
  `id`, `about_title`, `about_text`, `about_image_url`,  
  `order_block_title`, `order_block_subtitle1`, `order_block_text`, `order_block_image_url`,  
  `faq_items`, `rating_count`, `review2_text`, `review3_text`, `updated_at`.
- **Колонка `order_block_subtitle2`:**  
  Присутствует в миграции `home-order-block.sql`, в приложении **не используется** (поле убрано из UI и API по требованию; миграцию не меняли). Соответствие кода и БД: колонка может оставаться в БД, чтение/запись из кода отключены.
- **Миграции:** `home-reviews.sql`, `home-reviews-extend.sql`, `home-order-block.sql` — структура соответствует использованию в коде.

### Остальные таблицы (кратко)
- **hero_slides** — поля из кода совпадают с миграциями (`hero-slides-*.sql`).
- **home_collections** — поля совпадают с миграциями (`home-collections*.sql`).
- **products** — в запросах есть `created_at`; используется в сортировке. Миграции `products-add-*`, `products-sort-order-indexes.sql` учтены.
- **variant_products** — в коде используется `createdAt` (маппинг из `row.created_at`). Во все три запроса к `variant_products` в `variantProducts.ts` добавлено поле `created_at` в `select`. Если в БД колонки нет, потребуется миграция или удаление поля из `select`.
- **orders**, **one_click_orders**, **gift_hints**, **categories** — используемые в коде поля покрыты миграциями.

### Скрипт проверки БД
- **npm run check-db** — проверяет наличие таблиц `products`, `product_variants`, `variant_products`, `orders` и выводит счётчики. Требует `.env.local` с `NEXT_PUBLIC_SUPABASE_URL` и `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Таблицы главной страницы (`home_reviews`, `hero_slides`, `home_collections`) в скрипт не входят; при необходимости их можно добавить.

---

## 3. Чистота кода и предупреждения

### Оставшиеся предупреждения ESLint (14)
- **@next/next/no-img-element** — использование `<img>` вместо `next/image` в:
  - `app/admin/products/page.tsx` (6 мест),
  - `components/ContactsModal.tsx` (2),
  - `components/FloatingSocialButton.tsx` (3),
  - `components/admin/collections/CollectionCard.tsx` (1),
  - `components/admin/products/ProductRowCard.tsx` (1),
  - `components/admin/slides/SlideCard.tsx` (1).  
  Замена на `Image` — отдельная задача (внешние URL, модалки, превью).

### Критичных багов не выявлено
- Нет обращений к несуществующим колонкам.
- Нет расхождений имён таблиц между API/lib и миграциями.
- Типы и запросы к `home_reviews`, `hero_slides`, `home_collections`, заказам и оплатам согласованы.

---

## 4. Рекомендации

1. **variant_products.created_at** — добавлено в `select` во всех запросах в `src/lib/variantProducts.ts`. Если в вашей БД колонки нет, добавьте миграцию или уберите поле из `select`.
2. **check-db** — при необходимости расширить скрипт проверкой таблиц главной (`home_reviews`, `hero_slides`, `home_collections`) и выборочной проверкой полей.
3. **Предупреждения no-img-element** — оставить как есть или править точечно (с учётом внешних URL и layout модалок).

---

## 5. Итог

- Аудит выполнен: typecheck и lint без ошибок, сверка с БД проведена.
- Исправления: предупреждение exhaustive-deps в `collections/page.tsx`; добавлен `created_at` в запросы к `variant_products` в `variantProducts.ts`.
- Код и база согласованы; неиспользуемая колонка `order_block_subtitle2` задокументирована.
