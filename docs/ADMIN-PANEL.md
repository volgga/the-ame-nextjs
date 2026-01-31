# Админ-панель The Ame

## Обзор

Админка доступна по пути `/admin`. Управляет слайдами, товарами (products + variant_products) и категориями в Supabase.

## Переменные окружения

Добавьте в `.env.local`:

```env
# Обязательно для админки
SUPABASE_SERVICE_ROLE_KEY=ваш_service_role_ключ
ADMIN_PASSWORD=ваш_пароль_для_входа
```

- **SUPABASE_SERVICE_ROLE_KEY** — из Supabase Dashboard → Settings → API (Service role key). Никогда не передавать на клиент.
- **ADMIN_PASSWORD** — пароль для входа в админку (хранится только в env, не в коде).

## Миграция БД

Перед использованием выполните скрипт в Supabase SQL Editor:

```
scripts/admin-tables-migration.sql
```

Скрипт создаёт:
- `hero_slides` — слайды для главной
- `categories` — категории каталога
- добавляет `category_slug` в `products` и `variant_products`
- включает RLS и политики доступа

**Важно:** Таблицу `orders` скрипт не трогает.

## Запуск

1. `npm run dev`
2. Откройте `/admin`
3. Введите пароль из `ADMIN_PASSWORD`

## Роуты админки

| Путь | Описание |
|------|----------|
| `/admin` | Главная (навигация) |
| `/admin/login` | Вход по паролю |
| `/admin/slides` | Слайды hero |
| `/admin/products` | Список товаров |
| `/admin/products/new` | Создать товар |
| `/admin/products/[id]` | Редактировать товар и варианты |
| `/admin/categories` | Категории |

## Авторизация

- Cookie `admin_session` (httpOnly, 7 дней)
- Middleware защищает `/admin/*` и `/api/admin/*` (кроме login)
- API endpoints проверяют сессию

## Таблицы Supabase

| Таблица | Назначение |
|---------|------------|
| hero_slides | Слайды главной (image_url, sort_order, is_active). File upload в bucket hero-slides. См. docs/SLIDES-SYSTEM.md |
| categories | Категории (name, slug, sort_order, is_active) |
| products | Простые товары (одна цена) |
| variant_products | Товары с вариантами |
| product_variants | Варианты (size, price, composition и т.д.) |

## API эндпоинты (внутренние)

- `POST /api/admin/login` — вход (password)
- `POST /api/admin/logout` — выход
- `GET/POST /api/admin/slides` — слайды
- `POST /api/admin/slides/upload` — загрузка изображения (multipart)
- `POST /api/admin/slides/reorder` — сохранение порядка
- `PATCH/DELETE /api/admin/slides/[id]`
- `GET/POST /api/admin/categories`
- `PATCH/DELETE /api/admin/categories/[id]`
- `GET/POST /api/admin/products`
- `GET/PATCH/DELETE /api/admin/products/[id]`
- `POST /api/admin/products/[id]/variants`
- `PATCH/DELETE /api/admin/products/[id]/variants/[variantId]`

Все операции используют Service Role key на сервере.

## Тестовый сценарий

1. Залогиниться на `/admin/login`
2. Слайды: добавить слайд, загрузить изображение с компьютера (см. docs/SLIDES-STORAGE.md)
3. Категории: добавить категорию (например, «Авторские букеты», slug `avtorskie-bukety`)
4. Товары: создать простой товар или товар с вариантами
5. Для вариантного товара — добавить варианты (размер/цена)
6. Проверить главную и каталог
