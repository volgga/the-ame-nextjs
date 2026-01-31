# Отчёт: пропавшие товары и варианты

## Где была причина "пропажи"

1. **Фильтры в коде**  
   В `src/lib/products.ts` использовались строгие условия:
   - `is_active = true` (скрывались записи с `is_active = null` или `false`)
   - `is_hidden = false или null` (но в связке с `is_active` часть товаров отсекалась)

2. **Только таблица `products`**  
   В каталоге и на главной загружались только данные из `products`. Таблица `variant_products` (и варианты `product_variants`) в UI не использовались.

3. **Данные после переноса БД**  
   После переноса базы у части записей могли остаться `is_active = false`, `is_hidden = true` или `published_at = null` у `variant_products`, из‑за чего они не попадали под старые фильтры.

## Какие SQL-фиксы применены

- **`scripts/truncate-misc-tables.sql`**  
  Очистка таблиц (без DROP):
  - `TRUNCATE public.newsletter_subscriptions RESTART IDENTITY CASCADE;`
  - `TRUNCATE public.product_recommendations RESTART IDENTITY CASCADE;`

- **`scripts/fix_visibility.sql`**  
  Делаем все товары и варианты видимыми:
  - **products:** `is_active = true`, `is_hidden = false`
  - **variant_products:** `is_active = true`, `is_hidden = false`, `published_at = COALESCE(published_at, now())`
  - **product_variants:** `is_active = true`

Запуск: выполнить скрипты в Supabase SQL Editor (или через `psql`).

## Изменения в коде

- **Фильтры** в `products.ts` и в `variantProducts.ts` ослаблены: показываются все записи, где не скрыто явно:
  - `is_active` — показ, если `true` или `null`
  - `is_hidden` — показ, если `false` или `null`

- **Единый каталог**  
  Добавлены `getAllCatalogProducts()` и `getCatalogProductBySlug(slug)`:
  - каталог = `products` + `variant_products`;
  - страница товара по slug ищет сначала в `products`, затем в `variant_products`.

- **`src/lib/variantProducts.ts`**  
  Загрузка `variant_products` и маппинг в общий тип карточки (slug, title, price, image и т.д.).

## Проверка

- `npm run check-db` — счётчики по таблицам, число "видимых" по правилам UI, примеры slug из `products` и `variant_products`.
- После выполнения `fix_visibility.sql` и перезапуска приложения в каталоге и на главной должны отображаться все товары и варианты.
