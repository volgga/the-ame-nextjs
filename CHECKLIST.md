# Чек-лист проверки работы оптимизации изображений

## 1. Проверка деплоя

### GitHub Actions
- ✅ Откройте https://github.com/volgga/the-ame-nextjs/actions
- ✅ Найдите последний workflow run с коммитом `1767a16` или новее
- ✅ Должна быть **зеленая галочка** ✅ и статус "Deploy to server #XXX completed"
- ✅ В логах должно быть: `✅ Deployment completed successfully!`

### Проверка на сервере
```bash
# SSH на сервер
ssh root@94.103.84.28

# Проверить что PM2 процесс запущен
pm2 list

# Проверить логи
pm2 logs nextjs-project --lines 50

# Проверить что сайт отвечает
curl -I https://theame.ru
```

## 2. Проверка оптимизации изображений в браузере

### Откройте DevTools → Network → Img фильтр

#### Главная страница (`https://theame.ru`)

1. **Hero слайды:**
   - Должны грузиться файлы вида: `*_large.webp` или `*_large.avif`
   - Размер файла: ~200-500KB (не 2-5MB!)
   - Первый слайд: `priority` (загружается сразу)

2. **Блог карточки:**
   - Должны грузиться: `*_medium.webp` или `*_medium.avif`
   - Размер: ~100-300KB

#### Каталог (`/catalog`)

1. **Карточки товаров:**
   - На мобиле: `*_thumb.webp` или `*_medium.webp` (~50-150KB)
   - На десктопе: `*_medium.webp` (~100-300KB)
   - ❌ НЕ должно быть оригиналов (2-5MB файлов)

2. **Проверка в консоли:**
   - Откройте Console в DevTools
   - Если видите предупреждения `[AppImage] Missing imageData` — это нормально для компонентов без imageData (они используют fallback)

#### Страница товара (`/product/[slug]`)

1. **Главное изображение:**
   - Должно грузиться: `*_large.webp` или `*_large.avif`
   - Размер: ~300-800KB
   - `priority` (загружается сразу, eager)

2. **Превью миниатюры:**
   - Должны грузиться: `*_thumb.webp` (~20-80KB)

#### Блог (`/clients/blog`)

1. **Карточки статей:**
   - Должны грузиться: `*_medium.webp` или `*_medium.avif`
   - Размер: ~100-300KB

2. **Hero изображение статьи:**
   - Должно грузиться: `*_large.webp` или `*_large.avif`
   - `priority` (загружается сразу)

## 3. Проверка производительности

### Lighthouse (Chrome DevTools)

1. Откройте DevTools → Lighthouse
2. Выберите: **Mobile**, **Performance**
3. Запустите анализ главной страницы

**Ожидаемые улучшения:**
- ✅ **LCP (Largest Contentful Paint)**: должен быть < 2.5s (лучше < 1.5s)
- ✅ **Total Blocking Time**: должен снизиться
- ✅ **Speed Index**: должен улучшиться
- ✅ **Network**: размер загружаемых изображений должен быть меньше

### Network Tab — проверка размеров

1. Откройте DevTools → Network → Img
2. Отфильтруйте по размеру: найдите файлы > 500KB
3. ❌ **Не должно быть** оригинальных изображений > 1MB в каталоге/карточках
4. ✅ Должны быть только оптимизированные версии (thumb/medium/large)

## 4. Проверка Supabase Egress

### Supabase Dashboard

1. Откройте https://supabase.com/dashboard
2. Перейдите в проект → Settings → Usage
3. Проверьте **Storage Egress** (трафик)
4. После применения оптимизации трафик должен **снизиться на 60-80%**

### Проверка в Network Tab

1. Откройте DevTools → Network
2. Фильтр: `supabase.co/storage`
3. Проверьте размеры запросов:
   - ✅ Карточки каталога: ~50-150KB (не 2-5MB)
   - ✅ Hero слайды: ~200-500KB (не 3-8MB)
   - ✅ Блог карточки: ~100-300KB (не 1-3MB)

