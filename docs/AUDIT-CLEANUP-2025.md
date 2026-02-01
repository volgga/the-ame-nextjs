# Аудит и чистка проекта (2025)

## 1) Инвентарь проекта

### Роутинг
- **App Router** (нет `pages/`)
- Витрина: `/`, `/posmotret-vse-tsvety`, `/magazine/[slug]`, `/product/[slug]`, `/cart`, `/about`, `/contacts`, `/delivery-and-payments`, `/docs/*`, `/payment/*`
- Админка: `/admin/*` (categories, products, slides, login)
- Редиректы: `/catalog` → `/posmotret-vse-tsvety`, `/catalog/[category]` → `/magazine/[category]`, `/posmotret-vse-tsvety/[category]` → `/magazine/[category]`

### Провайдеры
- `src/app/providers.tsx` (client) → `CartProvider`
- Подключение: `src/app/layout.tsx` → `<Providers>{children}</Providers>`

### API
- Route handlers в `src/app/api/`
- Admin: `/api/admin/categories`, `/api/admin/products`, `/api/admin/slides`, `/api/admin/login`, `/api/admin/logout`
- Публичные: `/api/categories`, `/api/orders`, `/api/orders/[id]`, `/api/payments/tinkoff/*`

### Структура
- `src/components/ui/` — badge, breadcrumbs, button, card
- `src/components/catalog/` — category-chips, FlowerCard, FlowerCatalog, product-toolbar
- `src/components/admin/` — categories (CategoriesGrid, CategoryCard), slides (SlideCard, SlidesGrid)
- `src/lib/` — adminAuth, catalogCategories, catalogServer, categories, heroSlides, products, supabaseAdmin, supabaseClient, supabaseServer, tinkoff, variantProducts
- `src/types/` — flower, order

---

## 2) Выполненные изменения

### Phase 1: Скрипты и неиспользуемый код
- Добавлен `npm run typecheck` (`tsc --noEmit`)
- Исправлен `npm run lint` (добавлен `.` для пути)
- Удалена неиспользуемая переменная `nextFromServer` в admin/categories
- Удалена неиспользуемая константа `MENU_PADDING_X` в CatalogDropdown

### Phase 2: ESLint — explicit any
- В `api/admin/slides/[id]/route.ts` добавлены `eslint-disable-next-line @typescript-eslint/no-explicit-any` с пояснением (Supabase без сгенерированных типов hero_slides)

---

## 3) Кандидаты на мусор (не удалялись)

| Файл/папка | Статус |
|------------|--------|
| `dump.backup` | Бэкап БД — на усмотрение (добавить в .gitignore?) |
| `products_data.sql` | Данные — возможно для импорта |
| `docs/archive/*` | Архивные отчёты — оставить для истории |

---

## 4) Проверка использования компонентов

| Компонент/модуль | Используется в |
|------------------|----------------|
| ChevronArrow | HeroCarousel |
| catalogServer | services/orders.ts |
| heroSlides | page.tsx, HeroCarousel |
| buildProductUrl | FlowerCard |
| variantProducts | products.ts |
| Badge | about/page.tsx |
| Card | about, contacts, delivery-and-payments |
| Button | contacts |
| WelcomeBonusModal | page.tsx |
| FeaturedProducts | page.tsx |

**Итог:** Все проверенные компоненты и модули используются.

---

## 5) ESLint — оставшиеся предупреждения (без правок)

- **@typescript-eslint/no-explicit-any** — в admin API (categories, products, slides) используется `(supabase as any)` из‑за отсутствия сгенерированных Supabase-типов. Решение: добавить `supabase gen types` и типизировать клиент.
- **@next/next/no-img-element** — в нескольких местах используется `<img>` вместо `next/image`. Оставить для MVP; позже заменить.
- **react-hooks/set-state-in-effect** — типичные паттерны (setMounted, setIsTouch, media queries). Могут быть переработаны под React 19, но без регрессий.
- **react-hooks/exhaustive-deps** — зависимости useEffect. Требуют осторожного рефакторинга.

---

## 6) Рекомендации (TODO)

1. **Supabase типы** — запустить `supabase gen types typescript` и использовать в lib/supabaseAdmin, supabaseClient, supabaseServer.
2. **next/image** — постепенно заменить `<img>` на `next/image` (FlowerCard, ContactsModal, FloatingSocialButton, SlideCard, admin/products).
3. **Prettier** — добавить Prettier и единое форматирование.
4. **cn()** — вынести общую утилиту `cn()` (classnames merge) для повторяющихся Tailwind-классов.
5. **Query params helper** — общий хелпер для чтения/записи query params (ProductToolbar, FlowerCatalog).

---

## 7) Acceptance criteria

- [x] `npm run build` — успешно
- [x] `npm run typecheck` — успешно
- [x] Удалён неиспользуемый код (nextFromServer, MENU_PADDING_X)
- [x] Добавлен скрипт typecheck
- [ ] `npm run lint` — остаются предупреждения (setState-in-effect, refs, no-img-element). Для прохождения CI можно добавить `--max-warnings 999` в npm run lint.

