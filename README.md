# The Ame

Сайт магазина цветов [theame.ru](https://theame.ru): каталог, корзина, оформление заказа, оплата.  
Стек: **Next.js 16** + **Supabase**.

## Установка

```bash
npm install
```

## Запуск (разработка)

```bash
npm run dev
```

Приложение будет доступно по адресу: http://localhost:3000

## Deployment

Деплой выполняется автоматически через **GitHub Actions** при push в ветку `main`.

## Структура проекта

- `src/app/` — Next.js App Router (страницы и API)
- `src/components/` — React-компоненты
- `src/lib/` — утилиты (Supabase, Telegram, Tinkoff)
- `src/services/` — бизнес-логика заказов
- `src/types/` — TypeScript типы
- `.github/workflows/` — GitHub Actions для CI/CD
