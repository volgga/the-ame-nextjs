# Архитектура проекта The Ame (nextjs-project)

## 1. Сущности и таблицы Supabase

### Используемые таблицы (public)

| Таблица | Назначение | Ключевые поля |
|---------|------------|---------------|
| **hero_slides** | Слайды на главной | id, image_url, sort_order, is_active |
| **categories** | Категории каталога | id, name, slug, sort_order, is_active |
| **products** | Товары без вариантов | id, name, slug, price, image_url, category_slug |
| **variant_products** | Товары с вариантами | id, name, slug, min_price_cache, category_slug |
| **product_variants** | Варианты товаров | id, product_id, size, price |
| **orders** | Заказы | id, items, amount, status, customer |

### Storage buckets

| Bucket | Назначение |
|--------|------------|
| **hero-slides** | Изображения слайдов |

---

## 2. Публичные маршруты

| Путь | Назначение | Файл |
|------|------------|------|
| `/` | Главная страница | `src/app/page.tsx` |
| `/posmotret-vse-tsvety` | Каталог всех товаров | `src/app/posmotret-vse-tsvety/page.tsx` |
| `/magazine/[slug]` | Товары категории | `src/app/magazine/[slug]/page.tsx` |
| `/product/[slug]` | Карточка товара | `src/app/product/[slug]/page.tsx` |
| — | Корзина (модалка) | Нет страницы, только модалка в шапке |
| `/about`, `/contacts`, `/delivery-and-payments` | Статические страницы |

### Редиректы (middleware)

| Старый URL | Новый URL |
|------------|-----------|
| `/catalog` | `/posmotret-vse-tsvety` |
| `/catalog/<slug>` | `/magazine/<slug>` |
| `/posmotret-vse-tsvety/<slug>` | `/magazine/<slug>` |

---

## 3. Маршруты админки

| Путь | Назначение | Файл |
|------|------------|------|
| `/admin` | Главная админки | `src/app/admin/page.tsx` |
| `/admin/slides` | Управление слайдами | `src/app/admin/slides/page.tsx` |
| `/admin/categories` | Управление категориями | `src/app/admin/categories/page.tsx` |
| `/admin/products` | Список товаров | `src/app/admin/products/page.tsx` |
| `/admin/login` | Вход в админку | `src/app/admin/login/page.tsx` |

---

## 4. API endpoints

### Публичные

| Метод | Путь | Назначение |
|-------|------|------------|
| GET | `/api/categories` | Активные категории для меню |
| POST | `/api/orders` | Создание заказа |

### Admin API (защищённые)

| Метод | Путь | Назначение |
|-------|------|------------|
| GET/POST | `/api/admin/slides` | CRUD слайдов |
| POST | `/api/admin/slides/upload` | Upload изображения |
| POST | `/api/admin/slides/reorder` | Сохранение порядка |
| PATCH/DELETE | `/api/admin/slides/[id]` | Обновление/удаление |
| GET/POST | `/api/admin/categories` | CRUD категорий |
| POST | `/api/admin/categories/reorder` | Сохранение порядка |
| GET/POST | `/api/admin/products` | CRUD товаров |

---

## 5. Ключевые файлы

### Компоненты

| Путь | Назначение |
|------|------------|
| `src/components/hero/HeroCarousel.tsx` | Слайдер на главной |
| `src/components/hero/ChevronArrow.tsx` | Стрелки слайдера |
| `src/components/admin/slides/*` | Компоненты админки слайдов |
| `src/components/admin/categories/*` | Компоненты админки категорий |
| `src/components/header/CatalogDropdown.tsx` | Мега-меню каталога |
| `src/components/catalog/FlowerCatalog.tsx` | Каталог товаров |
| `src/components/catalog/FlowerCard.tsx` | Карточка товара в каталоге |

### Библиотеки (src/lib)

| Файл | Назначение |
|------|------------|
| `supabaseClient.ts` | Клиент Supabase (anon) |
| `supabaseAdmin.ts` | Admin клиент (service_role) |
| `heroSlides.ts` | Загрузка активных слайдов |
| `categories.ts` | Загрузка категорий |
| `catalogCategories.ts` | Утилиты категорий, fallback |
| `products.ts` | Загрузка товаров |
| `variantProducts.ts` | Товары с вариантами |
| `adminAuth.ts` | Авторизация админки |

### Middleware

| Файл | Назначение |
|------|------------|
| `src/middleware.ts` | Редиректы, защита админки |

---

## 6. Схема данных (ER)

```
hero_slides (standalone)
   id, image_url, sort_order, is_active

categories (standalone)
   id, name, slug, sort_order, is_active

products ──────────────────────────────┐
   id, name, slug, price, category_slug │
                                        │
variant_products ──────────────────────┤
   id, name, slug, min_price_cache,    │
   category_slug                        │
         │                              │
         └── product_variants           │
              id, product_id, size,     │
              price                     │
                                        │
orders ─────────────────────────────────┘
   id, items (JSONB), amount, status,
   customer, tinkoff_payment_id
```

---

## 7. Авторизация

- **Админка:** cookie-based сессия, проверка в middleware
- **Пароль:** `ADMIN_PASSWORD` в `.env.local`
- **Защита API:** `isAdminAuthenticated()` из `src/lib/adminAuth.ts`

---

## 8. Внешние сервисы

| Сервис | Назначение | Конфигурация |
|--------|------------|--------------|
| Supabase | БД + Storage | `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| Tinkoff | Оплата | См. `docs/PAYMENT-TINKOFF.md` |