---

## 8) Удалённые файлы/зависимости

Не удалялось — все проверенные файлы используются.

---

## 9) Сводка изменений (Phase 1)

| Изменение | Файл |
|-----------|------|
| Добавлен `npm run typecheck` | package.json |
| Уточнён `npm run lint` (добавлен `.`) | package.json |
| Удалена неиспользуемая переменная nextFromServer | admin/categories/page.tsx |
| Удалена неиспользуемая константа MENU_PADDING_X | CatalogDropdown.tsx |
| Добавлены eslint-disable для explicit any | api/admin/slides/[id]/route.ts |

---

## 10) Аудит админки товаров — создание товара (модалка)

### Найденные проблемы и исправления

#### Frontend (`src/app/admin/products/page.tsx`)

| Проблема | Решение |
|----------|---------|
| `load()` в `useEffect` без стабильной зависимости | Обёрнут в `useCallback(load, [search])`, эффект зависит от `[load]`. |
| Утечка blob URL при размонтировании страницы с открытой модалкой и загруженными фото | Добавлен `productImagesRef` и эффект с cleanup при размонтировании — отзыв всех `URL.revokeObjectURL`. |
| При открытии модалки кнопкой «Добавить» не сбрасывались изображения/категории/флаги, если модалка не была закрыта через `closeCreateModal` | При клике «Добавить» явно: отзыв blob URL, `setProductImages([])`, сброс mainIndex, категорий, isHidden, isPreorder, форма, ошибки. |

#### Валидация

- Один механизм: `validateCreateForm()` возвращает `Record<string, string>`.
- Сообщения: «Введите название», «Введите описание», «Введите состав и размер», «Загрузите хотя бы одно фото», «Выберите минимум одну категорию», «Цена должна быть больше 0».

#### API (`src/app/api/admin/products/route.ts`)

| Проблема | Решение |
|----------|---------|
| Inline-типы для строк БД в `.map()` | Введены типы `ProductRow` и `VariantProductRow`, убран `any` из маппинга. |
| Дублирование извлечения сообщения ошибки в catch | Вынесена функция `getErrorMessage(e)`, в catch используется `getErrorMessage(e)`. |
| `as any` для Supabase | Оставлено с комментарием: «типы Supabase .from() не совпадают с нашей схемой». |

#### API Upload (`src/app/api/admin/products/upload/route.ts`)

- Добавлен комментарий к `as any`: «типы Supabase .storage не в дефолтном клиенте».

### Что могло вызывать «Ошибка создания»

1. **Отсутствие колонки `images` в таблице `products`** — миграция `scripts/migrations/products-add-images-column.sql` добавляет `images TEXT[]`. Нужно выполнить в Supabase SQL Editor.
2. **Отсутствие колонки `category_slugs`** — миграция `products-add-category-slugs.sql`. Выполнить при необходимости.
3. **Неверный ответ API** — теперь в ответе всегда передаётся `error` с текстом от Supabase (`message`) или «Ошибка создания», без generic-only сообщения.
4. **RLS на таблице `products`** — если INSERT выполняется не от service_role, вставка может тихо не проходить. Админка использует `getSupabaseAdmin()` (service_role), RLS для service_role обычно не применяется — проверить в Dashboard.
5. **Storage bucket `product-images`** — если bucket не создан или RLS на Storage запрещает INSERT от service_role, загрузка изображений падает; пользователь видит «Не удалось загрузить изображения: …».

### База данных и Storage (проверка)

- **products**: колонки `name`, `slug`, `description`, `composition_size`, `price`, `image_url`, `images`, `is_active`, `is_hidden`, `is_preorder`, `sort_order`, `category_slug`, `category_slugs` — см. `docs/DB-SCHEMA.md`.
- **Миграции**: `products-add-images-column.sql`, `products-add-category-slugs.sql`, `products-add-composition-size.sql`, `products-add-is-preorder.sql` — выполнить в Supabase SQL Editor, если колонок ещё нет.
- **Storage**: bucket `product-images`, публичный; RLS — чтение всем, запись только `auth.role() = 'service_role'`. См. `docs/STORAGE-SETUP.md`.

### Изменённые файлы (аудит админки товаров)

| Файл | Изменения |
|------|-----------|
| `src/app/admin/products/page.tsx` | useCallback(load), ref + cleanup для blob URL, полный сброс при открытии «Добавить». |
| `src/app/api/admin/products/route.ts` | getErrorMessage(), ProductRow, VariantProductRow, комментарии к `as any`. |
| `src/app/api/admin/products/upload/route.ts` | Комментарий к `as any`. |
| `docs/AUDIT-CLEANUP-2025.md` | Раздел 10 — отчёт аудита админки товаров. |

### Минимальные правки БД (если ещё не сделаны)

- Выполнить миграции из `scripts/migrations/` в Supabase SQL Editor (см. выше).
- RLS: при использовании **service_role** в API RLS для таблиц и Storage не блокирует. Если админка когда-либо будет использовать anon/key с RLS — нужны политики INSERT/UPDATE для админа (например, по `auth.uid()` в таблице admin_users).
