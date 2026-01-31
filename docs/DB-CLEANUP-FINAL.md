# Чистка Supabase БД — финальный отчёт

## A) Финальный SQL-скрипт

Файл: **`scripts/drop-unused-tables.sql`**

В скрипте удаляются **только**:
- `newsletter_subscriptions`
- `categories`
- `product_categories`
- `product_recommendations`
- `profiles`
- `promo_code_usage`
- `reviews`
- `variant_items`
- `variant_product_categories`
- view **`products_with_categories`** (через `DROP VIEW IF EXISTS`)

**Не трогаем:** `products`, `product_variants`, `variant_products`, `orders`.

В конце скрипта: `SELECT pg_notify('pgrst', 'reload schema');`

---

## B) Инструкции запуска SQL

1. **Куда вставить:** Supabase Dashboard → **SQL Editor** → вставить весь текст из `scripts/drop-unused-tables.sql`.
2. **Что нажать:** кнопка **Run** (или Ctrl/Cmd+Enter).
3. **После выполнения:** перезапустить dev-сервер (`npm run dev`), если он был запущен — чтобы приложение работало с обновлённой схемой API.

---

## C) Проект под удалённые таблицы

- В коде **нет** обращений к удалённым таблицам. Поиск по `.from('...')` даёт только: `products`, `variant_products`, `orders` (и в check-db — `product_variants`).
- Блок отзывов с главной убран; компонент `ReviewsSection.tsx` удалён.
- **Сборка:** `npm run build` — успешна.
- **Линт:** `npm run lint` — исправлены замечания, связанные с чисткой (unused `e` в catch, кавычки в docs/return). Оставшиеся ошибки линта — в других файлах (React effects/refs), не связаны с удалением таблиц.

---

## D) Итоговые списки

### Удаляемые объекты (таблицы и view)

| # | Объект | Тип |
|---|--------|-----|
| 1 | `products_with_categories` | view |
| 2 | `product_categories` | table |
| 3 | `variant_product_categories` | table |
| 4 | `newsletter_subscriptions` | table |
| 5 | `product_recommendations` | table |
| 6 | `promo_code_usage` | table |
| 7 | `reviews` | table |
| 8 | `profiles` | table |
| 9 | `variant_items` | table |
| 10 | `categories` | table |

### Оставляемые таблицы

- `products`
- `product_variants`
- `variant_products`
- `orders`

### Изменённые файлы в репо

| Файл | Изменение |
|------|-----------|
| `scripts/drop-unused-tables.sql` | Финальный скрипт удаления (создан/обновлён) |
| `src/app/page.tsx` | Убран импорт и блок `<ReviewsSection />` |
| `src/components/home/ReviewsSection.tsx` | Удалён |
| `scripts/check-db.ts` | Список таблиц: только products, product_variants, variant_products, orders |
| `src/app/api/orders/route.ts` | `catch (e)` → `catch` (unused var) |
| `src/app/api/payments/tinkoff/init/route.ts` | `catch (e)` → `catch` (unused var) |
| `src/app/docs/return/page.tsx` | Кавычки в тексте заменены на « » (линт) |
| `docs/DB-CLEANUP-REPORT.md` | Отчёт по анализу (ранее) |
| `docs/DB-CLEANUP-FINAL.md` | Этот финальный отчёт |

### Чеклист проверки сайта после выполнения SQL

1. **Бэкап:** перед SQL сделан бэкап или export CSV таблиц `products`, `product_variants`, `variant_products`.
2. **Выполнен скрипт** `scripts/drop-unused-tables.sql` в Supabase SQL Editor → Run.
3. **Главная:** открыть `/` — нет блока отзывов, товары и баннеры отображаются.
4. **Каталог:** открыть `/catalog` — список товаров загружается.
5. **Карточка товара:** открыть любую ссылку из каталога (например `/product/...`) — страница открывается, цена и описание на месте.
6. **Корзина:** добавить товар в корзину, открыть `/cart` — позиции и сумма отображаются.
7. **Оформление заказа:** заполнить форму и отправить — заказ создаётся, редирект на оплату (или сообщение об успехе).
8. **Проверка БД:** выполнить `npm run check-db` — в выводе только таблицы `products`, `product_variants`, `variant_products`, `orders`; ошибок доступа к удалённым таблицам нет.
