# The Ame — Next.js (магазин цветов)

[Next.js](https://nextjs.org) проект: каталог товаров, корзина, оформление заказа, оплата Tinkoff. Бэкенд данных — Supabase.

## Запуск

```bash
npm install
npm run dev
```

Открой [http://localhost:3000](http://localhost:3000).

## Переменные окружения

Скопируй `.env.example` в `.env.local` и заполни значения:

```bash
cp .env.example .env.local
```

- **NEXT_PUBLIC_SUPABASE_URL**, **NEXT_PUBLIC_SUPABASE_ANON_KEY** — проект Supabase (каталог и заказы).
- **TINKOFF_TERMINAL_KEY**, **TINKOFF_PASSWORD** — Tinkoff Internet Acquiring.
- **TINKOFF_SUCCESS_URL**, **TINKOFF_FAIL_URL**, **TINKOFF_NOTIFICATION_URL** — редиректы и вебхук оплаты.
- **NEXT_PUBLIC_SITE_URL** — базовый URL сайта.

Подробнее по оплате: [docs/PAYMENT-TINKOFF.md](docs/PAYMENT-TINKOFF.md).

## Админ-панель

Админка: `/admin`. Подробнее см. [docs/ADMIN-PANEL.md](docs/ADMIN-PANEL.md).

Дополнительно в `.env.local`:
- `SUPABASE_SERVICE_ROLE_KEY` — для серверных операций
- `ADMIN_PASSWORD` — пароль входа

## Supabase: что должно быть в базе

В схеме **public** используются 4 таблицы:

- **products** — простые товары (одна цена).
- **variant_products** — товары с вариантами (slug, min_price_cache).
- **product_variants** — варианты (размер/тип, цена), связь с variant_products.
- **orders** — заказы (items, amount в копейках, customer, status, оплата Tinkoff).

Схема, FK, индексы и RLS описаны в **[docs/DB-SCHEMA.md](docs/DB-SCHEMA.md)**. Аудит и список миграций — [docs/DB-AUDIT-REPORT.md](docs/DB-AUDIT-REPORT.md), [docs/MIGRATION-HISTORY.md](docs/MIGRATION-HISTORY.md).

Скрипты (выполнять в Supabase SQL Editor при необходимости):

- **scripts/db-fix.sql** — привести orders и каталог к нужной схеме (amount, оплата, FK, индексы).
- **scripts/db-audit.sql** — только чтение: таблицы, колонки, FK, индексы, проверка сирот.
- **scripts/diagnose.sql** — счётчики и сироты по текущим таблицам.
- **scripts/check-db.ts** — локальная проверка: `npm run check-db`.

## Сборка и линт

```bash
npm run build
npm run lint
```

## Деплой

Сборка и деплой как у обычного Next.js (например [Vercel](https://vercel.com)). Не забудь задать переменные окружения в панели деплоя.
