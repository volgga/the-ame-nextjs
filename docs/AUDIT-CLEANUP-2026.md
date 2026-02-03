# Аудит репозитория Next.js (The Ame) — 2026

## 1. Карта проекта

### Структура папок

```
src/
├── app/                    # App Router: страницы, layout, api
│   ├── api/                # API routes
│   │   ├── admin/          # Админка: categories, products, slides, login/logout
│   │   ├── categories/     # Публичный список категорий
│   │   ├── one-click-order/# Заявки «Купить в 1 клик» → one_click_orders
│   │   ├── orders/         # Заказы: POST, GET :id, quick (→ orders)
│   │   └── payments/       # Tinkoff: init, notification
│   ├── catalog/            # Редиректы /catalog → /posmotret-vse-tsvety
│   ├── favorites/          # Страница избранного
│   ├── magazine/[slug]/    # Каталог по категории
│   ├── posmotret-vse-tsvety/# Каталог «все цветы»
│   ├── product/[slug]/     # Страница товара
│   └── ...
├── components/
│   ├── admin/              # Админка: CategoriesGrid, CategoryCard, SlideCard, SlidesGrid
│   ├── cart/               # Корзина (модалка): CartDrawer, CartItemsList, CheckoutForm, CheckoutFormModal, QuickBuyModal, UpsellSection
│   ├── catalog/            # Каталог: category-chips, FlowerCard, FlowerCatalog, product-toolbar
│   ├── common/             # CookieConsent
│   ├── header/             # CartIcon, CatalogDropdown, Header, HeaderMain, TopBar, TopMarquee
│   ├── hero/               # ChevronArrow, HeroCarousel
│   ├── home/               # FeaturedProducts
│   ├── product/            # FullscreenViewer, ProductPageClient
│   └── ui/                 # badge, breadcrumbs, button, card — общие UI
├── context/                # CartContext, FavoritesContext
├── lib/                    # Supabase (supabaseAdmin, supabaseClient, supabaseServer), products, categories, catalogServer, heroSlides, variantProducts, tinkoff, adminAuth, catalogCategories
├── services/               # orders
├── types/                  # admin, flower, order
└── utils/                  # buildProductUrl, flyToHeader, slugify
```

### Где что живёт

| Область           | Расположение |
|-------------------|-------------|
| Корзина           | `context/CartContext.tsx`, `components/cart/*` (только модалка, страницы /cart нет) |
| Избранное         | `context/FavoritesContext.tsx`, `app/favorites/*`, header link |
| Каталог           | `app/posmotret-vse-tsvety/`, `app/magazine/[slug]/`, `components/catalog/*`, `lib/catalogCategories.ts` |
| Модалки           | `components/cart/QuickBuyModal.tsx`, `CheckoutFormModal.tsx`, `ContactsModal.tsx`; в ProductPageClient — локальная QuickOrderModal |
| Supabase client   | `lib/supabaseClient.ts` (anon), `lib/supabaseAdmin.ts` (service role), `lib/supabaseServer.ts` |
| API routes       | `app/api/*` — admin, categories, one-click-order, orders, payments |

---

## 2. Мусор и дубли

### Неиспользуемые файлы

| Файл | Причина |
|------|--------|
| `components/ui/button.tsx` | Нигде не импортируется |
| `components/ui/badge.tsx`  | Нигде не импортируется |

### Дубли функциональности

| Что | Где | Рекомендация |
|-----|-----|--------------|
| «Купить в 1 клик» | Каталог: `QuickBuyModal` → `/api/one-click-order` (таблица `one_click_orders`). Страница товара: локальная `QuickOrderModal` в `ProductPageClient` → `/api/orders/quick` (таблица `orders`) | Опционально: перевести страницу товара на `QuickBuyModal` + `/api/one-click-order` и убрать дублирование модалки и эндпоинта |

### Console

- `console.error` / `console.warn` в API routes и в `lib/*` — осознанное логирование ошибок, не мусор.
- Отладочных `console.log` в коде нет.

### Стили

- В `components/ui/card.tsx` захардкожен цвет `text-[#7e7e7e]` — лучше заменить на переменную темы (например `text-color-text-secondary`).

---

## 3. Качество

### TypeScript

- В API и `services/orders.ts` используется `(supabase as any)` из‑за отсутствия сгенерированных типов для таблиц `orders`, `one_click_orders`, `products`, `categories`, `hero_slides`. Рекомендация: при появлении типов Supabase заменить на типизированный клиент.

### Импорты

- Везде используются алиасы `@/` — длинных относительных цепочек нет.
- Циклических зависимостей по результатам поиска не выявлено.

### Нейминг

- Каталог: смешение `catalog` (редиректы, dropdown) и `posmotret-vse-tsvety` / `magazine` — исторически, согласовано с маршрутами.

---

## 4. План правок

### Выполнено в рамках этого аудита

1. **Удалить неиспользуемые UI-компоненты**
   - Удалить `src/components/ui/button.tsx`
   - Удалить `src/components/ui/badge.tsx`
   - Обоснование: нет импортов; при необходимости можно вернуть из git.

### Рекомендации на будущее (не обязательно в этом PR)

2. **Унифицировать «Купить в 1 клик»**  
   В `ProductPageClient` использовать общий `QuickBuyModal` и `POST /api/one-click-order` (productId, productTitle, price, phone, name). После этого можно удалить локальную `QuickOrderModal` и, при согласии с логикой данных, — `POST /api/orders/quick`.

3. **Типы и стили**
   - Ввести типы для Supabase-таблиц (или сгенерировать) и убрать `as any` там, где это возможно.
   - В `ui/card.tsx` заменить `#7e7e7e` на переменную из темы.

4. **Shared UI**  
   Кнопки в карточке товара и в каталоге уже используют общий класс `.product-cta` в `globals.css`. Вынос в отдельный компонент `Button` (например, варианты `primary` / `outline`) — по желанию, после появления реального использования в нескольких местах.

---

## 5. Итог изменений (выполнено)

### Удалённые файлы

| Файл | Причина |
|------|--------|
| `src/components/ui/button.tsx` | Нигде не импортировался |
| `src/components/ui/badge.tsx`  | Нигде не импортировался |

### Изменённые файлы

| Файл | Изменение |
|------|-----------|
| `docs/AUDIT-CLEANUP-2026.md` | Добавлен документ аудита (карта, мусор, качество, план) |
| `src/utils/flyToHeader.ts`   | Исправлена типизация: `target` → `targetEl`, проверка `if (targetEl)` перед использованием в callback (устранены TS18047) |

### Что упрощено и почему

1. **Удалены неиспользуемые UI-компоненты**  
   `button.tsx` и `badge.tsx` ни в одном файле не импортировались. Удаление уменьшает поверхность кода и поддержки; при необходимости компоненты можно восстановить из git.

2. **Исправлена типизация в `flyToHeader.ts`**  
   В асинхронном callback `target` считался возможно `null`. Переименование в `targetEl`, ранний `return` при отсутствии элемента и проверка `if (targetEl)` перед `classList` устраняют предупреждения TypeScript и делают код безопаснее.

### Проверки

- **TypeScript:** `npm run typecheck` — успешно.
- **Сборка:** `npm run build` — успешно.
- **ESLint:** в проекте есть ранее существовавшие ошибки/предупреждения (admin/products, favorites, payment/success, FloatingSocialButton, HeaderMain, FullscreenViewer, ProductPageClient и др.); в рамках этого аудита они не изменялись и новых не добавлено.
