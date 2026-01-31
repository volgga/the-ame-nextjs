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
