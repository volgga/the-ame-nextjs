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

Автодеплой через GitHub Actions при push в `main`. [DEPLOY.md](./DEPLOY.md)

Standalone-деплой на VPS: [DEPLOY_STANDALONE.md](./DEPLOY_STANDALONE.md)

Для мониторинга памяти при работе через PM2: `pm2 monit`

## Структура проекта

- `src/app/` - Next.js App Router страницы и API routes
- `src/lib/` - утилиты и библиотеки (Supabase, Telegram, Tinkoff)
- `src/services/` - бизнес-логика (заказы, продукты)
- `src/types/` - TypeScript типы
- `.github/workflows/` - GitHub Actions для CI/CD

## Система оптимизации изображений

Проект использует предгенерированные варианты изображений для ускорения загрузки и снижения трафика Supabase.

### Как это работает

1. **Предгенерированные размеры**: При загрузке изображения генерируются 3 размера:
   - `thumb` (~320px) - для карточек каталога
   - `medium` (~768px) - для средних экранов
   - `large` (~1400px) - для страниц товаров и десктопа

2. **Форматы**: Каждый размер генерируется в форматах:
   - WebP (основной)
   - AVIF (опционально, если не больше WebP на 20%+)

3. **Хранение**: Варианты хранятся в Supabase Storage и ссылки сохраняются в БД в полях:
   - `image_thumb_url`, `image_medium_url`, `image_large_url`
   - `image_thumb_avif_url`, `image_medium_avif_url`, `image_large_avif_url`

4. **Рендеринг**: Компонент `AppImage` автоматически использует готовые варианты через `<picture>` с AVIF/WebP, избегая ресайза "на лету".

### Миграция существующих изображений

Для генерации превью для уже загруженных изображений:

```bash
npm run migrate-images
```

Скрипт проходит по всем таблицам (`products`, `variant_products`, `product_variants`, `blog_posts`, `home_slides`) и генерирует варианты для изображений, у которых их еще нет.

### Генерация превью при загрузке

После загрузки изображения в админке можно вызвать API endpoint для генерации превью:

```typescript
POST /api/admin/images/generate-thumbnails
{
  "imageUrl": "https://...",
  "storagePath": "products/image.jpg",
  "bucket": "products"
}
```

### Использование в компонентах

```tsx
import { AppImage } from "@/components/ui/AppImage";

// Автоматически использует готовые варианты если они есть
<AppImage
  src={product.image}
  imageData={{
    image_url: product.image,
    image_thumb_url: product.imageThumbUrl,
    image_medium_url: product.imageMediumUrl,
    // ...
  }}
  variant="card"
/>
```
