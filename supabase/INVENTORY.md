# Инвентаризация таблиц Supabase — The Ame

## Типы клиентов Supabase

1. **supabaseClient** (`src/lib/supabaseClient.ts`)
   - Использует: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Использование: клиентские компоненты (публичное чтение контента)

2. **supabaseServer** (`src/lib/supabaseServer.ts`)
   - Использует: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Использование: API routes (публичное чтение + вставка заказов/лидов)

3. **supabaseAdmin** (`src/lib/supabaseAdmin.ts`)
   - Использует: `SUPABASE_SERVICE_ROLE_KEY`
   - Использование: админские API routes (полный доступ)

## Карта таблиц по типу доступа

### 1. Публичное чтение (Public Read-Only)

Эти таблицы читаются публично на сайте и должны иметь RLS policy `SELECT USING (true)`.

| Таблица | Использование | Файлы |
|---------|--------------|-------|
| `products` | Каталог товаров (простые товары) | `src/lib/products.ts`, `src/lib/catalogServer.ts` |
| `variant_products` | Каталог товаров (вариантные товары) | `src/lib/variantProducts.ts`, `src/lib/catalogServer.ts` |
| `product_variants` | Варианты товаров | `src/lib/variantProducts.ts` |
| `categories` | Категории каталога | `src/lib/categories.ts`, `src/app/api/categories/route.ts` |
| `subcategories` | Подкатегории | `src/lib/subcategories.ts` |
| `flowers` | Цветы для фильтрации | `src/lib/flowers.ts` |
| `blog_posts` | Статьи блога | `src/lib/blog.ts`, `src/app/api/blog/route.ts` |
| `hero_slides` | Слайды на главной | `src/lib/heroSlides.ts` |
| `home_collections` | Коллекции на главной | `src/lib/homeCollections.ts` |
| `home_reviews` | Отзывы, FAQ, About, Order Block (хранит разные данные) | `src/lib/homeReviews.ts`, `src/lib/homeFaq.ts`, `src/lib/homeAbout.ts`, `src/lib/homeOrderBlock.ts` |
| `corporate_page_settings` | Страница корпоративов | `src/lib/corporatePage.ts` |
| `about_page` | Страница "О нас" | `src/lib/about.ts` |
| `product_details` | Детали товаров (kit) | `src/lib/productDetails.ts` |
| `occasions` | Поводы для букетов | `src/app/api/admin/occasions/route.ts` (но читается публично) |
| `delivery_zones` | Зоны доставки | `src/lib/deliveryZones.ts` |
| `delivery_days` | Дни доставки | `src/app/api/delivery-time-options/route.ts` |
| `delivery_time_slots` | Временные слоты доставки | `src/app/api/delivery-time-options/route.ts` |
| `promo_codes` | Промокоды (проверка) | `src/app/api/cart/promocode/apply/route.ts`, `src/app/api/orders/route.ts` |
| `minimum_order_rules` | Правила минимального заказа | `src/app/api/minimum-order/route.ts`, `src/services/orders.ts` |
| `add_on_products_categories` | Дополнительные товары | `src/lib/addOnProducts.ts` |

### 2. Публичная вставка (Public Insert-Only)

Эти таблицы должны разрешать INSERT всем, но НЕ разрешать SELECT/UPDATE/DELETE публично.

| Таблица | Использование | Файлы |
|---------|--------------|-------|
| `orders` | Заказы из корзины | `src/services/orders.ts` (INSERT через anon, SELECT/UPDATE через service role в notify) |
| `one_click_orders` | Заявки "Купить в 1 клик" | `src/app/api/one-click-order/route.ts` (через service role, но можно через anon) |
| `leads` | Лиды (формы) | `src/app/api/forms/*/route.ts` (через service role, но можно через anon) |
| `gift_hints` | Намеки о подарке | `src/app/api/gift-hints/route.ts` (через service role, но можно через anon) |

**ВАЖНО**: Сейчас `orders`, `leads`, `one_click_orders`, `gift_hints` вставляются через `service_role` в API routes. Это безопасно, но можно перевести на `anon` с RLS policy для INSERT.

### 3. Join таблицы (Internal)

Эти таблицы используются для связей и должны иметь ограниченный доступ.

| Таблица | Использование | Файлы |
|---------|--------------|-------|
| `product_flowers` | Связь товаров и цветов | `src/lib/flowers.ts` |
| `product_occasions` | Связь товаров и поводов | `src/app/api/admin/products/[id]/occasions/route.ts` |
| `product_subcategories` | Связь товаров и подкатегорий | `src/app/api/admin/products/[id]/subcategories/route.ts` |

**Политика**: SELECT разрешен только если связанные сущности публичны. INSERT/UPDATE/DELETE только через service role.

### 4. Админские таблицы (Admin-Only)

Эти таблицы используются только в админке через `getSupabaseAdmin()`.

| Таблица | Использование | Файлы |
|---------|--------------|-------|
| Все таблицы выше при записи | Админка редактирует все таблицы | `src/app/api/admin/**/*.ts` |

**Политика**: Доступ только через service role. RLS должен блокировать anon доступ на запись.

## Текущее состояние RLS

Из найденных миграций:
- ✅ `corporate_page_settings` — RLS включен, есть policies
- ✅ `minimum_order_rules` — нужно проверить
- ❓ Остальные таблицы — статус неизвестен (вероятно RLS выключен)

## Рекомендации по безопасности

1. **Все таблицы должны иметь RLS включен**
2. **Публичные таблицы**: `SELECT USING (true)` для чтения, блокировка INSERT/UPDATE/DELETE для anon
3. **Таблицы заказов/лидов**: `INSERT WITH CHECK (true)` для anon, блокировка SELECT/UPDATE/DELETE для anon
4. **Админские операции**: Всегда через service role в API routes (уже реализовано)
5. **Join таблицы**: SELECT только если связанные сущности доступны, запись только через service role