## 5. Проверка форматов (AVIF/WebP)

### В Network Tab

1. Найдите загруженные изображения
2. Проверьте **Type** колонку:
   - ✅ Должны быть `image/webp` или `image/avif`
   - ❌ Не должно быть `image/jpeg` или `image/png` (кроме placeholder)

### В Response Headers

1. Кликните на изображение в Network
2. Проверьте **Response Headers**:
   - ✅ `Content-Type: image/webp` или `image/avif`
   - ✅ `Cache-Control: public, max-age=31536000, immutable`

## 6. Проверка работы сайта

### Функциональность

1. ✅ Главная страница открывается
2. ✅ Каталог открывается, карточки товаров отображаются
3. ✅ Страница товара открывается, галерея работает
4. ✅ Блог открывается, статьи отображаются
5. ✅ Модалки (QuickView, FullscreenViewer) работают
6. ✅ Корзина работает
7. ✅ Формы заказов работают

### Визуальная проверка

1. ✅ Изображения не "мыльные" (качество нормальное)
2. ✅ На мобиле изображения загружаются быстро
3. ✅ Нет долгих задержек при прокрутке каталога
4. ✅ LCP (первое изображение) появляется быстро

## 7. Проверка в консоли браузера

### DevTools Console

1. Откройте Console
2. Проверьте предупреждения:
   - ⚠️ `[AppImage] Missing imageData` — это нормально для компонентов без imageData (они используют fallback)
   - ❌ Не должно быть критических ошибок (красные)

### Проверка загружаемых размеров

В Console выполните:
```javascript
// Подсчет размеров загруженных изображений
const images = Array.from(document.querySelectorAll('img'));
const sizes = images.map(img => {
  const src = img.src;
  return fetch(src, {method: 'HEAD'}).then(r => ({
    url: src,
    size: parseInt(r.headers.get('content-length') || '0'),
    type: r.headers.get('content-type')
  }));
});

Promise.all(sizes).then(results => {
  const total = results.reduce((sum, r) => sum + r.size, 0);
  const large = results.filter(r => r.size > 500000);
  console.log(`Всего изображений: ${results.length}`);
  console.log(`Общий размер: ${(total / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Больших файлов (>500KB): ${large.length}`);
  if (large.length > 0) {
    console.warn('Большие файлы:', large);
  }
});
```

## 8. Быстрая проверка (30 секунд)

1. Откройте https://theame.ru в режиме мобильного устройства (DevTools → Toggle device toolbar)
2. Откройте Network → Img
3. Обновите страницу
4. Проверьте:
   - ✅ Первое изображение (LCP) загружается быстро (< 2s)
   - ✅ Размеры файлов < 500KB (большинство < 200KB)
   - ✅ Форматы: webp или avif
   - ✅ Нет оригиналов > 1MB

## Что делать если что-то не работает

### Если деплой не прошел:
1. Проверьте логи в GitHub Actions
2. Проверьте логи на сервере: `pm2 logs nextjs-project`
3. Проверьте что миграция БД применена (если нужно)

### Если изображения грузятся медленно:
1. Проверьте что используются оптимизированные версии (не original)
2. Проверьте что миграция `20250216000006_add_image_variants.sql` применена
3. Запустите `npm run migrate-images` для генерации превью

### Если качество изображений плохое:
1. Проверьте настройки качества в `src/lib/imageGeneration.ts`
2. Увеличьте quality значения если нужно

## Итоговый чек-лист

- [ ] Деплой успешен (зеленая галочка в GitHub Actions)
- [ ] Сайт открывается и работает
- [ ] В Network Tab видны оптимизированные файлы (webp/avif, размеры < 500KB)
- [ ] Нет оригиналов > 1MB в каталоге/карточках
- [ ] Lighthouse Performance улучшился (LCP < 2.5s)
- [ ] Supabase Egress снизился
- [ ] Нет критических ошибок в консоли

**Если все пункты выполнены — оптимизация работает! ✅**
