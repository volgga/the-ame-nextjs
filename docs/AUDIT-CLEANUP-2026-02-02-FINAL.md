# Аудит и чистка — The Ame (Next.js + Supabase) — 2026-02-02

## 1) Структура проекта

| Область | Путь | Назначение |
|--------|------|------------|
| API routes | `src/app/api/**` | App Router: admin (products, categories, slides), orders, payments, categories, gift-hints, products quick-view |
| Supabase (клиент) | `src/lib/supabaseClient.ts` | Публичный каталог, категории |
| Supabase (сервер) | `src/lib/supabaseServer.ts`, `supabaseAdmin.ts` | Серверные запросы, админка (service role) |
| Товары | `src/lib/products.ts`, `variantProducts.ts` | products + variant_products; объединённый каталог в `getAllCatalogProducts()` |
| Категории | `src/lib/categories.ts`, `catalogCategories.ts` | categories, фильтрация по category_slug/category_slugs |
| Админка | `src/app/admin/**`, `src/components/admin/**` | Товары, категории, слайды; модалки в page.tsx |

## 2) Таблицы Supabase (сверка с кодом)

| Таблица | Используется в коде | Поля (редактируемые в UI) |
|---------|---------------------|---------------------------|
| products | products.ts, api/admin/products | id, name, slug, description, composition_size, height_cm, width_cm, price, image_url, images, is_active, is_hidden, is_preorder, sort_order, category_slug, category_slugs |
| variant_products | variantProducts.ts, api/admin/products | id, name, slug, description, image_url, min_price_cache, is_active, is_hidden, sort_order, category_slug, category_slugs |
| product_variants | api/admin/products/[id]/variants, utils (recalcMinPrice) | id, product_id, title, composition, height_cm, width_cm, price, is_preorder, is_active, sort_order, image_url |
| categories | categories.ts, api/categories, api/admin/categories | id, name, slug, sort_order, is_active, description |
| hero_slides | heroSlides.ts, api/admin/slides | id, image_url, sort_order, is_active |
| orders | services/orders.ts, api/orders | id, items, amount, currency, customer, status, tinkoff_payment_id, payment_id |
| gift_hints | api/gift-hints | — |
| one_click_orders | api/one-click-order | — |

**Join-таблица product_categories:** в коде не используется; привязка категорий через `category_slugs` (TEXT[]) в products и variant_products.

### UI поле → payload → колонка БД (админка товаров)

| UI (модалка) | Payload (PATCH) | Колонка БД (products / variant_products) | Тип |
|--------------|-----------------|------------------------------------------|-----|
| Название | name | name | TEXT |
| Описание | description | description | TEXT |
| Состав | composition_size | composition_size | TEXT (только products) |
| Высота/ширина | height_cm, width_cm | height_cm, width_cm | INT (только products) |
| Цена | price | price / min_price_cache | NUMERIC |
| Главное фото | image_url | image_url | TEXT |
| Доп. фото | images | images | TEXT[] |
| Категории | category_slugs | category_slugs, category_slug | TEXT[], TEXT |
| Скрыт/предзаказ | is_hidden, is_preorder | is_hidden, is_preorder | BOOLEAN |
| Порядок | не отправляется при edit | sort_order | INT (не перезаписывается) |

**Сортировка каталога:** единый источник — `sort_order`. В `getAllProducts()` и `getAllVariantProducts()` — `order('sort_order', { ascending: true })`. В `getAllCatalogProducts()` объединённый массив сортируется по `sortOrder`, затем `createdAt`, затем `id`. Редактирование товара не меняет `sort_order` (в PATCH он удаляется из updates).

## 3) Найденные проблемы и приоритеты

| Приоритет | Проблема | Решение |
|-----------|----------|---------|
| P1 | dump.backup в корне — не в .gitignore | Добавить `*.backup`, `dump.backup` в .gitignore |
| P1 | z-index модалок: 999 vs header 40 — несогласованная система | Привести к слоям: overlay/modal wrapper z-50 (выше header z-40) |
| P2 | console.log в app (admin products, page.tsx) — только для dev | Оставить за NODE_ENV === "development" (уже есть) |
| P2 | Админка: редактирование товара | Уже исправлено: PATCH, все поля, sort_order не перезаписывается, валидация image_url ослаблена |
| P3 | products_data.sql в корне | Опционально добавить в .gitignore (данные) |

## 4) Проверки

- **TypeScript:** `npx tsc --noEmit` — без ошибок.
- **Edit submit:** вызывается `handleEditSubmit` → PATCH `/api/admin/products/:id`; POST используется только для создания.
- **API ошибки:** при валидации возвращается `{ error, details, fieldErrors }`.
- **Каталог:** порядок по sort_order; админ reorder через POST /api/admin/products/reorder.

## 5) Список изменений (коммиты)

1. **chore: audit & cleanup** — docs/AUDIT-CLEANUP-2026-02-02-FINAL.md, .gitignore (dump.backup, *.backup).
2. **fix: modal z-index layering** — единый слой модалок z-50 (выше header z-40): admin products, admin categories, admin slides, GiftHintModal, ProductPageClient, FullscreenViewer, ContactsModal. CartDrawer, QuickViewModal, QuickBuyModal оставлены на z 200/201 по дизайну.
3. (Уже сделано ранее) fix: admin product update persists all fields; fix: API validation image_url + fieldErrors.
