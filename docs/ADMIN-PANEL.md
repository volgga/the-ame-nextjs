# Админ-панель The Ame

## Обзор

Админка доступна по пути `/admin`. Управляет слайдами, товарами (products + variant_products) и категориями в Supabase.

## Переменные окружения

Добавьте в `.env.local` (см. пошаговую настройку в README):

```env
SUPABASE_SERVICE_ROLE_KEY=ваш_service_role_ключ
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=...   # bcrypt-хеш, не пароль в открытом виде
ADMIN_SESSION_SECRET=...   # случайная строка 32+ символов
```

- **Пароль в открытом виде хранить нельзя** — только `ADMIN_PASSWORD_HASH` (bcrypt). Хеш генерируется скриптом `scripts/hash-admin-password.mjs`.

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
2. Откройте `/admin` (редирект на `/admin/login`)
3. Введите логин и пароль (логин из `ADMIN_USERNAME`; пароль — тот, от которого сгенерирован `ADMIN_PASSWORD_HASH`)

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
| `/admin/home` | Главная страница: коллекции, бегущая дорожка, о нас, форма заказа, FAQ, отзывы |

## Авторизация

- Cookie `admin_session` (httpOnly, session cookie — без срока, сбрасывается при закрытии браузера/уходе с админки)
- Middleware защищает `/admin/*` и `/api/admin/*` (кроме login, logout, me)
- API endpoints проверяют сессию

## Таблицы Supabase

| Таблица | Назначение |
|---------|------------|
| hero_slides | Слайды главной (image_url, sort_order, is_active). File upload в bucket hero-slides. См. docs/SLIDES-SYSTEM.md |
| categories | Категории (name, slug, sort_order, is_active) |
| products | Простые товары (одна цена) |
| variant_products | Товары с вариантами |
| product_variants | Варианты (size, price, composition и т.д.) |
| product_details | Глобальный текст «Подарок при заказе» для всех карточек (одна строка, Товары → Детали) |

## API эндпоинты (внутренние)

- `POST /api/admin/login` — вход (login + password)
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
- `GET/PATCH /api/admin/product-details` — глобальный текст «Подарок при заказе» (модалка «Детали» на странице Товары)
- `GET/PATCH /api/admin/home-marquee` — настройки бегущей дорожки над шапкой (enabled, text, link). Таблица `home_reviews`, миграция `scripts/migrations/home-marquee.sql`.

Все операции используют Service Role key на сервере.

## Тестовый сценарий

1. Залогиниться на `/admin/login`
2. Слайды: добавить слайд, загрузить изображение с компьютера (см. docs/SLIDES-STORAGE.md)
3. Категории: добавить категорию (например, «Авторские букеты», slug `avtorskie-bukety`)
4. Товары: создать простой товар или товар с вариантами
5. Для вариантного товара — добавить варианты (размер/цена)
6. Проверить главную и каталог
