# The Ame

Сайт магазина цветов: каталог, корзина, оформление заказа, оплата, уведомления.  
Стек: **Next.js + Supabase**.

## Быстрый старт (локально)

```bash
npm install
npm run dev
```

Приложение будет доступно по адресу: http://localhost:3000

## Деплой

Проект настроен на автоматический деплой через GitHub Actions. При каждом push в ветку `main` происходит автоматический деплой на продакшн сервер.

Подробная документация по деплою: [DEPLOY.md](./DEPLOY.md)

## Структура проекта

- `src/app/` - Next.js App Router страницы и API routes
- `src/lib/` - утилиты и библиотеки (Supabase, Telegram, Tinkoff)
- `src/services/` - бизнес-логика (заказы, продукты)
- `src/types/` - TypeScript типы
- `.github/workflows/` - GitHub Actions для CI/CD
